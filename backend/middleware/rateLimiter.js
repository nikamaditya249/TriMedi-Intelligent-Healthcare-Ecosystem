/**
 * TriMedi In-Memory Sliding Window Rate Limiter Middleware
 * Provides fine-grained rate limiting for sensitive healthcare and financial endpoints
 * without requiring heavy external dependencies.
 */

export const createRateLimiter = ({
  windowMs = 60 * 1000,
  maxRequests = 60,
  message = "Too many requests. Please try again later.",
  keyGenerator = (req) => req.ip || req.headers["x-forwarded-for"] || "global",
}) => {
  const hits = new Map(); // key -> Array of timestamps

  return (req, res, next) => {
    // Bypass rate limiting in test suite if requested
    if (process.env.APP_ENV === "test" || process.env.ALLOW_TEST_MOCKS === "true") {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = hits.get(key) || [];
    // Filter out timestamps outside the sliding window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message,
          retryAfterSeconds: Math.ceil((timestamps[0] + windowMs - now) / 1000),
        },
      });
    }

    timestamps.push(now);
    hits.set(key, timestamps);

    // Garbage collection to prevent memory leaks
    if (hits.size > 5000) {
      for (const [k, v] of hits.entries()) {
        const recent = v.filter((t) => t > windowStart);
        if (recent.length === 0) hits.delete(k);
        else hits.set(k, recent);
      }
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
