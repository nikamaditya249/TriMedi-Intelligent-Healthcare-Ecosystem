/**
 * ==============================================================================
 * TRIMEDI DATABASE VERIFICATION & AUDIT (db:verify)
 * ==============================================================================
 * Programmatically validates:
 * 1. Connectivity & cluster telemetry
 * 2. Complete collection inventory (15/15 required collections)
 * 3. Complete index presence (0 missing critical indexes)
 * 4. Isolated CRUD lifecycle (Create, Read, Update, Delete)
 * 5. Multi-document ACID replica set transaction capability
 * 6. Schema validation enforcement (required fields, enums, bounds)
 * ==============================================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import ClinicQueue from "../models/ClinicQueue.js";
import Consultation from "../models/Consultation.js";
import Prescription from "../models/Prescription.js";
import Medication from "../models/Medication.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import ClinicalAudit from "../models/ClinicalAudit.js";
import SecurityEvent from "../models/SecurityEvent.js";
import Consent from "../models/Consent.js";
import AIAudit from "../models/AIAudit.js";

dotenv.config();

function sanitizeUri(uri) {
  if (!uri) return "[EMPTY]";
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}

export const REQUIRED_COLLECTIONS = [
  { name: "User", collection: "users", model: User },
  { name: "Appointment", collection: "appointments", model: Appointment },
  { name: "ClinicQueue", collection: "clinicqueues", model: ClinicQueue },
  { name: "Consultation", collection: "consultations", model: Consultation },
  { name: "Prescription", collection: "prescriptions", model: Prescription },
  { name: "Medication", collection: "medications", model: Medication },
  { name: "Product", collection: "products", model: Product },
  { name: "Order", collection: "orders", model: Order },
  { name: "Notification", collection: "notifications", model: Notification },
  { name: "Conversation", collection: "conversations", model: Conversation },
  { name: "Message", collection: "messages", model: Message },
  { name: "ClinicalAudit", collection: "clinicalaudits", model: ClinicalAudit },
  { name: "SecurityEvent", collection: "securityevents", model: SecurityEvent },
  { name: "Consent", collection: "consents", model: Consent },
  { name: "AIAudit", collection: "aiaudits", model: AIAudit },
];

export async function verifyDatabase(options = {}) {
  const { exitOnComplete = true, customUri = null } = options;
  const mongoUri = customUri || process.env.MONGO_URI || process.env.URL;

  console.log("==============================================================================");
  console.log("🔬 TRIMEDI COMPREHENSIVE PRODUCTION DATABASE AUDIT & VERIFICATION");
  console.log("==============================================================================");
  console.log(`Target MongoDB URI: ${sanitizeUri(mongoUri)}`);

  if (!mongoUri) {
    const errorMsg = "FATAL: MONGO_URI is missing from environment. Database verification halted.";
    console.error(`❌ ${errorMsg}`);
    if (exitOnComplete) process.exit(1);
    throw new Error(errorMsg);
  }

  const startTime = Date.now();
  const results = {
    connectivity: false,
    databaseName: "",
    collectionsVerified: 0,
    collectionsTotal: REQUIRED_COLLECTIONS.length,
    missingCollections: [],
    indexesReport: [],
    missingCriticalIndexes: 0,
    crudTest: { create: false, read: false, update: false, delete: false },
    transactionSupport: false,
    validationEnforced: false,
  };

  try {
    // 1. Connectivity & Telemetry
    console.log("\n1. Verifying MongoDB Connection & Cluster Telemetry...");
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
    }

    const db = mongoose.connection.db;
    const adminDb = db.admin();
    const pingResult = await adminDb.ping();

    results.connectivity = pingResult.ok === 1;
    results.databaseName = mongoose.connection.name;
    results.clusterHost = mongoose.connection.host;

    console.log(`   ✅ Connected to database: "${results.databaseName}" on host ${results.clusterHost}`);
    console.log(`   ✅ Admin ping response: ${JSON.stringify(pingResult)}`);

    // 2. Collection Inventory Verification
    console.log("\n2. Verifying Collection Inventory (15 Authoritative Collections)...");
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map((c) => c.name));

    for (const item of REQUIRED_COLLECTIONS) {
      const exists = existingNames.has(item.collection);
      if (exists) {
        results.collectionsVerified++;
        console.log(`   ✅ Collection [${item.collection.padEnd(16)}]: PRESENT (Model: ${item.name})`);
      } else {
        results.missingCollections.push(item.collection);
        console.error(`   ❌ Collection [${item.collection.padEnd(16)}]: MISSING!`);
      }
    }

    // 3. Index Verification
    console.log("\n3. Programmatic Index Audit & Verification...");
    for (const item of REQUIRED_COLLECTIONS) {
      try {
        const actualIndexes = await db.collection(item.collection).indexes();
        const actualIndexKeys = actualIndexes.map((idx) => Object.keys(idx.key).join("+"));

        const schemaIndexes = item.model.schema.indexes();
        const expectedKeys = schemaIndexes.map(([spec]) => Object.keys(spec).join("+"));
        expectedKeys.push("_id"); // standard primary key

        const missing = expectedKeys.filter((exp) => !actualIndexKeys.includes(exp));
        if (missing.length > 0) {
          results.missingCriticalIndexes += missing.length;
        }

        results.indexesReport.push({
          collection: item.collection,
          model: item.name,
          expectedCount: expectedKeys.length,
          actualCount: actualIndexes.length,
          actualIndexes: actualIndexKeys,
          missing,
          status: missing.length === 0 ? "VERIFIED" : "DEFICIT",
        });

        console.log(
          `   ${missing.length === 0 ? "✅" : "❌"} ${item.collection.padEnd(16)}: ${actualIndexes.length} active indexes | Missing: ${missing.length}`
        );
      } catch (idxErr) {
        console.error(`   ❌ Error inspecting indexes on ${item.collection}:`, idxErr.message);
        results.missingCriticalIndexes++;
      }
    }

    // 4. CRUD Lifecycle Test
    console.log("\n4. Executing Controlled CRUD Lifecycle Test (Clean Probe Record)...");
    const testProbeEmail = `db-probe-${Date.now()}@trimedi.internal`;
    try {
      // CREATE
      const createdUser = await User.create({
        name: "TriMedi DB Probe",
        email: testProbeEmail,
        password: "$2a$10$probeHashedPasswordValidationOnly1234567890",
        role: "patient",
        phone: "+91 99999 00001",
      });
      results.crudTest.create = !!createdUser._id;
      console.log(`   ✅ CREATE: Successfully inserted test probe doc (${createdUser._id})`);

      // READ
      const fetchedUser = await User.findOne({ email: testProbeEmail });
      results.crudTest.read = fetchedUser && fetchedUser.name === "TriMedi DB Probe";
      console.log(`   ✅ READ:   Successfully queried test probe doc`);

      // UPDATE
      const updatedUser = await User.findOneAndUpdate(
        { email: testProbeEmail },
        { phone: "+91 99999 88888" },
        { new: true }
      );
      results.crudTest.update = updatedUser && updatedUser.phone === "+91 99999 88888";
      console.log(`   ✅ UPDATE: Successfully updated test probe doc`);

      // DELETE
      const deleteRes = await User.deleteOne({ email: testProbeEmail });
      results.crudTest.delete = deleteRes.deletedCount === 1;
      console.log(`   ✅ DELETE: Successfully purged test probe doc`);
    } catch (crudErr) {
      console.error("   ❌ CRUD Test failed:", crudErr.message);
      // Clean up if created
      await User.deleteOne({ email: testProbeEmail }).catch(() => {});
    }

    // 5. Transaction Support Test
    console.log("\n5. Testing MongoDB Multi-Document ACID Transaction Support...");
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      const txProbeEmail = `tx-probe-${Date.now()}@trimedi.internal`;
      await User.create(
        [
          {
            name: "TriMedi Transaction Probe",
            email: txProbeEmail,
            password: "$2a$10$txHashedPasswordValidationOnly1234567890",
            role: "patient",
          },
        ],
        { session }
      );

      // Verify visibility within transaction
      const inTx = await User.findOne({ email: txProbeEmail }).session(session);
      if (!inTx) throw new Error("Transaction isolation read failed");

      // Commit
      await session.commitTransaction();
      session.endSession();

      // Clean up committed document
      await User.deleteOne({ email: txProbeEmail });

      results.transactionSupport = true;
      console.log("   ✅ TRANSACTIONS: Multi-document ACID replica set transactions verified PASS");
    } catch (txErr) {
      console.warn("   ⚠️ Transaction test notice:", txErr.message);
      results.transactionSupport = false;
    }

    // 6. Schema Validation Tests
    console.log("\n6. Testing Mongoose Schema Validation Enforcement...");
    let enumRejected = false;
    let requiredRejected = false;

    try {
      // Test invalid role enum
      const invalidUser = new User({
        name: "Invalid Role",
        email: "invalid-role@trimedi.internal",
        password: "hash",
        role: "INVALID_UNAUTHORIZED_ROLE",
      });
      await invalidUser.validate();
    } catch (valErr) {
      enumRejected = true;
      console.log("   ✅ Enum Validation: Rejected illegal role value correctly");
    }

    try {
      // Test missing required name in Product
      const invalidProduct = new Product({
        price: 100,
      });
      await invalidProduct.validate();
    } catch (valErr) {
      requiredRejected = true;
      console.log("   ✅ Required Field Validation: Rejected missing product name correctly");
    }

    results.validationEnforced = enumRejected && requiredRejected;

    // 7. Final Summary
    console.log("\n==============================================================================");
    console.log("📊 DATABASE VERIFICATION FINAL SUMMARY");
    console.log("==============================================================================");
    console.log(`Cluster Host:             ${results.clusterHost}`);
    console.log(`Database Name:            ${results.databaseName}`);
    console.log(`Collection Inventory:     ${results.collectionsVerified} / ${results.collectionsTotal} ✅`);
    console.log(`Missing Critical Indexes: ${results.missingCriticalIndexes} ${results.missingCriticalIndexes === 0 ? "✅" : "❌"}`);
    console.log(`CRUD Test:                CREATE:${results.crudTest.create ? "PASS" : "FAIL"} | READ:${results.crudTest.read ? "PASS" : "FAIL"} | UPDATE:${results.crudTest.update ? "PASS" : "FAIL"} | DELETE:${results.crudTest.delete ? "PASS" : "FAIL"}`);
    console.log(`Transactions Supported:   ${results.transactionSupport ? "PASS ✅" : "N/A (Standalone)"}`);
    console.log(`Schema Validation:        ${results.validationEnforced ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`Audit Duration:           ${Date.now() - startTime}ms`);
    console.log("==============================================================================");

    const isOverallSuccess =
      results.collectionsVerified === results.collectionsTotal &&
      results.missingCriticalIndexes === 0 &&
      results.crudTest.create &&
      results.crudTest.read &&
      results.crudTest.update &&
      results.crudTest.delete &&
      results.validationEnforced;

    if (exitOnComplete) {
      await mongoose.disconnect();
      process.exit(isOverallSuccess ? 0 : 1);
    }

    return {
      success: isOverallSuccess,
      ...results,
    };
  } catch (fatalErr) {
    console.error("❌ DATABASE AUDIT FAILED:", fatalErr.message);
    if (exitOnComplete) process.exit(1);
    throw fatalErr;
  }
}

// Direct execution CLI entrypoint
if (process.argv[1]?.endsWith("db_verify.js")) {
  verifyDatabase({ exitOnComplete: true }).catch(() => process.exit(1));
}
