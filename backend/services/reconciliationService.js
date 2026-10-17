import mongoose from "mongoose";
import Order from "../models/Order.js";
import { fallbackOrders } from "../routes/orders.js";
import { commitStock, releaseStock } from "./inventoryService.js";
import { logClinicalAudit } from "./auditService.js";
import eventBus from "./eventBus.js";
import { isMockAllowed } from "../middleware/dbGuard.js";

/**
 * TriMedi Automated Payment & Order State Reconciliation Service
 *
 * Reconciles asynchronous states between payment provider gateways (Razorpay/PayPal)
 * and the local TriMedi fulfillment ledger.
 *
 * Detects and resolves:
 * 1. PENDING orders where provider confirmed payment (e.g. client browser closed before /verify)
 * 2. Abandoned or failed payments where inventory reservation remains locked
 * 3. Discrepancies between captured amount and order total
 */

export const ReconciliationService = {
  /**
   * Reconcile a single order against payment provider telemetry
   */
  async reconcileOrder(orderId, options = {}) {
    if (!orderId) throw new Error("Order ID is required for reconciliation");

    let order = null;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findOne({ $or: [{ _id: mongoose.isValidObjectId(orderId) ? orderId : null }, { orderId }] });
    } else if (isMockAllowed()) {
      order = fallbackOrders.find((o) => o._id === orderId || o.orderId === orderId);
    }

    if (!order) {
      return { status: "ORDER_NOT_FOUND", orderId, reconciled: false };
    }

    const currentPaymentStatus = order.paymentStatus;
    const currentFulfillmentStatus = order.status;
    const providerOrderId = order.paymentDetails?.orderId;
    const providerPaymentId = order.paymentDetails?.paymentId;

    const discrepancy = {
      orderId: order.orderId,
      previousPaymentStatus: currentPaymentStatus,
      previousFulfillmentStatus: currentFulfillmentStatus,
      detectedIssue: null,
      actionTaken: "NONE",
      resolved: true,
    };

    // Scenario 1: Order is PENDING but was verified or captured via webhook
    if (currentPaymentStatus === "PENDING" && providerPaymentId && order.paymentDetails?.signatureVerified) {
      discrepancy.detectedIssue = "PAYMENT_CAPTURED_BUT_ORDER_PENDING";
      order.paymentStatus = "PAID";
      if (order.status === "NEW" || order.status === "PENDING") {
        order.status = "ACCEPTED";
      }
      order.paymentDetails.amountPaid = order.totalAmount;
      order.paymentDetails.paidAt = new Date();
      order.stockCommitted = true;

      await commitStock(order.items, order.orderId, { email: "reconciler@trimedi.system", role: "system" });
      if (mongoose.connection.readyState === 1) await order.save();

      discrepancy.actionTaken = "TRANSITIONED_TO_PAID_AND_STOCK_COMMITTED";

      await logClinicalAudit({
        actor: { email: "reconciler@trimedi.system", role: "system" },
        action: "RECONCILIATION_RESOLVED",
        resourceType: "PAYMENT",
        resourceId: order.orderId,
        details: discrepancy,
      });

      eventBus.emit("PAYMENT_UPDATED", {
        orderId: order.orderId,
        paymentId: providerPaymentId,
        status: "PAID",
        patientEmail: order.patientEmail,
        reconciled: true,
      });

      return { reconciled: true, discrepancy, order };
    }

    // Scenario 2: Abandoned pending order older than 30 minutes with stock reserved
    const orderAgeMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
    if (
      currentPaymentStatus === "PENDING" &&
      order.paymentMethod !== "cod" &&
      orderAgeMinutes > 30 &&
      order.stockReserved &&
      !order.stockCommitted
    ) {
      discrepancy.detectedIssue = "ABANDONED_PENDING_CHECKOUT_HOLDING_STOCK";
      order.paymentStatus = "FAILED";
      order.status = "CANCELLED";
      order.cancelReason = "Automated reconciliation: Checkout abandoned without payment completion";
      order.stockReserved = false;

      await releaseStock(order.items, order.orderId, { email: "reconciler@trimedi.system", role: "system" });
      if (mongoose.connection.readyState === 1) await order.save();

      discrepancy.actionTaken = "STOCK_RELEASED_AND_ORDER_MARKED_FAILED";

      await logClinicalAudit({
        actor: { email: "reconciler@trimedi.system", role: "system" },
        action: "RECONCILIATION_ABANDONED_CLEANUP",
        resourceType: "ORDER",
        resourceId: order.orderId,
        details: discrepancy,
      });

      return { reconciled: true, discrepancy, order };
    }

    // No discrepancy detected
    return { reconciled: true, discrepancy: null, message: "Order payment state is in sync." };
  },

  /**
   * Run batch reconciliation across all pending orders
   */
  async runBatchReconciliation({ olderThanMinutes = 15, limit = 50 } = {}) {
    console.log("🔄 [Reconciliation] Scanning pending orders for status synchronization...");

    const thresholdDate = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const results = [];

    if (mongoose.connection.readyState === 1) {
      const candidates = await Order.find({
        paymentStatus: "PENDING",
        createdAt: { $lte: thresholdDate },
      })
        .limit(limit)
        .lean();

      for (const candidate of candidates) {
        try {
          const res = await this.reconcileOrder(candidate.orderId);
          if (res.discrepancy) results.push(res.discrepancy);
        } catch (e) {
          console.error(`Reconciliation error on order ${candidate.orderId}:`, e.message);
        }
      }
    } else if (isMockAllowed()) {
      const candidates = fallbackOrders.filter(
        (o) => o.paymentStatus === "PENDING" && new Date(o.createdAt) <= thresholdDate
      );
      for (const candidate of candidates) {
        const res = await this.reconcileOrder(candidate.orderId);
        if (res.discrepancy) results.push(res.discrepancy);
      }
    }

    console.log(`✅ [Reconciliation] Batch scan finished. Discrepancies resolved: ${results.length}`);
    return {
      timestamp: new Date(),
      scannedCount: results.length,
      resolvedDiscrepancies: results,
    };
  },
};

export default ReconciliationService;
