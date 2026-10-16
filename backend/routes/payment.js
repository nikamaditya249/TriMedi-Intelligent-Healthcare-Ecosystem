import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import PaymentService, { RazorpayProvider } from "../services/paymentService.js";
import { calculateAuthoritativePricing } from "../services/pricingService.js";
import { validateOrderPrescriptions } from "../services/prescriptionValidationService.js";
import { reserveStock, commitStock, releaseStock } from "../services/inventoryService.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { logClinicalAudit } from "../services/auditService.js";
import eventBus from "../services/eventBus.js";

const router = express.Router();

// 1. GET /api/payment/config - Public configuration for client SDKs
router.get("/config", (req, res) => {
  res.json(PaymentService.getPublicConfig());
});

// 2. POST /api/payment/razorpay/create-order - Authoritative order creation with stock reservation
router.post("/razorpay/create-order", requireAuth, async (req, res) => {
  try {
    const { items, deliveryAddress, prescriptionRef = "", idempotencyKey = "" } = req.body;
    const user = req.user;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "Cart items are required" });
    }

    // A. Authoritative Price Calculation (Client price ignored)
    const { pricing, validatedItems } = await calculateAuthoritativePricing(items);

    // B. Prescription Verification for Controlled Medicines
    const rxCheck = await validateOrderPrescriptions(validatedItems, user.email, prescriptionRef);
    if (!rxCheck.valid) {
      return res.status(422).json({
        success: false,
        message: "Prescription validation failed",
        errors: rxCheck.errors,
      });
    }

    // C. Concurrency-Safe Stock Reservation
    const draftId = `DRAFT-${Date.now()}`;
    await reserveStock(validatedItems, draftId, user);

    // D. Razorpay Order Creation via Provider
    const rzpOrder = await RazorpayProvider.createOrder({
      amountINR: pricing.grandTotal,
      currency: "INR",
      receipt: `rcpt_${draftId}`,
      notes: {
        patientEmail: user.email,
        patientName: user.name,
      },
    });

    await logClinicalAudit({
      actor: user,
      action: "PAYMENT_INITIATED",
      resourceType: "PAYMENT",
      resourceId: rzpOrder.id,
      details: {
        amountINR: pricing.grandTotal,
        itemsCount: validatedItems.length,
        rzpOrderId: rzpOrder.id,
      },
    });

    res.json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      currency: rzpOrder.currency,
      pricing,
      validatedItems,
      keyId: PaymentService.getPublicConfig().razorpay.keyId,
    });
  } catch (err) {
    console.error("Create payment order error:", err.message);
    res.status(err.message.includes("Insufficient stock") ? 409 : 500).json({
      success: false,
      message: err.message,
    });
  }
});

// 3. POST /api/payment/razorpay/verify - Cryptographic signature verification and order confirmation
router.post("/razorpay/verify", requireAuth, async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      deliveryAddress,
      prescriptionRef = "",
      idempotencyKey = "",
    } = req.body;
    const user = req.user;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Missing razorpayOrderId, razorpayPaymentId, or razorpaySignature",
      });
    }

    // A. Cryptographic Signature Verification (HMAC SHA-256)
    const isValidSignature = RazorpayProvider.verifySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      await logClinicalAudit({
        actor: user,
        action: "PAYMENT_FAILED",
        resourceType: "PAYMENT",
        resourceId: razorpayPaymentId,
        details: { reason: "Cryptographic signature mismatch", razorpayOrderId },
        status: "FAILED",
      });

      return res.status(400).json({
        success: false,
        message: "Cryptographic payment verification failed. Untrusted payment signature.",
      });
    }

    // B. Idempotency Check: Prevent duplicate order creation on replay
    if (mongoose.connection.readyState === 1) {
      const existingOrder = await Order.findOne({
        $or: [
          { "paymentDetails.paymentId": razorpayPaymentId },
          { "paymentDetails.orderId": razorpayOrderId },
          { idempotencyKey: idempotencyKey ? idempotencyKey : null },
        ].filter(Boolean),
      });

      if (existingOrder) {
        return res.json({
          success: true,
          message: "Payment already verified (Idempotent replay)",
          order: existingOrder,
          isDuplicate: true,
        });
      }
    }

    // C. Authoritative Pricing Calculation
    const { pricing, validatedItems } = await calculateAuthoritativePricing(items || []);

    // D. Re-validate Prescriptions
    const rxCheck = await validateOrderPrescriptions(validatedItems, user.email, prescriptionRef);
    if (!rxCheck.valid) {
      return res.status(422).json({
        success: false,
        message: "Prescription re-validation failed at checkout",
        errors: rxCheck.errors,
      });
    }

    // E. Commit Stock Permanently
    const generatedOrderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    await commitStock(validatedItems, generatedOrderId, user);

    // Initial status: If order contains prescription-required items, requires PRESCRIPTION_REVIEW by pharmacy; else ACCEPTED
    const hasPrescriptionItems = validatedItems.some((i) => i.prescriptionRequired);
    const initialStatus = hasPrescriptionItems ? "PRESCRIPTION_REVIEW" : "ACCEPTED";

    // F. Persist Confirmed TriMedi Order
    const orderData = {
      orderId: generatedOrderId,
      patientId: user._id,
      patientName: user.name,
      patientEmail: user.email.toLowerCase(),
      patientPhone: deliveryAddress?.phone || "+91 98765 43210",
      prescriptionRef: rxCheck.verifiedPrescriptions[0] || prescriptionRef,
      prescriptionVerified: rxCheck.valid,
      items: validatedItems,
      pricing,
      totalAmount: pricing.grandTotal,
      deliveryAddress: deliveryAddress || {
        fullName: user.name,
        phone: "+91 98765 43210",
        street: "Address confirmed at checkout",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      paymentMethod: "razorpay",
      paymentStatus: "PAID",
      paymentDetails: {
        provider: "razorpay",
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        signature: razorpaySignature,
        signatureVerified: true,
        amountPaid: pricing.grandTotal,
        paidAt: new Date(),
        refunds: [],
      },
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          changedBy: user.email,
          role: user.role || "patient",
          timestamp: new Date(),
          note: `Payment verified via Razorpay (${razorpayPaymentId}). Order routed to pharmacy.`,
        },
      ],
      pharmacyName: "MedPlus Prime Pharmacy",
      supplyDaysEstimate: validatedItems[0]?.supplyDays || 15,
      stockReserved: true,
      stockCommitted: true,
      idempotencyKey: idempotencyKey || `rzp_${razorpayPaymentId}`,
    };

    let savedOrder = null;
    if (mongoose.connection.readyState === 1) {
      savedOrder = await Order.create(orderData);
    } else {
      savedOrder = { _id: "ord_" + Date.now(), ...orderData, createdAt: new Date() };
    }

    // G. Audit Logging
    await logClinicalAudit({
      actor: user,
      action: "PAYMENT_VERIFIED",
      resourceType: "PAYMENT",
      resourceId: razorpayPaymentId,
      details: {
        orderId: generatedOrderId,
        amountINR: pricing.grandTotal,
        provider: "razorpay",
      },
    });

    await logClinicalAudit({
      actor: user,
      action: "ORDER_CREATED",
      resourceType: "ORDER",
      resourceId: generatedOrderId,
      details: {
        itemsCount: validatedItems.length,
        totalAmount: pricing.grandTotal,
        paymentStatus: "PAID",
      },
    });

    // H. EventBus Broadcast
    eventBus.emit("ORDER_CREATED", {
      orderId: generatedOrderId,
      patientEmail: user.email,
      totalAmount: pricing.grandTotal,
      status: initialStatus,
    });

    eventBus.emit("PAYMENT_UPDATED", {
      orderId: generatedOrderId,
      paymentId: razorpayPaymentId,
      status: "PAID",
      patientEmail: user.email,
    });

    res.json({
      success: true,
      message: "Payment cryptographically verified and order confirmed successfully",
      order: savedOrder,
    });
  } catch (err) {
    console.error("Payment verification error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST /api/payment/razorpay/webhook - Idempotent payment webhook processing
router.post("/razorpay/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const event = req.body;

    if (!event || !event.event) {
      return res.status(400).json({ message: "Malformed webhook payload" });
    }

    // Check Idempotency: Duplicate webhooks must not create duplicate actions
    const eventId = event.payload?.payment?.entity?.id || event.id || `${event.event}_${Date.now()}`;
    if (PaymentService.isEventProcessed(eventId)) {
      return res.json({ status: "ok", duplicate: true, message: "Webhook already processed" });
    }

    PaymentService.markEventProcessed(eventId);

    // Handle payment.captured
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (mongoose.connection.readyState === 1 && rzpOrderId) {
        await Order.findOneAndUpdate(
          { "paymentDetails.orderId": rzpOrderId },
          {
            $set: {
              paymentStatus: "PAID",
              "paymentDetails.paymentId": rzpPaymentId,
              "paymentDetails.amountPaid": (paymentEntity.amount || 0) / 100,
              "paymentDetails.paidAt": new Date(),
            },
          }
        );
      }
    }

    // Handle payment.failed
    if (event.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;

      if (mongoose.connection.readyState === 1 && rzpOrderId) {
        const order = await Order.findOne({ "paymentDetails.orderId": rzpOrderId });
        if (order && order.stockReserved && !order.stockCommitted) {
          await releaseStock(order.items, order.orderId);
          await Order.findByIdAndUpdate(order._id, {
            $set: { paymentStatus: "FAILED", stockReserved: false },
          });
        }
      }
    }

    await logClinicalAudit({
      actor: { email: "razorpay_webhook@gateway.com", role: "system" },
      action: "WEBHOOK_RECEIVED",
      resourceType: "WEBHOOK",
      resourceId: eventId,
      details: { event: event.event },
    });

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/payment/refund - Server-verified refund for pharmacy rejection or cancellation
router.post("/refund", requireAuth, requireRole(["pharmacy", "admin"]), async (req, res) => {
  try {
    const { orderId, reason = "Pharmacy rejected order / Out of stock" } = req.body;
    const user = req.user;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required for refund" });
    }

    let order = null;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findOne({ $or: [{ _id: orderId }, { orderId }] });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== "PAID") {
      return res.status(400).json({
        success: false,
        message: `Cannot refund order with payment status "${order.paymentStatus}"`,
      });
    }

    // Call Provider Refund
    const paymentId = order.paymentDetails?.paymentId || order.paypalCaptureId || "test_payment_id";
    const refundResult = await RazorpayProvider.initiateRefund({
      paymentId,
      amountINR: order.totalAmount,
      reason,
    });

    // Update order status
    order.paymentStatus = "REFUNDED";
    order.status = "REJECTED";
    order.rejectionReason = reason;
    order.paymentDetails.refunds.push({
      refundId: refundResult.refundId,
      amount: order.totalAmount,
      status: "PROCESSED",
      reason,
      providerRefundRef: refundResult.providerRefundRef,
      createdAt: new Date(),
    });
    order.statusHistory.push({
      status: "REJECTED",
      changedBy: user.email,
      role: user.role,
      timestamp: new Date(),
      note: `Refund processed: ₹${order.totalAmount}. Reason: ${reason}`,
    });

    if (mongoose.connection.readyState === 1) {
      await order.save();
    }

    // Release stock
    await releaseStock(order.items, order.orderId, user);

    await logClinicalAudit({
      actor: user,
      action: "REFUND_COMPLETED",
      resourceType: "PAYMENT",
      resourceId: refundResult.refundId,
      details: {
        orderId: order.orderId,
        amountINR: order.totalAmount,
        reason,
      },
    });

    eventBus.emit("REFUND_UPDATED", {
      orderId: order.orderId,
      patientEmail: order.patientEmail,
      amount: order.totalAmount,
      status: "REFUNDED",
    });

    res.json({
      success: true,
      message: "Refund initiated and processed successfully",
      refund: refundResult,
      order,
    });
  } catch (err) {
    console.error("Refund error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;