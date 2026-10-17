/**
 * TriMedi In-Memory Sliding Window Rate Limiter Middleware
 * Provides fine-grained rate limiting for sensitive healthcare and financial endpoints
 * without requiring heavy external dependencies.
 */

import securityStore from "../services/securityStore.js";

export const createRateLimiter = ({
  windowMs = 60 * 1000,
  maxRequests = 60,
  message = "Too many requests. Please try again later.",
  keyGenerator = (req) => req.ip || req.headers["x-forwarded-for"] || "global",
}) => {
  return async (req, res, next) => {
    // Bypass rate limiting in test suite if requested
    if (process.env.APP_ENV === "test" || process.env.ALLOW_TEST_MOCKS === "true") {
      return next();
    }

    const key = keyGenerator(req);
    const limitResult = await securityStore.checkRateLimit(key, windowMs, maxRequests);

    if (!limitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message,
          retryAfterSeconds: limitResult.retryAfterSeconds,
        },
      });
    }

    next();
  };
};

// Specialized limiters for specific routes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  maxRequests: 30,
  message: "Too many authentication attempts. Please try again after 15 minutes.",
});

export const paymentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 min
  maxRequests: 25,
  message: "Too many payment operations in a short period. Please wait a moment.",
});

export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 min
  maxRequests: 120,
  message: "Webhook throughput rate exceeded.",
});

export const prescriptionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 min
  maxRequests: 20,
  message: "Prescription processing rate exceeded. Please slow down.",
});

export default {
  createRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
  webhookRateLimiter,
  prescriptionRateLimiter,
};
