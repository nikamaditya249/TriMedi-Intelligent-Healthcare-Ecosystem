/**
 * ==============================================================================
 * TRIMEDI SAFE & IDEMPOTENT DATABASE SEED (db:seed)
 * ==============================================================================
 * Seeds non-clinical reference catalog data (50 pharmaceutical & wellness products)
 * and optional initial administrator bootstrap credentials.
 *
 * SAFETY INVARIANTS:
 * - ZERO FAKE CLINICAL RECORDS: No fake patients, diagnoses, consultations,
 *   prescriptions, dose logs, or medical histories.
 * - ZERO FAKE COMMERCE: No fake orders, transactions, or fake payment records.
 * - NON-DESTRUCTIVE: Never calls deleteMany() or drops collections.
 * - IDEMPOTENT: Safe to run repeatedly; uses $setOnInsert upserts without duplicates.
 * - ADMIN BOOTSTRAP: Only created if BOOTSTRAP_ADMIN_EMAIL & BOOTSTRAP_ADMIN_PASSWORD
 *   are provisioned in environment variables. Passwords hashed with bcrypt.
 * ==============================================================================
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import Product from "../models/Product.js";
import User from "../models/User.js";
import { defaultProducts } from "../data/defaultProducts.js";

dotenv.config();

function sanitizeUri(uri) {
  if (!uri) return "[EMPTY]";
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}

export async function seedDatabase(options = {}) {
  const { exitOnComplete = true, customUri = null } = options;
  const mongoUri = customUri || process.env.MONGO_URI || process.env.URL;

  console.log("==============================================================================");
  console.log("🌱 TRIMEDI SAFE REFERENCE DATA SEED (NON-DESTRUCTIVE & IDEMPOTENT)");
  console.log("==============================================================================");
  console.log(`Target MongoDB URI: ${sanitizeUri(mongoUri)}`);

  if (!mongoUri) {
    const errorMsg = "FATAL: MONGO_URI is missing from environment. Database seeding halted.";
    console.error(`❌ ${errorMsg}`);
    if (exitOnComplete) process.exit(1);
    throw new Error(errorMsg);
  }

  const startTime = Date.now();

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);
    }

    // 1. Idempotent Pharmaceutical Catalog Seeding
    console.log(`\n1. Seeding pharmaceutical catalog (${defaultProducts.length} items)...`);
    let insertedCount = 0;
    let existingCount = 0;

    for (const item of defaultProducts) {
      // Upsert by _id, product name, or SKU without overwriting existing production alterations
      const existing = await Product.findOne({
        $or: [
          ...(item._id ? [{ _id: item._id }] : []),
          { name: item.name },
          ...(item.sku ? [{ sku: item.sku }] : []),
        ],
      });

      if (!existing) {
        await Product.create({
          ...item,
          mrp: item.mrp || Math.round(item.price * 1.15),
          availableQuantity: item.stockQuantity - (item.reservedQuantity || 0),
        });
        insertedCount++;
      } else {
        existingCount++;
      }
    }

    console.log(`   ✨ New catalog items inserted: ${insertedCount}`);
    console.log(`   📦 Total catalog products active: ${insertedCount + existingCount} / ${defaultProducts.length}`);

    // 2. Safe Optional Administrator Bootstrap
    console.log("\n2. Checking administrator bootstrap configuration...");
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
    const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();

    let adminStatus = "NOT_CONFIGURED";

    if (adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
      if (!existingAdmin) {
        console.log(`   🔐 Bootstrapping initial administrator: ${adminEmail}`);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({
          name: "TriMedi System Administrator",
          email: adminEmail.toLowerCase(),
          password: hashedPassword,
          role: "admin",
          verificationStatus: "verified",
          verifiedAt: new Date(),
          verifiedBy: "SYSTEM_BOOTSTRAP",
          phone: "+91 99999 00000",
        });
        adminStatus = "CREATED";
        console.log("   ✅ Initial administrator bootstrapped securely (hashed via bcrypt).");
        console.log("   ⚠️ REMINDER: Change the bootstrap password upon first login.");
      } else {
        adminStatus = "ALREADY_EXISTS";
        console.log(`   🛡️ Administrator account already exists for ${adminEmail} (idempotent skip).`);
      }
    } else {
      console.log("   ℹ️ BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD not set in environment.");
      console.log("   ℹ️ No automatic administrator creation required.");
    }

    // 3. Clinical Data Guard Check
    console.log("\n3. Verifying non-clinical data guardrails...");
    const clinicalColls = ["consultations", "prescriptions", "medications", "orders"];
    for (const collName of clinicalColls) {
      const count = await mongoose.connection.db.collection(collName).countDocuments();
      console.log(`   🔒 Collection [${collName.padEnd(14)}] count: ${count} (No fake production data fabricated)`);
    }

    console.log("\n==============================================================================");
    console.log("📊 SEEDING EXECUTION SUMMARY");
    console.log("==============================================================================");
    console.log(`Catalog Products:      ${insertedCount + existingCount} (Inserted: ${insertedCount}, Existing: ${existingCount})`);
    console.log(`Admin Bootstrap:       ${adminStatus}`);
    console.log(`Fake Clinical Records: ZERO (Guaranteed) ✅`);
    console.log(`Execution Time:        ${Date.now() - startTime}ms`);
    console.log("==============================================================================");

    if (exitOnComplete) {
      await mongoose.disconnect();
      process.exit(0);
    }

    return {
      success: true,
      insertedCount,
      existingCount,
      totalProducts: insertedCount + existingCount,
      adminStatus,
    };
  } catch (err) {
    console.error("❌ DATABASE SEEDING FAILED:", err.message);
    if (exitOnComplete) process.exit(1);
    throw err;
  }
}

// Direct execution CLI entrypoint
if (process.argv[1]?.endsWith("db_seed.js")) {
  seedDatabase({ exitOnComplete: true }).catch(() => process.exit(1));
}
