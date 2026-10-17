import http from "http";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/product.js";
import statsRoutes from "./routes/stats.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import appointmentRoutes from "./routes/appointments.js";
import orderRoutes from "./routes/orders.js";
import paypalRoutes from "./routes/paypal.js";
import aiRoutes from "./routes/ai.js";
import intelligenceRoutes from "./routes/intelligence.js";
import chatRoutes from "./routes/chat.js";
import notificationRoutes from "./routes/notifications.js";
import refillRoutes from "./routes/refill.js";
import queueRoutes from "./routes/queue.js";
import consultationRoutes from "./routes/consultations.js";
import receptionRoutes from "./routes/reception.js";
import medicationRoutes from "./routes/medication.js";
import paymentRoutes from "./routes/payment.js";

import { initSocketIO } from "./services/socketService.js";
import { startHealthcareScheduler } from "./services/scheduler.js";
import Product from "./models/Product.js";
import { defaultProducts } from "./data/defaultProducts.js";
import validateStartupConfig from "./utils/configValidator.js";
import errorHandler from "./middleware/errorHandler.js";
import { authRateLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Run configuration validation check
validateStartupConfig().catch((fatalErr) => {
  console.error("Startup validation halted server:", fatalErr.message);
  process.exit(1);
});

// Initialize Socket.IO
initSocketIO(httpServer);

/* ================= MIDDLEWARE ================= */
app.use(cors());

// Parse JSON while strictly preserving the raw body buffer for HMAC SHA-256 webhook signatures
app.use(
  express.json({
    limit: "20mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.json({
    message: "TriMedi Healthcare Platform API is running 🚀",
    status: "OK",
    phase: "4.5 Production Hardened",
    commerce: "Authoritative Pricing + Razorpay + PayPal + COD + State-Aware GST",
    fulfillment: "Strict Pharmacy State Machine + Concurrency Shield",
    reconciliation: "Automated Payment & Inventory Synchronization Active",
    realtime: "Socket.IO active with RBAC room isolation",
    scheduler: "Active (60s idempotent intervals)",
  });
});

app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/refill", refillRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/reception", receptionRoutes);
app.use("/api/medications", medicationRoutes);

/* ================= UNIFIED ERROR HANDLER ================= */
app.use(errorHandler);

/* ================= DB CONNECT ================= */
const mongoURI = process.env.MONGO_URI || process.env.URL;
if (mongoURI) {
  mongoose
    .connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      console.log("✅ MongoDB Connected to TriMedi cluster!");
      try {
        const count = await Product.countDocuments();
        if (count === 0) {
          console.log("📦 Auto-seeding 50 products to MongoDB...");
          const productsWithoutId = defaultProducts.map(({ _id, ...rest }) => rest);
          await Product.insertMany(productsWithoutId);
          console.log("🎉 Database seeded successfully with 50 products!");
        }
      } catch (seedErr) {
        console.warn("Auto-seed info:", seedErr.message);
      }
    })
    .catch((err) => console.log("⚠️ DB Notice (App running in resilient mode):", err.message));
}

// Start background healthcare scheduler
startHealthcareScheduler();

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`🚀 TriMedi Phase 4.5 Production-Hardened Server running on port ${PORT} (Socket.IO + REST + Scheduler)`);
});