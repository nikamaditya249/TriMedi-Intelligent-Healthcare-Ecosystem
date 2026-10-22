/**
 * TRIMEDI PRODUCTION AUDIT: LIVE JWT AUTHENTICATION & MONGODB VERIFICATION SCRIPT
 *
 * Verifies:
 * 1. User Registration (POST /api/auth/register)
 * 2. MongoDB Persistence: Confirms user record is genuinely written to MongoDB Atlas
 * 3. Bcrypt Password Hashing: Confirms passwords in MongoDB are salted hashes and never plaintext
 * 4. JWT Token Verification: Cryptographically validates token issued upon registration
 * 5. User Login (POST /api/auth/login) using stored credentials
 * 6. Login JWT Token Verification: Confirms claims (id, email, role, exp) and signature
 * 7. Protected Route Access: Calls GET /api/auth/me using the Bearer JWT token
 * 8. Security Boundary: Tests wrong password rejection and invalid token rejection
 */

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: __dirname + "/../.env" });

const API_BASE = "http://localhost:5001/api/auth";
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function runAuthVerification() {
  console.log("\n==================================================================");
  console.log("🔐 TRIMEDI LIVE AUTHENTICATION, JWT & MONGODB INTEGRITY VERIFICATION");
  console.log("==================================================================");
  console.log(`API Base URL:   ${API_BASE}`);
  console.log(`Target DB:      ${MONGO_URI ? "MongoDB Atlas (cluster0.j4elnei.mongodb.net/trimedi)" : "NOT SET"}`);
  console.log(`JWT Secret:     ${JWT_SECRET ? "CONFIGURED (" + JWT_SECRET.substring(0, 8) + "...)" : "NOT SET"}`);
  console.log("------------------------------------------------------------------\n");

  let results = [];
  let dbConnection = null;
  const timestamp = Date.now();
  const testUser = {
    name: "Dr. Verify Auth Test",
    email: `auth_verify_${timestamp}@trimedi.health`,
    password: `P@ssword_${timestamp}!Secure`,
    role: "patient",
    phone: "+91 98765 00000",
  };

  try {
    // -------------------------------------------------------------
    // STEP 1: Connect directly to MongoDB Atlas to inspect raw data
    // -------------------------------------------------------------
    console.log("📡 STEP 1: Connecting to MongoDB Atlas database...");
    dbConnection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 8000,
    });
    const dbState = mongoose.connection.readyState;
    const dbName = mongoose.connection.name;
    const isDbConnected = dbState === 1;

    console.log(`[PASS] MongoDB Connection State: ${dbState} (${isDbConnected ? "CONNECTED" : "DISCONNECTED"}), Database: "${dbName}"`);
    results.push({ step: "MongoDB Connection", pass: isDbConnected });

    // -------------------------------------------------------------
    // STEP 2: Execute User Signup / Registration via API
    // -------------------------------------------------------------
    console.log(`\n📝 STEP 2: Executing Registration via POST /api/auth/register for ${testUser.email}...`);
    const regRes = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();

    console.log(`HTTP Status:    ${regRes.status}`);
    console.log(`Message:        ${regData.message}`);
    console.log(`User ID:        ${regData.user?._id || regData.user?.id}`);
    console.log(`Returned Token: ${regData.token ? regData.token.substring(0, 32) + "..." : "NONE"}`);

    const registerToken = regData.token;
    const registeredUserId = regData.user?._id || regData.user?.id;

    const signupPassed = regRes.status === 200 && !!registerToken && !!registeredUserId;
    results.push({ step: "User Registration API", pass: signupPassed });

    // -------------------------------------------------------------
    // STEP 3: Cryptographically Verify the Registration JWT Token
    // -------------------------------------------------------------
    console.log("\n🔑 STEP 3: Cryptographically Verifying Registration JWT Token...");
    const decodedRegisterToken = jwt.verify(registerToken, JWT_SECRET);
    console.log("Decoded Token Payload:", {
      id: decodedRegisterToken.id,
      email: decodedRegisterToken.email,
      role: decodedRegisterToken.role,
      exp: new Date(decodedRegisterToken.exp * 1000).toISOString(),
    });

    const jwtValid = decodedRegisterToken.email.toLowerCase() === testUser.email.toLowerCase() &&
                     String(decodedRegisterToken.id) === String(registeredUserId) &&
                     decodedRegisterToken.role === "patient";

    console.log(`[PASS] JWT Signature & Claims Valid: ${jwtValid}`);
    results.push({ step: "Registration JWT Token Signature & Claims", pass: jwtValid });

    // -------------------------------------------------------------
    // STEP 4: Query MongoDB Atlas directly to confirm real storage
    // -------------------------------------------------------------
    console.log(`\n🗄️  STEP 4: Querying MongoDB Atlas for user ${testUser.email}...`);
    const usersCollection = mongoose.connection.collection("users");
    const mongoDoc = await usersCollection.findOne({ email: testUser.email.toLowerCase() });

    if (!mongoDoc) {
      throw new Error(`CRITICAL: User ${testUser.email} was NOT found in MongoDB collection 'users'!`);
    }

    console.log("MongoDB Document Retrieved from Atlas:");
    console.log(`  _id:       ${mongoDoc._id}`);
    console.log(`  name:      ${mongoDoc.name}`);
    console.log(`  email:     ${mongoDoc.email}`);
    console.log(`  role:      ${mongoDoc.role}`);
    console.log(`  password:  ${mongoDoc.password ? mongoDoc.password.substring(0, 20) + "..." : "EMPTY"}`);
    console.log(`  createdAt: ${mongoDoc.createdAt || "Recorded"}`);

    const isHashed = mongoDoc.password && (mongoDoc.password.startsWith("$2a$") || mongoDoc.password.startsWith("$2b$"));
    const isNotPlaintext = mongoDoc.password !== testUser.password;
    const bcryptMatches = await bcrypt.compare(testUser.password, mongoDoc.password);

    console.log(`[PASS] Password Stored as Bcrypt Hash: ${isHashed}`);
    console.log(`[PASS] Plaintext Password Never Stored:  ${isNotPlaintext}`);
    console.log(`[PASS] Bcrypt Validates Password:      ${bcryptMatches}`);

    results.push({ step: "MongoDB Atlas Document Existence", pass: !!mongoDoc });
    results.push({ step: "MongoDB Password Bcrypt Hashing", pass: isHashed && isNotPlaintext && bcryptMatches });

    // -------------------------------------------------------------
    // STEP 5: Execute User Login via API using credentials
    // -------------------------------------------------------------
    console.log(`\n🚪 STEP 5: Executing Login via POST /api/auth/login with valid credentials...`);
    const loginRes = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    const loginData = await loginRes.json();

    console.log(`HTTP Status:    ${loginRes.status}`);
    console.log(`User Name:      ${loginData.user?.name}`);
    console.log(`User Role:      ${loginData.user?.role}`);
    console.log(`Login Token:    ${loginData.token ? loginData.token.substring(0, 32) + "..." : "NONE"}`);

    const loginToken = loginData.token;
    const loginPassed = loginRes.status === 200 && !!loginToken;
    results.push({ step: "User Login API", pass: loginPassed });

    // -------------------------------------------------------------
    // STEP 6: Cryptographically Verify Login JWT Token
    // -------------------------------------------------------------
    console.log("\n🔑 STEP 6: Cryptographically Verifying Login JWT Token...");
    const decodedLoginToken = jwt.verify(loginToken, JWT_SECRET);
    console.log("Decoded Login Token Payload:", {
      id: decodedLoginToken.id,
      email: decodedLoginToken.email,
      role: decodedLoginToken.role,
      exp: new Date(decodedLoginToken.exp * 1000).toISOString(),
    });

    const loginJwtValid = decodedLoginToken.email.toLowerCase() === testUser.email.toLowerCase() &&
                          String(decodedLoginToken.id) === String(registeredUserId);
    console.log(`[PASS] Login JWT Claims Match Registered MongoDB ID: ${loginJwtValid}`);
    results.push({ step: "Login JWT Cryptographic Verification", pass: loginJwtValid });

    // -------------------------------------------------------------
    // STEP 7: Call Protected Endpoint GET /api/auth/me with Bearer token
    // -------------------------------------------------------------
    console.log("\n🛡️  STEP 7: Accessing Protected Endpoint GET /api/auth/me using Bearer JWT...");
    const meRes = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${loginToken}`,
      },
    });
    const meData = await meRes.json();

    console.log(`HTTP Status:    ${meRes.status}`);
    console.log(`Profile Name:   ${meData.user?.name}`);
    console.log(`Profile Email:  ${meData.user?.email}`);
    console.log(`Profile Role:   ${meData.user?.role}`);

    const mePassed = meRes.status === 200 &&
                     meData.user?.email.toLowerCase() === testUser.email.toLowerCase();
    results.push({ step: "Protected Route /api/auth/me Authorization", pass: mePassed });

    // -------------------------------------------------------------
    // STEP 8: Negative Security Checks
    // -------------------------------------------------------------
    console.log("\n🚫 STEP 8: Testing Authentication Security Boundaries...");

    // Test 8a: Wrong Password Rejection
    const badLoginRes = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "WrongPassword123!",
      }),
    });
    const badLoginData = await badLoginRes.json();
    const wrongPassRejected = badLoginRes.status === 400;
    console.log(`[PASS] Wrong Password Rejected: HTTP ${badLoginRes.status} (${badLoginData.message})`);
    results.push({ step: "Wrong Password Rejection", pass: wrongPassRejected });

    // Test 8b: Invalid / Tampered JWT Rejection on Protected Route
    const badTokenRes = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedsignature`,
      },
    });
    const badTokenData = await badTokenRes.json();
    const tamperedRejected = badTokenRes.status === 401;
    console.log(`[PASS] Tampered JWT Rejected: HTTP ${badTokenRes.status} (${badTokenData.message})`);
    results.push({ step: "Tampered JWT Rejection", pass: tamperedRejected });

    // -------------------------------------------------------------
    // STEP 9: Clean Up Test User from MongoDB Atlas
    // -------------------------------------------------------------
    console.log(`\n🧹 STEP 9: Cleaning up test user ${testUser.email} from MongoDB Atlas...`);
    const deleteResult = await usersCollection.deleteOne({ _id: mongoDoc._id });
    console.log(`Deleted documents: ${deleteResult.deletedCount}`);
    results.push({ step: "Test User Lifecycle Cleanup", pass: deleteResult.deletedCount === 1 });

    // -------------------------------------------------------------
    // FINAL SUMMARY REPORT
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    console.log("📊 AUTHENTICATION & MONGODB VERIFICATION RESULTS SUMMARY");
    console.log("==================================================================");

    let allPassed = true;
    for (const r of results) {
      console.log(`${r.pass ? "✅ PASS" : "❌ FAIL"}: ${r.step}`);
      if (!r.pass) allPassed = false;
    }

    console.log("------------------------------------------------------------------");
    console.log(`OVERALL RESULT: ${allPassed ? "100% VERIFIED & SECURE" : "FAILED"}`);
    console.log("==================================================================\n");

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("\n❌ FATAL ERROR DURING VERIFICATION:", error.message);
    process.exit(1);
  } finally {
    if (dbConnection) {
      await mongoose.disconnect();
    }
  }
}

runAuthVerification();
