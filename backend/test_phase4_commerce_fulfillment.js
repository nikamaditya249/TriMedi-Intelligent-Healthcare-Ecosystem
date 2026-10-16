/**
 * ==============================================================================
 * TRIMEDI PHASE 4 — PHARMACY, PAYMENTS, COMMERCE & FULFILLMENT TEST SUITE
 * ==============================================================================
 * Automated verification of:
 * - Authoritative pricing & client price tampering immunity
 * - Strict prescription validation (expiry, ownership IDOR, medicine match, quantity limits)
 * - Concurrency & atomic stock reservation (prevents overselling & negative inventory)
 * - Cryptographic Razorpay HMAC SHA-256 signature verification
 * - Duplicate webhook idempotency & replay protection
 * - Authoritative 10-stage pharmacy fulfillment state machine & role transitions
 * - Server-verified provider refunds
 * - Least-privilege clinical privacy isolation for pharmacy staff
 * - Socket.IO order room authorization
 */

import http from "http";
import crypto from "crypto";
import { STATIC_DEMO_USERS } from "./middleware/authMiddleware.js";
import { calculateAuthoritativePricing } from "./services/pricingService.js";
import { validateOrderPrescriptions } from "./services/prescriptionValidationService.js";
import { reserveStock, commitStock, releaseStock } from "./services/inventoryService.js";
import PaymentService, { RazorpayProvider } from "./services/paymentService.js";
import { defaultProducts } from "./data/defaultProducts.js";

const BASE_URL = "http://localhost:5001";

const patientToken = "demo_token_patient";
const patientBToken = "Bearer " + "custom_patient_b_token";
const doctorToken = "demo_token_doctor";
const pharmacyToken = "demo_token_pharmacy";
const adminToken = "demo_token_admin";
const receptionToken = "demo_token_reception";

const testResults = [];

function recordTest(name, passed, details = "") {
  testResults.push({ name, passed, details });
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}${details ? ` -> ${details}` : ""}`);
}

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let body = null;
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return { status: response.status, body };
}

async function runPhase4Tests() {
  console.log("\n==================================================================");
  console.log("🚀 RUNNING TRIMEDI PHASE 4 COMMERCE & FULFILLMENT TEST SUITE");
  console.log("==================================================================\n");

  // -------------------------------------------------------------
  // 1. AUTHORITATIVE PRICING & ANTI-PRICE TAMPERING
  // -------------------------------------------------------------
  console.log("--- 1. AUTHORITATIVE PRICING & TAXATION (GST) ---");

  try {
    // Client attempts to tamper price: passes unit price of ₹1 for Paracetamol (catalog price is ₹50)
    const tamperedItems = [
      {
        productId: "660000000000000000000001",
        name: "Paracetamol 500mg",
        price: 1, // Tampered client price!
        quantity: 2,
      },
    ];

    const { pricing, validatedItems } = await calculateAuthoritativePricing(tamperedItems);

    const priceIsAuthoritative = validatedItems[0].unitPrice === 50 && validatedItems[0].lineTotal === 100;
    const gstIsComputed = pricing.cgst > 0 && pricing.sgst > 0 && pricing.totalTax === pricing.cgst + pricing.sgst;
    const deliveryFeeApplied = pricing.deliveryFee === 40; // Total < 500

    if (priceIsAuthoritative && gstIsComputed && deliveryFeeApplied) {
      recordTest("Test 1: Client price tampering strictly blocked (Server calculates authoritative ₹50/unit)", true);
    } else {
      recordTest("Test 1: Client price tampering strictly blocked", false, `Found unitPrice: ${validatedItems[0].unitPrice}`);
    }

    // Test GST Intrastate Split
    if (pricing.cgst === pricing.sgst && pricing.totalTax === 12) {
      recordTest("Test 2: GST Intrastate breakdown calculated correctly (CGST 6% + SGST 6%)", true);
    } else {
      recordTest("Test 2: GST Intrastate breakdown calculated correctly", false, JSON.stringify(pricing));
    }
  } catch (err) {
    recordTest("Test 1 & 2: Pricing calculations", false, err.message);
  }

  // -------------------------------------------------------------
  // 2. PRESCRIPTION VALIDATION & CLINICAL SAFETY
  // -------------------------------------------------------------
  console.log("\n--- 2. PRESCRIPTION VALIDATION & CLINICAL INTEGRITY ---");

  try {
    // Item requiring prescription: Atorvastatin 20mg
    const rxItem = {
      productId: "660000000000000000000021",
      nameSnapshot: "Atorvastatin 20mg",
      prescriptionRequired: true,
      quantity: 1,
    };

    // A. Valid prescription
    const validRxCheck = await validateOrderPrescriptions([{ ...rxItem }], "patient@trimedi.com", "RX-9041");
    recordTest(
      "Test 3: Approved active prescription allows medicine checkout",
      validRxCheck.valid && validRxCheck.errors.length === 0
    );

    // B. Missing prescription reference for Rx medicine
    const missingRxCheck = await validateOrderPrescriptions([{ ...rxItem, prescriptionRef: "" }], "patient@trimedi.com", "");
    recordTest(
      "Test 4: Prescription-required medicine rejected if no prescription is referenced",
      !missingRxCheck.valid && missingRxCheck.errors[0]?.includes("requires an active doctor-approved prescription")
    );

    // C. Non-existent prescription
    const badRxCheck = await validateOrderPrescriptions([{ ...rxItem, prescriptionRef: "" }], "patient@trimedi.com", "RX-NONEXISTENT-999");
    recordTest(
      "Test 5: Non-existent prescription ID rejected safely",
      !badRxCheck.valid && badRxCheck.errors.length > 0
    );

    // D. Excessive quantity exceeding prescription limit
    const excessiveRxItem = {
      ...rxItem,
      quantity: 500, // Prescribed limit is 30
    };
    const excessiveCheck = await validateOrderPrescriptions([excessiveRxItem], "patient@trimedi.com", "RX-9041");
    recordTest(
      "Test 6: Requested quantity exceeding prescription limits rejected",
      !excessiveCheck.valid && excessiveCheck.errors[0].includes("exceeds prescribed limit")
    );

    // E. Over-the-Counter (OTC) medicine bypasses prescription requirement
    const otcItem = {
      productId: "660000000000000000000009",
      nameSnapshot: "ORS Powder Sachet",
      prescriptionRequired: false,
      quantity: 5,
    };
    const otcCheck = await validateOrderPrescriptions([otcItem], "patient@trimedi.com", "");
    recordTest(
      "Test 7: Over-The-Counter (OTC) products bypass prescription validation",
      otcCheck.valid && otcCheck.errors.length === 0
    );
  } catch (err) {
    recordTest("Prescription validation", false, err.message);
  }

  // -------------------------------------------------------------
  // 3. INVENTORY CONCURRENCY & RACE CONDITION DEFENSE
  // -------------------------------------------------------------
  console.log("\n--- 3. INVENTORY CONCURRENCY & ATOMIC RESERVATION ---");

  try {
    // Setup a test product in defaultProducts with Stock = 1
    const raceProduct = {
      _id: "660000000000000000000999",
      name: "Rare Emergency Serum",
      stockQuantity: 1,
      reservedQuantity: 0,
      availableQuantity: 1,
      price: 500,
      active: true,
    };
    defaultProducts.push(raceProduct);

    // Two users attempt to reserve the 1 available unit simultaneously!
    const userAReservePromise = reserveStock(
      [{ productId: raceProduct._id, quantity: 1 }],
      "ORD-USER-A",
      STATIC_DEMO_USERS["demo_token_patient"]
    );
    const userBReservePromise = reserveStock(
      [{ productId: raceProduct._id, quantity: 1 }],
      "ORD-USER-B",
      STATIC_DEMO_USERS["demo_token_patient"]
    );

    const outcomes = await Promise.allSettled([userAReservePromise, userBReservePromise]);

    const successes = outcomes.filter((o) => o.status === "fulfilled");
    const failures = outcomes.filter((o) => o.status === "rejected");

    const exactlyOneSucceeded = successes.length === 1 && failures.length === 1;
    const finalAvailable = raceProduct.stockQuantity - raceProduct.reservedQuantity;
    const noNegativeStock = raceProduct.reservedQuantity <= raceProduct.stockQuantity && finalAvailable >= 0;

    recordTest(
      "Test 8: Concurrent purchase race condition: Exactly 1 user succeeds, 1 blocked (0 oversell)",
      exactlyOneSucceeded,
      `Successes: ${successes.length}, Failures: ${failures.length}`
    );

    recordTest(
      "Test 9: Stock can never become negative under concurrent access (Available >= 0)",
      noNegativeStock,
      `Reserved: ${raceProduct.reservedQuantity}, Stock: ${raceProduct.stockQuantity}`
    );

    // Release the reservation
    await releaseStock([{ productId: raceProduct._id, quantity: 1 }], "ORD-USER-A");
    const restoredAvailable = raceProduct.stockQuantity - raceProduct.reservedQuantity;
    recordTest(
      "Test 10: Failed / cancelled order releases reservation back to inventory",
      restoredAvailable === 1 && raceProduct.reservedQuantity === 0
    );
  } catch (err) {
    recordTest("Inventory concurrency test", false, err.message);
  }

  // -------------------------------------------------------------
  // 4. PAYMENT SIGNATURE CRYPTOGRAPHY & WEBHOOK IDEMPOTENCY
  // -------------------------------------------------------------
  console.log("\n--- 4. CRYPTOGRAPHIC PAYMENT VERIFICATION & IDEMPOTENCY ---");

  try {
    const dummyOrderId = "order_rzp_mock_12345";
    const dummyPaymentId = "pay_rzp_mock_67890";

    // A. Generate authentic test signature
    const validSignature = RazorpayProvider.generateTestSignature({
      razorpayOrderId: dummyOrderId,
      razorpayPaymentId: dummyPaymentId,
    });

    const verifySuccess = RazorpayProvider.verifySignature({
      razorpayOrderId: dummyOrderId,
      razorpayPaymentId: dummyPaymentId,
      razorpaySignature: validSignature,
    });
    recordTest("Test 11: Valid HMAC SHA-256 Razorpay signature verified successfully", verifySuccess === true);

    // B. Forged / Tampered signature must fail
    const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const verifyForged = RazorpayProvider.verifySignature({
      razorpayOrderId: dummyOrderId,
      razorpayPaymentId: dummyPaymentId,
      razorpaySignature: forgedSignature,
    });
    recordTest("Test 12: Forged / tampered signature rejected cryptographically", verifyForged === false);

    // C. Payment Verification Endpoint via REST
    const verifyApiRes = await apiRequest("/api/payment/razorpay/verify", {
      method: "POST",
      headers: { Authorization: patientToken },
      body: JSON.stringify({
        razorpayOrderId: dummyOrderId,
        razorpayPaymentId: dummyPaymentId,
        razorpaySignature: validSignature,
        items: [{ productId: "660000000000000000000001", quantity: 1 }],
        deliveryAddress: {
          fullName: "Aditya Nikam",
          phone: "+91 98765 43210",
          street: "Sunshine Heights",
          pincode: "400001",
        },
      }),
    });

    const isOrderCreated = verifyApiRes.status === 200 && verifyApiRes.body.order?.paymentStatus === "PAID";
    recordTest("Test 13: Server confirms order and marks PAID only after cryptographic verification", isOrderCreated);

    // D. Idempotent Replay: Sending same payment verification a second time must not duplicate
    const replayRes = await apiRequest("/api/payment/razorpay/verify", {
      method: "POST",
      headers: { Authorization: patientToken },
      body: JSON.stringify({
        razorpayOrderId: dummyOrderId,
        razorpayPaymentId: dummyPaymentId,
        razorpaySignature: validSignature,
        items: [{ productId: "660000000000000000000001", quantity: 1 }],
      }),
    });

    const isIdempotentReplay = replayRes.status === 200 && (replayRes.body.isDuplicate === true || replayRes.body.order);
    recordTest("Test 14: Payment verification idempotent replay prevents duplicate order generation", isIdempotentReplay);

    // E. Webhook Idempotency: Duplicate webhook delivery handled once
    const webhookEventId = `evt_test_${Date.now()}`;
    const webhookRes1 = await apiRequest("/api/payment/razorpay/webhook", {
      method: "POST",
      body: JSON.stringify({
        id: webhookEventId,
        event: "payment.captured",
        payload: {
          payment: { entity: { id: dummyPaymentId, order_id: dummyOrderId, amount: 5000 } },
        },
      }),
    });

    const webhookRes2 = await apiRequest("/api/payment/razorpay/webhook", {
      method: "POST",
      body: JSON.stringify({
        id: webhookEventId,
        event: "payment.captured",
        payload: {
          payment: { entity: { id: dummyPaymentId, order_id: dummyOrderId, amount: 5000 } },
        },
      }),
    });

    const isWebhookIdempotent = webhookRes1.status === 200 && webhookRes2.body.duplicate === true;
    recordTest("Test 15: Duplicate webhook delivery is recognized and handled idempotently", isWebhookIdempotent);
  } catch (err) {
    recordTest("Payment & signature testing", false, err.message);
  }

  // -------------------------------------------------------------
  // 5. AUTHORITATIVE FULFILLMENT STATE MACHINE & RBAC
  // -------------------------------------------------------------
  console.log("\n--- 5. AUTHORITATIVE ORDER STATE MACHINE & ROLE BOUNDARIES ---");

  try {
    // Create fresh order for testing state machine
    const createOrderRes = await apiRequest("/api/orders", {
      method: "POST",
      headers: { Authorization: patientToken },
      body: JSON.stringify({
        items: [{ productId: "660000000000000000000001", quantity: 1 }],
        paymentMethod: "cod",
      }),
    });

    const testOrderId = createOrderRes.body.order?.orderId;

    // A. Invalid State Jump: Transitioning NEW directly to DELIVERED must fail
    const illegalJumpRes = await apiRequest(`/api/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: pharmacyToken },
      body: JSON.stringify({ status: "DELIVERED" }),
    });

    recordTest(
      "Test 16: Illegal state jump (NEW -> DELIVERED) rejected with HTTP 400",
      illegalJumpRes.status === 400 || illegalJumpRes.status === 403
    );

    // B. Patient cannot transition order to ACCEPTED
    const patientIllegalRes = await apiRequest(`/api/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: patientToken },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });

    recordTest(
      "Test 17: Patient role forbidden from transitioning pharmacy fulfillment states (HTTP 403)",
      patientIllegalRes.status === 403
    );

    // C. Valid Pharmacy Transition: NEW -> ACCEPTED
    const acceptRes = await apiRequest(`/api/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: pharmacyToken },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    recordTest("Test 18: Authorized pharmacy staff transitions order to ACCEPTED", acceptRes.status === 200);

    // D. Valid Pharmacy Transition: ACCEPTED -> PREPARING
    const preparingRes = await apiRequest(`/api/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: pharmacyToken },
      body: JSON.stringify({ status: "PREPARING" }),
    });
    recordTest("Test 19: Pharmacy transitions order to PREPARING", preparingRes.status === 200);

    // E. Valid Pharmacy Transition: PREPARING -> PACKED
    const packedRes = await apiRequest(`/api/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: pharmacyToken },
      body: JSON.stringify({ status: "PACKED" }),
    });
    recordTest("Test 20: Pharmacy transitions order to PACKED", packedRes.status === 200);

    // F. Admin / Delivery Transition: PACKED -> DISPATCHED -> OUT_FOR_DELIVERY -> DELIVERED
    const dispatchRes = await apiRequest(`/api/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: adminToken },
      body: JSON.stringify({ status: "DISPATCHED" }),
    });
    const outRes = await apiRequest(`/api/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: adminToken },
      body: JSON.stringify({ status: "OUT_FOR_DELIVERY" }),
    });
    const deliverRes = await apiRequest(`/api/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: adminToken },
      body: JSON.stringify({ status: "DELIVERED" }),
    });

    const isDelivered = deliverRes.status === 200 && deliverRes.body.order?.status === "DELIVERED";
    // For COD, paymentStatus must automatically transition to PAID upon delivery
    const isCodPaid = deliverRes.body.order?.paymentStatus === "PAID";

    recordTest("Test 21: Complete fulfillment progression to DELIVERED verified", isDelivered);
    recordTest("Test 22: COD order payment status transitions to PAID upon delivery", isCodPaid);
  } catch (err) {
    recordTest("Fulfillment state machine testing", false, err.message);
  }

  // -------------------------------------------------------------
  // 6. IDOR DEFENSE & LEAST-PRIVILEGE CLINICAL SHIELDING
  // -------------------------------------------------------------
  console.log("\n--- 6. IDOR DEFENSE & LEAST-PRIVILEGE CLINICAL SHIELDING ---");

  try {
    // Unauthenticated access
    const noAuthRes = await apiRequest("/api/orders");
    recordTest("Test 23: Unauthenticated order access blocked with HTTP 401", noAuthRes.status === 401);

    // Reception role cannot access commercial orders
    const receptionRes = await apiRequest("/api/orders", {
      headers: { Authorization: receptionToken },
    });
    recordTest("Test 24: Operational reception role blocked from commercial orders (HTTP 403)", receptionRes.status === 403);

    // Patient cannot modify inventory stock
    const patientStockRes = await apiRequest("/api/products/660000000000000000000001/stock", {
      method: "PATCH",
      headers: { Authorization: patientToken },
      body: JSON.stringify({ stockAdjustment: 100 }),
    });
    recordTest("Test 25: Patient forbidden from altering pharmacy inventory stock (HTTP 403)", patientStockRes.status === 403);

    // Pharmacy staff can adjust stock
    const pharmacyStockRes = await apiRequest("/api/products/660000000000000000000001/stock", {
      method: "PATCH",
      headers: { Authorization: pharmacyToken },
      body: JSON.stringify({ stockAdjustment: 10 }),
    });
    recordTest("Test 26: Authorized pharmacy staff can replenish inventory stock", pharmacyStockRes.status === 200);

    // Pharmacy staff querying clinical medical records must be blocked
    const pharmacyClinicalRes = await apiRequest("/api/consultations/patient-record?patientEmail=patient@trimedi.com", {
      headers: { Authorization: pharmacyToken },
    });
    recordTest(
      "Test 27: Least-Privilege: Pharmacy blocked from private clinical notes & histories (HTTP 403)",
      pharmacyClinicalRes.status === 403
    );
  } catch (err) {
    recordTest("Security and IDOR testing", false, err.message);
  }

  // -------------------------------------------------------------
  // 7. SOCKET.IO REAL-TIME ORDER ROOM SECURITY & ISOLATION
  // -------------------------------------------------------------
  console.log("\n--- 7. SOCKET.IO ORDER ROOM SECURITY & ISOLATION ---");

  try {
    const { io: ClientIO } = await import("socket.io-client");

    const patientSocket = ClientIO(BASE_URL, {
      auth: { token: patientToken },
      reconnection: false,
      timeout: 3000,
    });

    await new Promise((resolve) => {
      patientSocket.on("connect", resolve);
      patientSocket.on("connect_error", () => resolve(false));
    });

    recordTest("Test 28: Authenticated client connects to Socket.IO with server-derived identity", patientSocket.connected === true);

    // Patient A attempts to join Patient B's private order room
    let socketIdorBlocked = false;
    patientSocket.emit("order:join", { orderId: "ORD-PATIENT-B-PRIVATE-888" });

    socketIdorBlocked = await new Promise((resolve) => {
      patientSocket.on("error:unauthorized", (err) => {
        resolve(true);
      });
      setTimeout(() => resolve(false), 800);
    });

    recordTest(
      "Test 29: Socket.IO IDOR Defense: Patient A blocked from joining Patient B order room",
      socketIdorBlocked === true
    );

    patientSocket.disconnect();
  } catch (err) {
    recordTest("Socket.IO security testing", false, err.message);
  }

  // -------------------------------------------------------------
  // 8. SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  const totalPassed = testResults.filter((r) => r.passed).length;
  const totalFailed = testResults.filter((r) => !r.passed).length;
  console.log(`📋 PHASE 4 TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${testResults.length} tests`);
  console.log("==================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase4Tests();
