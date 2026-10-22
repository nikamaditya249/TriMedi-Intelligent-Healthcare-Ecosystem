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
import consentRoutes from "./routes/consent.js";
import privacyRoutes from "./routes/privacy.js";
import uploadRoutes from "./routes/uploads.js";

import { initSocketIO } from "./services/socketService.js";
import { startHealthcareScheduler } from "./services/scheduler.js";
import Product from "./models/Product.js";
import { defaultProducts } from "./data/defaultProducts.js";
import validateStartupConfig from "./utils/configValidator.js";
import errorHandler from "./middleware/errorHandler.js";
import { authRateLimiter } from "./middleware/rateLimiter.js";
import securityStore from "./services/securityStore.js";
import { isMockAllowed } from "./middleware/dbGuard.js";

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

/* ================= SECURITY HEADERS ================= */
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.paypal.com https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.razorpay.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.paypal.com ws: wss: http://localhost:5001 http://localhost:5173 http://localhost:5174 http://127.0.0.1:5173 http://127.0.0.1:5174; frame-src 'self' https://api.razorpay.com https://www.paypal.com;"
  );
  next();
});

/* ================= HARDENED CORS ================= */
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (tools, curl, server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((ao) => origin === ao || origin.startsWith(ao));
      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
  })
);

// Parse JSON while strictly preserving the raw body buffer for HMAC SHA-256 webhook signatures
app.use(
  express.json({
    limit: "2mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.json({
    message: "TriMedi Healthcare Platform API is running 🚀",
    status: "OK",
    phase: "5.5 Production Readiness, Secret Rotation & Pilot Gate",
    security: "CSP + HSTS + CORS + RBAC + Break-Glass Protocol Active",
    privacy: "Versioned Consent + Patient Data Export + Retention Lifecycle Active",
    commerce: "Authoritative Pricing + Razorpay + PayPal + COD + State-Aware GST",
    fulfillment: "Strict Pharmacy State Machine + Concurrency Shield",
    reconciliation: "Automated Payment & Inventory Synchronization Active",
    realtime: "Socket.IO active with RBAC room isolation",
    scheduler: "Active (60s idempotent intervals)",
  });
});

// /live -> Process liveness probe
app.get("/live", (req, res) => {
  res.status(200).json({
    status: "ALIVE",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// /ready -> Production traffic readiness probe
app.get("/ready", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const mockAllowed = isMockAllowed();

  // In production, database readiness is an unconditional prerequisite
  if (!isDbConnected && !mockAllowed) {
    return res.status(503).json({
      status: "NOT_READY",
      code: "DATABASE_UNAVAILABLE",
      message: "Database connection is not ready to serve production healthcare traffic.",
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    status: "READY",
    mode: process.env.APP_ENV || process.env.NODE_ENV || "development",
    database: isDbConnected ? "connected" : "resilient_fallback",
    securityStore: securityStore.getStatus().status,
    timestamp: new Date().toISOString(),
  });
});

// /health -> Sanitized detailed internal system telemetry
app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const storeStatus = securityStore.getStatus();
  const isHealthy = isDbConnected || isMockAllowed();

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "HEALTHY" : "DEGRADED",
    environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
    uptimeSeconds: Math.floor(process.uptime()),
    components: {
      database: {
        status: isDbConnected ? "UP" : isMockAllowed() ? "RESILIENT_MOCK" : "DOWN",
        readyState: mongoose.connection.readyState,
      },
      securityStore: storeStatus,
      scheduler: {
        status: "UP",
        intervalSeconds: 60,
      },
    },
    system: {
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
    },
    timestamp: new Date().toISOString(),
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
app.use("/api/consent", consentRoutes);
app.use("/api/privacy", privacyRoutes);
app.use("/api/uploads", uploadRoutes);

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
  console.log(`🚀 TriMedi Phase 5 Production Server running on port ${PORT} (Socket.IO + REST + Security/Privacy Shield)`);
});