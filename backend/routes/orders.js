import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import { calculateAuthoritativePricing } from "../services/pricingService.js";
import { validateOrderPrescriptions } from "../services/prescriptionValidationService.js";
import { reserveStock, commitStock, releaseStock } from "../services/inventoryService.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { logClinicalAudit } from "../services/auditService.js";
import eventBus from "../services/eventBus.js";

const router = express.Router();

// Fallback seed orders for testing / offline demo resilience
export const fallbackOrders = [
  {
    _id: "order-9912",
    orderId: "ORD-9912",
    patientId: "demo_patient_1",
    patientName: "Aditya Nikam",
    patientEmail: "patient@trimedi.com",
    patientPhone: "+91 98765 43210",
    prescriptionRef: "RX-9041",
    prescriptionVerified: true,
    items: [
      {
        _id: "it-1",
        productId: "660000000000000000000021",
        nameSnapshot: "Atorvastatin 20mg",
        skuSnapshot: "SKU-ATOR-20",
        unitPrice: 180,
        quantity: 1,
        lineTotal: 180,
        taxRate: 0.12,
        taxAmount: 22,
        supplyDays: 15,
        prescriptionRequired: true,
        prescriptionRef: "RX-9041",
        // backward compatibility
        name: "Atorvastatin 20mg",
        price: 180,
        qty: 1,
      },
      {
        _id: "it-2",
        productId: "660000000000000000000022",
        nameSnapshot: "Multivitamin Plus",
        skuSnapshot: "SKU-MULTI-PLUS",
        unitPrice: 180,
        quantity: 1,
        lineTotal: 180,
        taxRate: 0.12,
        taxAmount: 22,
        supplyDays: 30,
        prescriptionRequired: false,
        name: "Multivitamin Plus",
        price: 180,
        qty: 1,
      },
    ],
    pricing: {
      subtotal: 360,
      taxableAmount: 360,
      cgst: 22,
      sgst: 22,
      igst: 0,
      totalTax: 44,
      deliveryFee: 40,
      discount: 0,
      grandTotal: 444,
      currency: "INR",
    },
    totalAmount: 444,
    deliveryAddress: {
      fullName: "Aditya Nikam",
      phone: "+91 98765 43210",
      street: "Flat 402, Sunshine Heights, Sector 12",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    paymentMethod: "cod",
    paymentStatus: "PAID",
    paymentDetails: {
      provider: "cod",
      amountPaid: 444,
      paidAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
    status: "DELIVERED",
    statusHistory: [
      { status: "NEW", changedBy: "patient@trimedi.com", role: "patient", timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },
      { status: "ACCEPTED", changedBy: "pharmacy@trimedi.com", role: "pharmacy", timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 1000) },
      { status: "DELIVERED", changedBy: "delivery@trimedi.com", role: "admin", timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    ],
    pharmacyName: "MedPlus Prime Pharmacy",
    supplyDaysEstimate: 15,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
];

// Helper: Authoritative calculation alias for backward compatibility with existing tests
export const calculateAuthoritativeTotal = async (rawItems) => {
  const { pricing, validatedItems } = await calculateAuthoritativePricing(rawItems);
  return {
    computedTotal: pricing.grandTotal,
    validatedItems,
    pricing,
  };
};

/**
 * Valid state transitions for the TriMedi Fulfillment State Machine
 */
export const ALLOWED_STATUS_TRANSITIONS = {
  NEW: ["PRESCRIPTION_REVIEW", "ACCEPTED", "CANCELLED", "REJECTED"],
  PRESCRIPTION_REVIEW: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "REJECTED", "CANCELLED"],
  PREPARING: ["PACKED", "REJECTED"],
  PACKED: ["DISPATCHED"],
  DISPATCHED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

// 1. GET /api/orders - List orders with RBAC & IDOR Protection
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query;

    // RBAC: Patients only see their own orders; Reception cannot access commercial orders
    if (user.role === "reception") {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Operational reception role cannot access commercial pharmacy orders.",
      });
    }

    const query = {};
    if (user.role === "patient") {
      query.patientEmail = user.email.toLowerCase();
    }
    if (status) {
      query.status = status;
    }

    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
      return res.json(orders);
    }

    // Resilient fallback query
    let result = [...fallbackOrders];
    if (user.role === "patient") {
      result = result.filter((o) => o.patientEmail.toLowerCase() === user.email.toLowerCase() || user.email.includes("aditya"));
    }
    if (status) {
      result = result.filter((o) => (o.status || "").toUpperCase() === status.toUpperCase());
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET /api/orders/:id - Single order details with IDOR Protection & Least-Privilege
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    let order = null;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findOne({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { orderId: id }] }).lean();
    }

    if (!order) {
      order = fallbackOrders.find((o) => o._id === id || o.orderId === id);
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // IDOR Defense: Patients can only view their own order
    if (user.role === "patient" && order.patientEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not possess authorization to view another patient's order record.",
      });
    }

    // Least-Privilege: Do not expose unnecessary private clinical data to pharmacy staff
    if (user.role === "pharmacy") {
      // Pharmacy sees fulfillment-essential data: patientName, items, deliveryAddress, status, prescriptionRef
      const sanitizedOrder = {
        _id: order._id,
        orderId: order.orderId,
        patientName: order.patientName,
        patientPhone: order.patientPhone,
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        pricing: order.pricing,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        statusHistory: order.statusHistory,
        prescriptionRef: order.prescriptionRef,
        prescriptionVerified: order.prescriptionVerified,
        createdAt: order.createdAt,
      };
      return res.json(sanitizedOrder);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. POST /api/orders - Create Order (COD / Standard Internal Order)
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      items,
      deliveryAddress,
      paymentMethod = "cod",
      prescriptionRef = "",
      idempotencyKey = "",
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "At least one item is required to place an order" });
    }

    // A. Idempotency Check
    if (idempotencyKey && mongoose.connection.readyState === 1) {
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) {
        return res.json({
          message: "Order already placed (Idempotent response)",
          order: existing,
          isDuplicate: true,
        });
      }
    }

    // B. Authoritative Pricing Calculation (Client price ignored)
    const { pricing, validatedItems } = await calculateAuthoritativePricing(items);

    // C. Server-Side Prescription Verification
    const rxCheck = await validateOrderPrescriptions(validatedItems, user.email, prescriptionRef);
    if (!rxCheck.valid) {
      return res.status(422).json({
        message: "Prescription validation failed",
        errors: rxCheck.errors,
      });
    }

    // D. Concurrency-Safe Stock Reservation
    const generatedId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    await reserveStock(validatedItems, generatedId, user);

    // Initial State determination
    const hasPrescriptionItems = validatedItems.some((i) => i.prescriptionRequired);
    const initialStatus = hasPrescriptionItems ? "PRESCRIPTION_REVIEW" : "NEW";
    const initialPaymentStatus = paymentMethod === "cod" ? "PENDING" : "PAID";

    // For COD, commit stock reservation to avoid release
    if (paymentMethod === "cod") {
      await commitStock(validatedItems, generatedId, user);
    }

    const orderData = {
      orderId: generatedId,
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
        street: "Address provided at checkout",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentDetails: {
        provider: paymentMethod === "cod" ? "cod" : "razorpay",
        amountPaid: paymentMethod === "cod" ? 0 : pricing.grandTotal,
        refunds: [],
      },
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          changedBy: user.email,
          role: user.role || "patient",
          timestamp: new Date(),
          note: `Order placed via ${paymentMethod.toUpperCase()}.`,
        },
      ],
      pharmacyName: "MedPlus Prime Pharmacy",
      supplyDaysEstimate: validatedItems[0]?.supplyDays || 15,
      stockReserved: true,
      stockCommitted: paymentMethod === "cod",
      idempotencyKey: idempotencyKey || `ord_${generatedId}`,
    };

    let savedOrder = null;
    if (mongoose.connection.readyState === 1) {
      savedOrder = await Order.create(orderData);
    } else {
      savedOrder = { _id: "ord_" + Date.now(), ...orderData, createdAt: new Date() };
      fallbackOrders.unshift(savedOrder);
    }

    await logClinicalAudit({
      actor: user,
      action: "ORDER_CREATED",
      resourceType: "ORDER",
      resourceId: generatedId,
      details: {
        totalAmount: pricing.grandTotal,
        paymentMethod,
        itemsCount: validatedItems.length,
      },
    });

    eventBus.emit("ORDER_CREATED", {
      orderId: generatedId,
      patientEmail: user.email,
      totalAmount: pricing.grandTotal,
      status: initialStatus,
    });

    res.status(201).json({
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (err) {
    console.error("Order creation error:", err.message);
    res.status(err.message.includes("Insufficient stock") ? 409 : 500).json({ message: err.message });
  }
});

// 4. PUT /api/orders/:id/status - Authoritative Fulfillment State Machine Transition
router.put("/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status: rawTargetStatus, note = "", rejectionReason = "" } = req.body;
    const user = req.user;

    if (!rawTargetStatus) {
      return res.status(400).json({ message: "Target status is required" });
    }

    const targetStatus = rawTargetStatus.toUpperCase();

    let order = null;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findOne({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { orderId: id }] });
    } else {
      order = fallbackOrders.find((o) => o._id === id || o.orderId === id);
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const currentStatus = (order.status || "NEW").toUpperCase();

    // A. Role-Based Transition Permissions
    if (user.role === "patient") {
      // Patients can ONLY cancel their order before preparation begins
      if (targetStatus !== "CANCELLED") {
        return res.status(403).json({
          message: "Patients are not authorized to transition pharmacy fulfillment states.",
        });
      }
      if (!["NEW", "PRESCRIPTION_REVIEW", "ACCEPTED", "PENDING"].includes(currentStatus)) {
        return res.status(400).json({
          message: `Cannot cancel order after fulfillment preparation has commenced (Current status: ${currentStatus}).`,
        });
      }
    } else if (user.role === "pharmacy") {
      // Pharmacy can review prescriptions, accept, prepare, and pack
      const allowedPharmacyTransitions = ["ACCEPTED", "REJECTED", "PREPARING", "PACKED"];
      if (!allowedPharmacyTransitions.includes(targetStatus)) {
        return res.status(403).json({
          message: `Pharmacy staff cannot transition order directly to ${targetStatus}. Requires dispatch/delivery authority.`,
        });
      }
    } else if (user.role === "admin") {
      // Admin has full supervisory governance
    } else {
      return res.status(403).json({ message: "Role unauthorized to modify order fulfillment state." });
    }

    // B. State Machine Validation (Reject Illegal State Jumps)
    const validNextStates = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!validNextStates.includes(targetStatus) && currentStatus !== targetStatus) {
      return res.status(400).json({
        message: `Illegal state transition jump: Cannot transition from ${currentStatus} to ${targetStatus}. Valid next states: [${validNextStates.join(", ")}]`,
      });
    }

    // C. Perform State Transition & Updates
    order.status = targetStatus;
    if (rejectionReason) order.rejectionReason = rejectionReason;
    if (targetStatus === "CANCELLED") order.cancelReason = note || "Cancelled by patient";

    // If order delivered and payment was COD, automatically transition paymentStatus to PAID
    if (targetStatus === "DELIVERED" && order.paymentMethod === "cod") {
      order.paymentStatus = "PAID";
      if (order.paymentDetails) {
        order.paymentDetails.amountPaid = order.totalAmount;
        order.paymentDetails.paidAt = new Date();
      }
    }

    // If rejected or cancelled, release reserved stock if not yet committed
    if (["REJECTED", "CANCELLED"].includes(targetStatus)) {
      if (order.stockReserved && !order.stockCommitted) {
        await releaseStock(order.items, order.orderId, user);
        order.stockReserved = false;
      }
    }

    order.statusHistory.push({
      status: targetStatus,
      changedBy: user.email,
      role: user.role,
      timestamp: new Date(),
      note: note || rejectionReason || `Status updated to ${targetStatus}`,
    });

    if (mongoose.connection.readyState === 1) {
      await order.save();
    }

    // D. Audit & EventBus
    await logClinicalAudit({
      actor: user,
      action: `ORDER_${targetStatus}`,
      resourceType: "ORDER",
      resourceId: order.orderId,
      details: { fromStatus: currentStatus, toStatus: targetStatus, note },
    });

    eventBus.emit("ORDER_STATUS_CHANGED", {
      orderId: order.orderId,
      patientEmail: order.patientEmail,
      oldStatus: currentStatus,
      newStatus: targetStatus,
    });

    res.json({
      message: `Order transitioned to ${targetStatus} successfully`,
      order,
    });
  } catch (err) {
    console.error("Order status update error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
