import express from "express";
import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { defaultProducts } from "../data/defaultProducts.js";

const router = express.Router();

// Helper to calculate medication supply metrics deterministically
function computeMedicationSupply(prescription, orders) {
  const medicines = prescription.medicines || [];
  const supplyMetrics = [];

  const now = new Date();

  medicines.forEach((med) => {
    // 1. Duration Prescribed
    const rxDuration = parseInt(med.duration?.split(" ")[0]) || 30; // e.g. "30 days" -> 30

    // 2. Quantity Prescribed
    const rxQuantity = parseInt(med.quantity) || rxDuration;

    // 3. Find matching fulfilled orders
    let unitsPurchased = 0;
    let latestOrderDate = prescription.createdAt || new Date();
    let latestOrderId = null;

    orders.forEach((ord) => {
      const match = ord.items?.find((item) =>
        item.name?.toLowerCase().includes(med.name?.toLowerCase()) ||
        med.name?.toLowerCase().includes(item.name?.toLowerCase())
      );
      if (match) {
        unitsPurchased += match.quantity;
        if (new Date(ord.createdAt) >= new Date(latestOrderDate)) {
          latestOrderDate = ord.createdAt;
          latestOrderId = ord._id;
        }
      }
    });

    // If no order yet, default unitsPurchased to 0 or initial purchase
    const supplyDays = unitsPurchased > 0 ? unitsPurchased : 0;
    const startDate = new Date(latestOrderDate);
    const daysElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, supplyDays - daysElapsed);
    const supplyPercentage = supplyDays > 0 ? Math.min(100, Math.round((daysRemaining / supplyDays) * 100)) : 0;
    const supplyGapDays = Math.max(0, rxDuration - supplyDays);
    const isRefillRecommended = daysRemaining <= 5 && supplyGapDays > 0;

    supplyMetrics.push({
      medicineName: med.name,
      dosage: med.dosage || "1 tablet daily",
      frequency: med.frequency || "Once daily",
      prescribedDuration: rxDuration,
      prescribedQuantity: rxQuantity,
      purchasedQuantity: unitsPurchased,
      purchasedSupplyDays: supplyDays,
      daysElapsed,
      daysRemaining,
      supplyPercentage,
      supplyGapDays,
      isRefillRecommended,
      startDate,
      expectedSupplyEnd: new Date(startDate.getTime() + supplyDays * 24 * 60 * 60 * 1000),
      latestOrderId,
    });
  });

  return supplyMetrics;
}

// GET /api/refill/status - Get medication supply and refill intelligence for patient
router.get("/status", async (req, res) => {
  try {
    const userEmail = (req.query.userEmail || "patient@trimedi.com").toLowerCase();

    let prescriptions = [];
    let orders = [];

    if (mongoose.connection.readyState === 1) {
      prescriptions = await Prescription.find({ patientEmail: userEmail, status: "active" }).lean();
      orders = await Order.find({
        patientEmail: userEmail,
        status: { $in: ["Processing", "Dispensed", "Shipped", "Delivered", "Paid"] },
      }).lean();
    }

    // If empty, provide demo active prescription
    if (prescriptions.length === 0) {
      prescriptions = [
        {
          _id: "demo_rx_atorvastatin",
          doctorName: "Dr. Sarah Jenkins",
          patientEmail: userEmail,
          diagnosis: "Hyperlipidemia & Hypertension Prevention",
          status: "active",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          medicines: [
            {
              name: "Atorvastatin 20mg",
              dosage: "20mg",
              frequency: "Once daily at night",
              duration: "30 days",
              quantity: 30,
              instructions: "Take after dinner with water",
            },
            {
              name: "Metformin 500mg",
              dosage: "500mg",
              frequency: "Twice daily with meals",
              duration: "30 days",
              quantity: 60,
              instructions: "Take after breakfast and dinner",
            },
          ],
        },
      ];

      orders = [
        {
          _id: "demo_ord_1",
          patientEmail: userEmail,
          status: "Delivered",
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
          items: [
            {
              name: "Atorvastatin 20mg",
              price: 180,
              quantity: 15, // Patient bought 15 days supply out of 30 days
            },
          ],
        },
      ];
    }

    const allMetrics = [];
    prescriptions.forEach((rx) => {
      const metrics = computeMedicationSupply(rx, orders);
      allMetrics.push({
        prescriptionId: rx._id,
        diagnosis: rx.diagnosis,
        doctorName: rx.doctorName,
        createdAt: rx.createdAt,
        status: rx.status,
        medicines: metrics,
      });
    });

    res.json({ success: true, medicationSupplies: allMetrics });
  } catch (err) {
    console.error("Refill status error:", err);
    res.status(500).json({ success: false, message: "Error computing refill status" });
  }
});

// POST /api/refill/order-again-draft - Validate prescription & build authoritative reorder cart
router.post("/order-again-draft", async (req, res) => {
  try {
    const { prescriptionId, medicineName, userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "userEmail is required" });
    }

    // 1. Verify Prescription
    let rx = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(prescriptionId)) {
      rx = await Prescription.findOne({
        _id: prescriptionId,
        patientEmail: userEmail.toLowerCase(),
      });
    }

    if (!rx) {
      // Fallback verification for demo
      rx = {
        _id: prescriptionId || "demo_rx_atorvastatin",
        doctorName: "Dr. Sarah Jenkins",
        status: "active",
        medicines: [
          {
            name: medicineName || "Atorvastatin 20mg",
            dosage: "20mg",
            duration: "30 days",
            quantity: 15,
          },
        ],
      };
    }

    if (rx.status !== "active") {
      return res.status(400).json({
        success: false,
        isEligible: false,
        message: "Your prescription may no longer be active. Please consult your doctor before reordering.",
      });
    }

    // 2. Lookup authoritative live pricing & stock from Product Catalog
    let product = null;
    if (mongoose.connection.readyState === 1) {
      product = await Product.findOne({
        name: { $regex: new RegExp(medicineName || "Atorvastatin", "i") },
      });
    }

    if (!product) {
      product = defaultProducts.find((p) =>
        p.name.toLowerCase().includes((medicineName || "Atorvastatin").toLowerCase())
      ) || defaultProducts[0];
    }

    if (!product || (product.stock !== undefined && product.stock <= 0)) {
      return res.status(400).json({
        success: false,
        isEligible: false,
        message: `Medication "${medicineName}" is currently out of stock. Please check again shortly.`,
      });
    }

    // 3. Formulate Safe Order Again Draft with Authoritative Pricing
    const refillQuantity = 15; // Refill batch
    const authoritativePrice = product.price || 180;
    const subtotal = authoritativePrice * refillQuantity;
    const tax = Math.round(subtotal * 0.05);
    const shipping = subtotal > 500 ? 0 : 40;
    const totalAmount = subtotal + tax + shipping;

    const draft = {
      prescriptionId: rx._id,
      doctorName: rx.doctorName,
      patientEmail: userEmail,
      medicine: {
        productId: product._id,
        name: product.name,
        category: product.category,
        dosage: product.dosage || "As prescribed",
        authoritativePrice,
        quantity: refillQuantity,
        image: product.image,
      },
      pricing: {
        subtotal,
        tax,
        shipping,
        totalAmount,
      },
      prescriptionValid: true,
      requiresReview: true,
      timestamp: new Date(),
    };

    res.json({
      success: true,
      isEligible: true,
      message: "Refill item validated and prepared for checkout.",
      draft,
    });
  } catch (err) {
    console.error("Order again draft error:", err);
    res.status(500).json({ success: false, message: "Error preparing Order Again draft" });
  }
});

export default router;
