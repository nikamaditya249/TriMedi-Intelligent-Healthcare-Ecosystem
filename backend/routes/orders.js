import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { defaultProducts } from "../data/defaultProducts.js";
import eventBus from "../services/eventBus.js";

const router = express.Router();

const fallbackOrders = [
  {
    _id: "order-9912",
    orderId: "ORD-9912",
    patientId: "demo_patient_1",
    patientName: "Aditya Nikam",
    patientEmail: "patient@trimedi.com",
    patientPhone: "+91 98765 43210",
    prescriptionRef: "RX-9041",
    items: [
      {
        _id: "it-1",
        productId: "660000000000000000000017",
        name: "Atorvastatin 20mg",
        price: 180,
        qty: 1,
        quantity: 15,
        supplyDays: 15,
      },
      {
        _id: "it-2",
        productId: "660000000000000000000037",
        name: "Multivitamin Plus",
        price: 300,
        qty: 1,
        quantity: 30,
        supplyDays: 30,
      },
    ],
    totalAmount: 480,
    deliveryAddress: {
      fullName: "Aditya Nikam",
      phone: "+91 98765 43210",
      street: "Flat 402, Sunshine Heights, Sector 12",
      pincode: "400001",
    },
    paymentMethod: "cod",
    paymentStatus: "PAID",
    status: "Delivered",
    pharmacyName: "MedPlus Prime Pharmacy",
    supplyDaysEstimate: 15,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "order-8841",
    orderId: "ORD-8841",
    patientId: "demo_patient_1",
    patientName: "Aditya Nikam",
    patientEmail: "patient@trimedi.com",
    patientPhone: "+91 98765 43210",
    prescriptionRef: "RX-8832",
    items: [
      {
        _id: "it-3",
        productId: "660000000000000000000017",
        name: "Metformin 500mg",
        price: 120,
        qty: 2,
        quantity: 60,
        supplyDays: 60,
      },
      {
        _id: "it-4",
        productId: "660000000000000000000020",
        name: "Glucometer Test Strips",
        price: 480,
        qty: 1,
        quantity: 1,
        supplyDays: 60,
      },
    ],
    totalAmount: 720,
    deliveryAddress: {
      fullName: "Aditya Nikam",
      phone: "+91 98765 43210",
      street: "Flat 402, Sunshine Heights, Sector 12",
      pincode: "400001",
    },
    paymentMethod: "paypal",
    paymentStatus: "PAID",
    paypalOrderId: "PAYPAL-ORDER-8829104",
    paypalCaptureId: "CAPTURE-99102",
    status: "Delivered",
    pharmacyName: "MedPlus Prime Pharmacy",
    supplyDaysEstimate: 60,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
];

// Helper: Authoritative calculation of item prices from database / fallback catalog
export const calculateAuthoritativeTotal = async (rawItems) => {
  let computedTotal = 0;
  const validatedItems = [];

  for (const item of rawItems) {
    let product = null;

    if (mongoose.connection.readyState === 1 && item.productId) {
      try {
        product = await Product.findById(item.productId);
      } catch (e) {
        // ignore format errors
      }
    }

    if (!product) {
      product = defaultProducts.find(
        (p) => String(p._id) === String(item.productId || item._id) || p.name.toLowerCase() === item.name?.toLowerCase()
      );
    }

    const unitPrice = product ? product.price : Number(item.price) || 50;
    const qty = Math.max(1, Number(item.qty) || Number(item.quantity) || 1);
    const supplyDays = Number(item.supplyDays) || (qty > 1 ? qty * 15 : 15);

    computedTotal += unitPrice * qty;
    validatedItems.push({
      productId: item.productId || item._id || "prod_" + Date.now(),
      name: product ? product.name : item.name,
      price: unitPrice,
      qty,
      quantity: qty,
      supplyDays,
      prescriptionRef: item.prescriptionRef || "",
    });
  }

  return { computedTotal, validatedItems };
};

// GET Orders with role filtering
router.get("/", async (req, res) => {
  try {
    const { patientEmail, status, role } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (role === "patient" && patientEmail) {
        query.patientEmail = patientEmail.toLowerCase();
      }
      if (status) query.status = status;

      const orders = await Order.find(query).sort({ createdAt: -1 });
      if (orders && orders.length > 0) {
        return res.json(orders);
      }
    }

    let result = fallbackOrders;
    if (role === "patient" && patientEmail) {
      result = result.filter(
        (o) => o.patientEmail?.toLowerCase() === patientEmail.toLowerCase() || o.patientName.toLowerCase().includes("aditya")
      );
    }
    if (status) {
      result = result.filter((o) => o.status?.toLowerCase() === status.toLowerCase());
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Single Order by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOne({ $or: [{ _id: id }, { orderId: id }] });
      if (order) return res.json(order);
    }

    const order = fallbackOrders.find((o) => o._id === id || o.orderId === id);
    if (order) return res.json(order);

    res.status(404).json({ message: "Order not found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create Order (COD / UPI / Internal)
router.post("/", async (req, res) => {
  try {
    const {
      patientName,
      patientEmail,
      patientPhone,
      items,
      deliveryAddress,
      paymentMethod = "cod",
      prescriptionRef = "",
    } = req.body;

    if (!patientName || !items || !items.length) {
      return res.status(400).json({ message: "Patient name and at least one item are required" });
    }

    const pEmail = (patientEmail || "patient@trimedi.com").toLowerCase();

    // Calculate authoritative price on backend
    const { computedTotal, validatedItems } = await calculateAuthoritativeTotal(items);

    const generatedId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const initialPaymentStatus = paymentMethod === "cod" ? "PENDING" : "PAID";
    let savedOrder = null;

    if (mongoose.connection.readyState === 1) {
      savedOrder = await Order.create({
        orderId: generatedId,
        patientName,
        patientEmail: pEmail,
        patientPhone: patientPhone || deliveryAddress?.phone || "+91 98765 43210",
        prescriptionRef,
        items: validatedItems,
        totalAmount: computedTotal,
        deliveryAddress: deliveryAddress || {
          fullName: patientName,
          phone: patientPhone || "+91 98765 43210",
          street: "Address provided during checkout",
          pincode: "400001",
        },
        paymentMethod,
        paymentStatus: initialPaymentStatus,
        status: "Processing",
        supplyDaysEstimate: validatedItems[0]?.supplyDays || 15,
      });
    } else {
      savedOrder = {
        _id: "ord_" + Date.now(),
        orderId: generatedId,
        patientName,
        patientEmail: pEmail,
        patientPhone: patientPhone || deliveryAddress?.phone || "+91 98765 43210",
        prescriptionRef,
        items: validatedItems,
        totalAmount: computedTotal,
        deliveryAddress: deliveryAddress || {
          fullName: patientName,
          phone: patientPhone || "+91 98765 43210",
          street: "Address provided during checkout",
          pincode: "400001",
        },
        paymentMethod,
        paymentStatus: initialPaymentStatus,
        status: "Processing",
        pharmacyName: "MedPlus Prime Pharmacy",
        supplyDaysEstimate: validatedItems[0]?.supplyDays || 15,
        createdAt: new Date(),
      };
      fallbackOrders.unshift(savedOrder);
    }

    // Trigger EventBus Notification
    eventBus.emit("ORDER_CREATED", {
      orderId: savedOrder.orderId || savedOrder._id?.toString(),
      patientEmail: pEmail,
      itemsCount: validatedItems.length,
      totalAmount: computedTotal,
    });

    res.status(201).json({
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Update fulfillment status (Pharmacy / Admin)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    let order = null;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findOneAndUpdate(
        { $or: [{ _id: id }, { orderId: id }] },
        updates,
        { new: true }
      );
    } else {
      order = fallbackOrders.find((o) => o._id === id || o.orderId === id);
      if (order) {
        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
      }
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Trigger EventBus notification for status change
    if (status) {
      eventBus.emit("ORDER_STATUS_CHANGED", {
        orderId: order.orderId || order._id?.toString(),
        patientEmail: order.patientEmail,
        newStatus: status,
      });
    }

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
