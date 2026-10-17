import mongoose from "mongoose";

/**
 * TriMedi Production Configuration & Environment Startup Validator
 * Strictly verifies required production credentials, secrets, and database connectivity.
 */

export const validateStartupConfig = async () => {
  const isProduction =
    process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";

  console.log(`🔍 [Startup Check] Verifying configuration (Environment: ${process.env.APP_ENV || process.env.NODE_ENV || "development"})...`);

  const errors = [];
  const warnings = [];

  // 1. JWT Secret Verification
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) errors.push("JWT_SECRET is required in production environment");
    else warnings.push("JWT_SECRET not set; using development fallback secret");
  } else if (isProduction) {
    if (
      jwtSecret === "secret123" ||
      jwtSecret === "trimedi_secure_jwt_secret_2026" ||
      jwtSecret.length < 32
    ) {
      errors.push("JWT_SECRET is weak or default. Minimum 32 cryptographically random characters required in production.");
    }
  }

  // 2. MongoDB URI Verification
  const mongoURI = process.env.MONGO_URI || process.env.URL;
  if (!mongoURI) {
    if (isProduction) errors.push("MONGO_URI is required in production environment");
    else warnings.push("MONGO_URI not configured; running in mock/offline development mode");
  } else if (isProduction && mongoURI.includes("localhost")) {
    warnings.push("MONGO_URI points to localhost in production mode. Ensure a resilient replica set is used.");
  }

  // 3. Razorpay Payment Gateway Verification
  const rzpKey = process.env.RAZORPAY_KEY_ID;
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  const rzpWebhook = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (isProduction) {
    if (!rzpKey || rzpKey.includes("trimedi_key") || rzpKey.includes("replace_with")) {
      errors.push("RAZORPAY_KEY_ID is missing or configured with test placeholder in production.");
    }
    if (!rzpSecret || rzpSecret.includes("trimedi_secure") || rzpSecret.includes("replace_with")) {
      errors.push("RAZORPAY_KEY_SECRET is missing or configured with test placeholder in production.");
    }
    if (!rzpWebhook || rzpWebhook.includes("trimedi_2026") || rzpWebhook.includes("replace_with")) {
      errors.push("RAZORPAY_WEBHOOK_SECRET is required to verify incoming payment webhooks cryptographically.");
    }
  }

  // 4. In Production: Output fatal errors and halt startup if missing required secrets
  if (isProduction && errors.length > 0) {
    console.error("\n==================================================================");
    console.error("🛑 [FATAL STARTUP ERROR] PRODUCTION CONFIGURATION VALIDATION FAILED");
    console.error("==================================================================");
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
    console.error("==================================================================");
    console.error("The TriMedi server cannot start as a functional production API until all required security secrets are configured.\n");
    throw new Error("PRODUCTION_CONFIGURATION_INVALID: Server startup halted to protect patient and financial safety.");
  }

  if (warnings.length > 0) {
    warnings.forEach((warn) => console.warn(`⚠️ [Startup Warning] ${warn}`));
  }

  console.log("✅ [Startup Check] Configuration validated successfully.");
  return { valid: errors.length === 0, errors, warnings };
};

export default validateStartupConfig;
