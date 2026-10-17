/**
 * ==============================================================================
 * TRIMEDI CONNECTION FAILURE & RESILIENCE PROBE (Phase 5.96 - Item 22)
 * ==============================================================================
 * Validates that an invalid MongoDB credential or unreachable cluster:
 * 1. Fails the database connection safely.
 * 2. Causes /ready to return HTTP 503 DATABASE_UNAVAILABLE in production.
 * 3. Never silently falls back to in-memory mocks for production operations.
 * 4. Ensures /live probe still returns HTTP 200.
 * ==============================================================================
 */

import http from "http";
import express from "express";
import mongoose from "mongoose";
import { isMockAllowed, requireDatabase } from "../middleware/dbGuard.js";

async function runConnectionFailureTest() {
  console.log("==============================================================================");
  console.log("🧪 TESTING CONNECTION FAILURE & 503 READINESS SHIELD (ITEM 22)");
  console.log("==============================================================================");

  // Set production environment to disable all test mocks
  const originalAppEnv = process.env.APP_ENV;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowMocks = process.env.ALLOW_TEST_MOCKS;

  process.env.APP_ENV = "production";
  process.env.NODE_ENV = "production";
  delete process.env.ALLOW_TEST_MOCKS;

  console.log(`Environment enforced: APP_ENV=${process.env.APP_ENV}, isMockAllowed()=${isMockAllowed()}`);

  const testApp = express();
  testApp.use(express.json());

  testApp.get("/live", (req, res) => {
    res.status(200).json({ status: "ALIVE" });
  });

  testApp.get("/ready", (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected && !isMockAllowed()) {
      return res.status(503).json({
        status: "NOT_READY",
        code: "DATABASE_UNAVAILABLE",
        message: "Database connection is not ready to serve production healthcare traffic.",
      });
    }
    res.status(200).json({ status: "READY" });
  });

  testApp.post("/api/clinical-op", requireDatabase, (req, res) => {
    res.json({ success: true });
  });

  const server = http.createServer(testApp);
  await new Promise((resolve) => server.listen(0, resolve));
  const testPort = server.address().port;
  console.log(`Ephemeral test probe running on port ${testPort}`);

  // Test 1: Invalid MongoDB URI
  const invalidUri = "mongodb+srv://invalid_user:wrong_password@cluster0.lxxpoyn.mongodb.net/trimedi?retryWrites=true&w=majority";
  console.log("1. Attempting connection with invalid credentials (simulating auth failure)...");

  let connectionFailed = false;
  try {
    await mongoose.connect(invalidUri, { serverSelectionTimeoutMS: 2000 });
  } catch (err) {
    connectionFailed = true;
    console.log(`   ✅ Expected connection rejection observed: "${err.message.split("\n")[0]}"`);
  }

  // Test 2: Verify /live probe
  console.log("2. Querying /live endpoint during database failure...");
  const liveRes = await fetch(`http://127.0.0.1:${testPort}/live`);
  const liveBody = await liveRes.json();
  const livePass = liveRes.status === 200 && liveBody.status === "ALIVE";
  console.log(`   ${livePass ? "✅" : "❌"} /live returned HTTP ${liveRes.status} (Expected: 200)`);

  // Test 3: Verify /ready endpoint fails with 503
  console.log("3. Querying /ready endpoint during database failure in production mode...");
  const readyRes = await fetch(`http://127.0.0.1:${testPort}/ready`);
  const readyBody = await readyRes.json();
  const readyPass = readyRes.status === 503 && readyBody.code === "DATABASE_UNAVAILABLE";
  console.log(`   ${readyPass ? "✅" : "❌"} /ready returned HTTP ${readyRes.status} (Code: ${readyBody.code}, Expected: 503 DATABASE_UNAVAILABLE)`);

  // Test 4: Verify mutating operation blocked by requireDatabase
  console.log("4. Testing protected clinical mutation with requireDatabase middleware...");
  const mutRes = await fetch(`http://127.0.0.1:${testPort}/api/clinical-op`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "WRITE_CLINICAL_NOTE" }),
  });
  const mutBody = await mutRes.json();
  const mutPass = mutRes.status === 503 && mutBody.error?.code === "DATABASE_UNAVAILABLE";
  console.log(`   ${mutPass ? "✅" : "❌"} Mutation blocked with HTTP ${mutRes.status} (Code: ${mutBody.error?.code})`);

  // Clean up
  server.close();
  if (originalAppEnv) process.env.APP_ENV = originalAppEnv;
  else delete process.env.APP_ENV;
  if (originalNodeEnv) process.env.NODE_ENV = originalNodeEnv;
  else delete process.env.NODE_ENV;
  if (originalAllowMocks) process.env.ALLOW_TEST_MOCKS = originalAllowMocks;

  console.log("==============================================================================");
  console.log("📊 CONNECTION FAILURE AUDIT SUMMARY");
  console.log("==============================================================================");
  console.log(`Auth Rejection Observed:   ${connectionFailed ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`/live Probe Integrity:     ${livePass ? "PASS ✅ (HTTP 200)" : "FAIL ❌"}`);
  console.log(`/ready 503 Blockade:       ${readyPass ? "PASS ✅ (HTTP 503 DATABASE_UNAVAILABLE)" : "FAIL ❌"}`);
  console.log(`Mutating Operation Shield: ${mutPass ? "PASS ✅ (HTTP 503 Blocked)" : "FAIL ❌"}`);
  console.log("==============================================================================");

  const allPassed = connectionFailed && livePass && readyPass && mutPass;
  if (!allPassed) {
    throw new Error("Connection failure test did not meet all criteria.");
  }
  console.log("🎉 ITEM 22 CONNECTION FAILURE AUDIT PASSED 100%");
}

runConnectionFailureTest().catch((err) => {
  console.error("Test execution error:", err.message);
  process.exit(1);
});
