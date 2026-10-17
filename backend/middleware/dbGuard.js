import mongoose from "mongoose";

/**
 * TriMedi Database & Mock Isolation Guard
 *
 * Enforces production safety:
 * In-memory fallback and test mocks are ONLY permitted when:
 * 1. APP_ENV is explicitly "test", OR
 * 2. ALLOW_TEST_MOCKS is explicitly "true"
 *
 * In production (APP_ENV=production or NODE_ENV=production),
 * test mocks are strictly disabled. When MongoDB is unavailable,
 * all financial and clinical operations fail safely with HTTP 503.
 */

export const isMockAllowed = () => {
  // If explicitly configured for production, mocks are unconditionally FORBIDDEN
  if (
    process.env.APP_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return false;
  }

  // Mocks are only allowed if explicitly enabled by test configuration
  return (
    process.env.ALLOW_TEST_MOCKS === "true" ||
    process.env.APP_ENV === "test" ||
    process.env.NODE_ENV === "test"
  );
};

/**
 * Express Middleware: Blocks operations requiring database persistence if MongoDB is offline in production
 */
export const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    if (!isMockAllowed()) {
      return res.status(503).json({
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message:
            "Database connection unavailable. Financial, commercial, and clinical operations are halted to guarantee data integrity.",
        },
      });
    }
  }
  next();
};

/**
 * Service-level assertion: Throws immediately if database is unavailable and mocks are disallowed
 */
export const assertDatabaseAvailable = (operationName = "Operation") => {
  if (mongoose.connection.readyState !== 1 && !isMockAllowed()) {
    const error = new Error(
      `DATABASE_UNAVAILABLE: ${operationName} cannot proceed without an active MongoDB connection in production mode.`
    );
    error.code = "DATABASE_UNAVAILABLE";
    error.status = 503;
    throw error;
  }
};

export default {
  isMockAllowed,
  requireDatabase,
  assertDatabaseAvailable,
};
