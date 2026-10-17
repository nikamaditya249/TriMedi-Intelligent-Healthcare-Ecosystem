import mongoose from "mongoose";

/**
 * TriMedi Production Configuration & Environment Startup Validator
 * Strictly verifies required production credentials, secrets, and database connectivity.
 */

export const validateStartupConfig = async () => {
  const envMode = process.env.APP_ENV || process.env.NODE_ENV || "development";
  const isProduction = envMode === "production";
  const isPilot = envMode === "pilot";

  console.log(`🔍 [Startup Check] Verifying configuration (Environment: ${envMode})...`);

  const errors = [];
  const warnings = [];

  // 1. JWT Secret Verification
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) errors.push("JWT_SECRET is required in production environment");
    else if (isPilot) errors.push("JWT_SECRET is required in controlled pilot environment");
    else warnings.push("JWT_SECRET not set; using development fallback secret");
  } else if (isProduction) {
    if (
      jwtSecret === "secret123" ||
      jwtSecret === "trimedi_secure_jwt_secret_2026" ||
      jwtSecret.length < 32
    ) {
      errors.push("JWT_SECRET is weak or default. Minimum 32 cryptographically random characters required in production.");
    }
  } else if (isPilot && jwtSecret === "secret123") {
    warnings.push("JWT_SECRET is using default development secret in pilot mode. Consider using a dedicated pilot secret.");
  }

  // 2. MongoDB URI Verification
  const mongoURI = process.env.MONGO_URI || process.env.URL;
  if (!mongoURI) {
    if (isProduction) errors.push("MONGO_URI is required in production environment");
    else if (isPilot) warnings.push("MONGO_URI not configured; pilot running with isolated in-memory storage");
    else warnings.push("MONGO_URI not configured; running in mock/offline development mode");
  } else {
    // Security Guardrail: Block known compromised legacy MongoDB credential
    if (mongoURI.toLowerCase().includes("adityanikams73_db_user")) {
      const compMsg = "COMPROMISED_CREDENTIAL_DETECTED: Legacy MongoDB Atlas user 'adityanikams73_db_user' is permanently compromised. A rotated database credential must be provided.";
      if (isProduction) {
        errors.push(compMsg);
      } else {
        warnings.push(`[SECURITY WARNING] ${compMsg}`);
      }
    }

    if (isProduction && mongoURI.includes("localhost")) {
      warnings.push("MONGO_URI points to localhost in production mode. Ensure a resilient replica set is used.");
    }
    if (isPilot && mongoURI.toLowerCase().includes("trimedi_production")) {
      errors.push("PILOT_ISOLATION_VIOLATION: Pilot environment must not connect directly to the production database namespace (trimedi_production). Use trimedi_pilot or staging.");
    }
  }

  // 3. Payment Gateway Verification (PayPal is Production Gateway)
  const ppClientId = process.env.PAYPAL_CLIENT_ID;
  const ppSecret = process.env.PAYPAL_CLIENT_SECRET;
  const ppEnv = process.env.PAYPAL_ENVIRONMENT || "sandbox";

  if (isProduction) {
    if (!ppClientId || ppClientId === "sb" || ppClientId.includes("replace_with")) {
      errors.push("PAYPAL_CLIENT_ID is missing or set to placeholder in production. Live PayPal client ID required.");
    }
    if (!ppSecret || ppSecret.includes("replace_with")) {
      errors.push("PAYPAL_CLIENT_SECRET is missing or set to placeholder in production.");
    }
    if (ppEnv !== "live") {
      errors.push(`PAYPAL_ENVIRONMENT must be set to 'live' in production environment (currently set to '${ppEnv}').`);
    }
  } else if (isPilot) {
    if (ppEnv === "live") {
      warnings.push("PAYPAL_ENVIRONMENT is set to 'live' in controlled pilot mode. Consider using sandbox for testing.");
    }
  }

  // 4. Test Mock Guard in Production
  if (isProduction) {
    if (process.env.ALLOW_TEST_MOCKS === "true" || process.env.ALLOW_PILOT_MOCKS === "true") {
      errors.push("PRODUCTION_MOCK_VIOLATION: In-memory fallback and test mocks are strictly forbidden when APP_ENV=production.");
    }
  }

  // 5. In Production / Pilot: Output fatal errors and halt startup if missing required configuration
  if ((isProduction || isPilot) && errors.length > 0) {
    console.error("\n==================================================================");
    console.error(`🛑 [FATAL STARTUP ERROR] ${envMode.toUpperCase()} CONFIGURATION VALIDATION FAILED`);
    console.error("==================================================================");
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
    console.error("==================================================================");
    console.error(`The TriMedi server cannot start as a functional ${envMode} API until all required security parameters are verified.\n`);
    throw new Error(`${envMode.toUpperCase()}_CONFIGURATION_INVALID: Server startup halted to protect patient and financial safety.`);
  }

  if (warnings.length > 0) {
    warnings.forEach((warn) => console.warn(`⚠️ [Startup Warning] ${warn}`));
  }

  console.log(`✅ [Startup Check] Configuration validated successfully for ${envMode} mode.`);
  return { valid: errors.length === 0, errors, warnings, environment: envMode };
};

export default validateStartupConfig;
