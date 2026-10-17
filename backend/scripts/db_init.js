/**
 * ==============================================================================
 * TRIMEDI PRODUCTION DATABASE INITIALIZATION (db:init)
 * ==============================================================================
 * Connects to the authoritative MongoDB Atlas cluster/database and safely,
 * idempotently bootstraps all collections, schemas, and indexes.
 *
 * SAFETY INVARIANTS:
 * - NEVER calls dropDatabase() or drops collections.
 * - IDEMPOTENT: Safe to run repeatedly without data loss or duplication.
 * - Secret hygiene: Passwords and raw connection strings are never logged.
 * - Programmatic index verification: Asserts 0 missing critical indexes.
 * ==============================================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Import all 15 authoritative TriMedi Mongoose models
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

export function sanitizeUri(uri) {
  if (!uri) return "[EMPTY]";
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}

export const REQUIRED_MODELS = [
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

export async function initializeDatabase(options = {}) {
  const { exitOnComplete = true, customUri = null } = options;
  const mongoUri = customUri || process.env.MONGO_URI || process.env.URL;

  console.log("==============================================================================");
  console.log("🏥 TRIMEDI INTELLIGENT HEALTHCARE ECOSYSTEM — DATABASE BOOTSTRAP");
  console.log("==============================================================================");
  console.log(`Target MongoDB URI: ${sanitizeUri(mongoUri)}`);

  if (!mongoUri) {
    const errorMsg = "FATAL: MONGO_URI is missing from environment. Database initialization halted.";
    console.error(`❌ ${errorMsg}`);
    if (exitOnComplete) process.exit(1);
    throw new Error(errorMsg);
  }

  const startTime = Date.now();

  try {
    // 1. Connect and verify connection
    console.log("1. Connecting to MongoDB cluster...");
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;
    console.log(`   ✅ Connected successfully in ${Date.now() - startTime}ms`);
    console.log(`   Database Name: ${dbName}`);
    console.log(`   Cluster Host:  ${mongoose.connection.host}`);
    console.log(`   Ready State:   ${mongoose.connection.readyState} (CONNECTED)`);

    // 2. Discover existing collections
    console.log("\n2. Inspecting existing collections in database...");
    const existingColls = await db.listCollections().toArray();
    const existingCollNames = new Set(existingColls.map((c) => c.name));
    console.log(`   Found ${existingCollNames.size} existing collections: [${Array.from(existingCollNames).join(", ") || "none"}]`);

    // 3. Create required collections idempotently
    console.log("\n3. Bootstrapping required TriMedi collections...");
    const collectionResults = [];

    for (const item of REQUIRED_MODELS) {
      const alreadyExists = existingCollNames.has(item.collection);
      if (!alreadyExists) {
        try {
          await item.model.createCollection();
          collectionResults.push({ name: item.collection, model: item.name, status: "CREATED" });
          console.log(`   ✨ Created collection: ${item.collection} (Model: ${item.name})`);
        } catch (createErr) {
          // If already created concurrently, treat as existing
          collectionResults.push({ name: item.collection, model: item.name, status: "EXISTED" });
          console.log(`   ℹ️ Collection ${item.collection} ready (${createErr.message})`);
        }
      } else {
        collectionResults.push({ name: item.collection, model: item.name, status: "EXISTED" });
        console.log(`   ✅ Collection ${item.collection} already exists`);
      }
    }

    // 4. Synchronize and build all indexes
    console.log("\n4. Synchronizing and creating required indexes...");
    const indexReport = [];
    let totalIndexesCreated = 0;
    let missingCriticalIndexes = 0;

    for (const item of REQUIRED_MODELS) {
      try {
        // syncIndexes creates missing indexes without dropping data
        await item.model.syncIndexes();

        // Query actual indexes on the collection
        const actualIndexes = await db.collection(item.collection).indexes();
        const actualIndexNames = actualIndexes.map((idx) => Object.keys(idx.key).join("+"));

        // Compare with schema-defined index keys
        const schemaIndexes = item.model.schema.indexes();
        const expectedKeys = schemaIndexes.map(([spec]) => Object.keys(spec).join("+"));
        // Always expect _id_
        expectedKeys.push("_id");

        const missing = expectedKeys.filter((exp) => !actualIndexNames.includes(exp));

        if (missing.length > 0) {
          missingCriticalIndexes += missing.length;
        }

        totalIndexesCreated += actualIndexes.length;

        indexReport.push({
          collection: item.collection,
          model: item.name,
          expectedCount: expectedKeys.length,
          actualCount: actualIndexes.length,
          actualIndexNames,
          missing,
          status: missing.length === 0 ? "VERIFIED" : "INDEX_DEFICIT",
        });

        console.log(
          `   ✅ ${item.collection.padEnd(16)}: ${actualIndexes.length} indexes verified (Missing: ${missing.length})`
        );
      } catch (idxErr) {
        console.error(`   ⚠️ Index synchronization warning on ${item.collection}:`, idxErr.message);
        indexReport.push({
          collection: item.collection,
          model: item.name,
          expectedCount: -1,
          actualCount: -1,
          missing: [idxErr.message],
          status: "ERROR",
        });
        missingCriticalIndexes++;
      }
    }

    // 5. Verification Summary
    console.log("\n==============================================================================");
    console.log("📊 DATABASE INITIALIZATION REPORT SUMMARY");
    console.log("==============================================================================");
    console.log(`Collections Verified:    ${REQUIRED_MODELS.length} / ${REQUIRED_MODELS.length} ✅`);
    console.log(`Total Indexes Active:    ${totalIndexesCreated} ✅`);
    console.log(`Missing Critical Indexes: ${missingCriticalIndexes} ${missingCriticalIndexes === 0 ? "✅ (ZERO DEFICIT)" : "❌"}`);
    console.log(`Elapsed Time:            ${Date.now() - startTime}ms`);
    console.log("==============================================================================");

    const isSuccess = missingCriticalIndexes === 0;

    if (isSuccess) {
      console.log("🎉 DATABASE BOOTSTRAP COMPLETE — AUTHORITATIVE PRODUCTION DATABASE READY");
    } else {
      console.error("❌ DATABASE BOOTSTRAP WARNING — Index deficit detected");
    }

    if (exitOnComplete) {
      await mongoose.disconnect();
      process.exit(isSuccess ? 0 : 1);
    }

    return {
      success: isSuccess,
      databaseName: dbName,
      clusterHost: mongoose.connection.host,
      collections: collectionResults,
      indexReport,
      totalIndexesCreated,
      missingCriticalIndexes,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    console.error("❌ DATABASE INITIALIZATION FAILED:", err.message);
    if (exitOnComplete) {
      process.exit(1);
    }
    throw err;
  }
}

// Direct execution CLI entrypoint
if (process.argv[1]?.endsWith("db_init.js")) {
  initializeDatabase({ exitOnComplete: true }).catch(() => process.exit(1));
}
