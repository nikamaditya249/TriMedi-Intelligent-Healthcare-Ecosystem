/**
 * Test Live MongoDB Atlas Connectivity
 * Verifies DNS resolution, TLS handshake, authentication, and read/write operations.
 * Never prints password or raw URI with credentials.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const rawUri = process.env.MONGO_URI || "";

function sanitizeUri(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}

console.log("==================================================");
console.log("🔍 TESTING LIVE MONGODB ATLAS CONNECTIVITY");
console.log("==================================================");
console.log("Sanitized URI:", sanitizeUri(rawUri));

if (!rawUri) {
  console.error("❌ MONGO_URI is not set in environment!");
  process.exit(1);
}

const startTime = Date.now();

try {
  console.log("Attempting Mongoose connection (timeout 10s)...");
  await mongoose.connect(rawUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  const duration = Date.now() - startTime;
  console.log(`✅ CONNECTED SUCCESSFULLY in ${duration}ms!`);
  console.log("Database Name:", mongoose.connection.name);
  console.log("Connection State:", mongoose.connection.readyState === 1 ? "CONNECTED (1)" : mongoose.connection.readyState);
  console.log("Host:", mongoose.connection.host);

  // Test read operation
  console.log("\nTesting read operation (admin ping or list collections)...");
  const adminDb = mongoose.connection.db.admin();
  const pingResult = await adminDb.ping();
  console.log("✅ Admin Ping Result:", pingResult);

  // Test collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`✅ Found ${collections.length} collections:`, collections.map(c => c.name));

  // Test simple document count or read
  if (collections.some(c => c.name === "products")) {
    const count = await mongoose.connection.db.collection("products").countDocuments();
    console.log(`✅ Products collection document count: ${count}`);
  }

  // Test harmless write operation in a temporary collection
  console.log("\nTesting write operation in _connectivity_test collection...");
  const testColl = mongoose.connection.db.collection("_connectivity_test");
  const testDoc = { timestamp: new Date(), test: "phase_5_95_verification" };
  const insertResult = await testColl.insertOne(testDoc);
  console.log("✅ Insert Result acknowledged:", insertResult.acknowledged);

  await testColl.deleteOne({ _id: insertResult.insertedId });
  console.log("✅ Cleanup test document successful.");

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("🎉 MONGODB ATLAS CONNECTION VERIFIED SUCCESSFULLY!");
  console.log("==================================================");
  process.exit(0);
} catch (err) {
  const duration = Date.now() - startTime;
  console.error(`❌ CONNECTION FAILED after ${duration}ms!`);
  console.error("Error Name:", err.name);
  console.error("Error Message:", err.message);
  if (err.cause) {
    console.error("Cause:", err.cause);
  }
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
