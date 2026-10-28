/**
 * ==============================================================================
 * TRIMEDI FUNCTIONAL ROLE UX & WORKFLOW AUDIT TEST SUITE
 * ==============================================================================
 * Validates role-based UX, RBAC enforcement, state machine transitions,
 * IDOR protection, and commerce/clinical separation across all roles:
 * - Patient, Doctor, Reception, Pharmacy, Admin.
 *
 * Scenarios tested:
 *  1. [RBAC] Doctor cannot book consultation as patient (POST /api/appointments -> 403)
 *  2. [RBAC] Pharmacy cannot book patient consultation (POST /api/appointments -> 403)
 *  3. [RBAC] Patient can book patient consultation for self (POST /api/appointments -> 201)
 *  4. [IDOR] Patient cannot book appointment under another patient's email (POST /api/appointments -> 403)
 *  5. [RBAC] Doctor can schedule follow-up consultation (POST /api/appointments/schedule-followup -> 201)
 *  6. [RBAC] Patient cannot schedule clinical follow-up directly (POST /api/appointments/schedule-followup -> 403)
 *  7. [State Machine] Invalid appointment status transition rejected (PUT /api/appointments/:id/status -> 400)
 *  8. [RBAC/State] Patient cannot mark appointment confirmed/completed (PUT /api/appointments/:id/status -> 403)
 *  9. [RBAC/State] Doctor can progress appointment (confirmed -> in_consultation -> completed) (200)
 * 10. [Commerce Isolation] Doctor cannot place medicine orders (POST /api/orders -> 403)
 * 11. [Commerce Isolation] Reception cannot place medicine orders (POST /api/orders -> 403)
 * 12. [Commerce Isolation] Doctor cannot initiate PayPal checkout (POST /api/paypal/create-order -> 403)
 * 13. [Clinical Separation] Doctor cannot log medication dose ingestion (POST /api/medications/:id/dose -> 403)
 * 14. [Clinical Separation] Reception cannot log medication dose ingestion (POST /api/medications/:id/dose -> 403)
 * 15. [Prescription Lifecycle] Doctor can revoke prescription with clinical reason (POST /api/prescriptions/:id/revoke -> 200)
 * 16. [RBAC] Patient cannot revoke prescription (POST /api/prescriptions/:id/revoke -> 403)
 * 17. [State Machine] Invalid prescription status transition rejected (PUT /api/prescriptions/:id/status -> 400)
 * 18. [IDOR Isolation] Patient appointments query scoped strictly to authenticated patient (GET /api/appointments)
 * 19. [IDOR Isolation] Patient prescriptions query scoped strictly to authenticated patient (GET /api/prescriptions)
 * ==============================================================================
 */

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = process.env.API_BASE || "http://localhost:5001/api";
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { status: res.status, body };
}

export async function runFunctionalRoleAuditTests() {
  console.log("==================================================================");
  console.log("🏥 TRIMEDI SENIOR DEVELOPER ROLE-BASED UX & WORKFLOW AUDIT SUITE");
  console.log("==================================================================");

  const results = [];
  function record(id, title, pass, detail) {
    results.push({ id, title, pass, detail });
    const tag = pass ? "✅ PASS" : "❌ FAIL";
    console.log(`[TEST ${String(id).padStart(2, "0")}] ${tag}: ${title} -> ${detail}`);
  }

  // Generate role tokens
  const patientToken = jwt.sign(
    { id: "pat_audit_1", email: "aditya.nikam@trimedi.health", role: "patient", name: "Aditya Nikam" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  const patient2Token = jwt.sign(
    { id: "pat_audit_2", email: "other.patient@trimedi.health", role: "patient", name: "Other Patient" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  const doctorToken = jwt.sign(
    { id: "doc_audit_1", email: "sarah.jenkins@trimedi.health", role: "doctor", name: "Dr. Sarah Jenkins" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  const pharmacyToken = jwt.sign(
    { id: "pharm_audit_1", email: "pharmacy@trimedi.health", role: "pharmacy", name: "TriMedi Central Pharmacy" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  const receptionToken = jwt.sign(
    { id: "rec_audit_1", email: "reception@trimedi.health", role: "reception", name: "Reception Desk" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  const adminToken = jwt.sign(
    { id: "adm_audit_1", email: "admin@trimedi.health", role: "admin", name: "System Admin" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  let createdAppointmentId = null;
  let createdPrescriptionId = null;

  // -------------------------------------------------------------
  // 1. DOCTOR CANNOT BOOK PATIENT CONSULTATION
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        doctorName: "Dr. Sarah Jenkins",
        date: "2026-11-10",
        time: "10:00 AM",
        mode: "video",
        reason: "Self consultation attempt",
        patientName: "Dr. Sarah Jenkins",
        patientEmail: "sarah.jenkins@trimedi.health",
      },
    });
    record(
      1,
      "Doctor cannot book consultation as patient",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Blocked"}`
    );
  } catch (err) {
    record(1, "Doctor cannot book consultation as patient", false, err.message);
  }

  // -------------------------------------------------------------
  // 2. PHARMACY CANNOT BOOK PATIENT CONSULTATION
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${pharmacyToken}` },
      body: {
        doctorName: "Dr. Sarah Jenkins",
        date: "2026-11-10",
        time: "10:30 AM",
        mode: "video",
        reason: "Pharmacy consultation booking",
        patientName: "Aditya Nikam",
        patientEmail: "aditya.nikam@trimedi.health",
      },
    });
    record(
      2,
      "Pharmacy cannot book patient consultation",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Blocked"}`
    );
  } catch (err) {
    record(2, "Pharmacy cannot book patient consultation", false, err.message);
  }

  // -------------------------------------------------------------
  // 3. PATIENT CAN BOOK CONSULTATION FOR THEMSELVES
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        doctorName: "Dr. Sarah Jenkins",
        doctorEmail: "sarah.jenkins@trimedi.health",
        date: "2026-11-05",
        timeSlot: "11:00 AM",
        time: "11:00 AM",
        mode: "video",
        reason: "Lipid Panel Review & Renewal",
        patientName: "Aditya Nikam",
        patientEmail: "aditya.nikam@trimedi.health",
      },
    });
    const passed = res.status === 201 && (res.body?.appointment?._id || res.body?.appointment?.id);
    if (passed) {
      createdAppointmentId = res.body.appointment._id || res.body.appointment.id;
    }
    record(
      3,
      "Patient books consultation for self",
      passed,
      `HTTP ${res.status}, ID: ${createdAppointmentId || "N/A"}`
    );
  } catch (err) {
    record(3, "Patient books consultation for self", false, err.message);
  }

  // -------------------------------------------------------------
  // 4. PATIENT IDOR CHECK: CANNOT BOOK FOR ANOTHER EMAIL
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        doctorName: "Dr. Sarah Jenkins",
        date: "2026-11-05",
        time: "11:30 AM",
        mode: "video",
        reason: "IDOR Exploit Attempt",
        patientName: "Other Patient",
        patientEmail: "other.patient@trimedi.health",
      },
    });
    record(
      4,
      "Patient cannot book appointment for different patient email (IDOR)",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(4, "Patient IDOR appointment booking", false, err.message);
  }

  // -------------------------------------------------------------
  // 5. DOCTOR CAN SCHEDULE FOLLOW-UP CONSULTATION
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/appointments/schedule-followup", {
      method: "POST",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        patientName: "Aditya Nikam",
        patientEmail: "aditya.nikam@trimedi.health",
        date: "2026-11-19",
        timeSlot: "02:00 PM",
        time: "02:00 PM",
        mode: "in-person",
        reason: "Post-intervention 2-week lipid check",
        clinicalNotes: "Patient tolerated statin therapy well",
      },
    });
    record(
      5,
      "Doctor can schedule follow-up consultation",
      res.status === 201,
      `HTTP ${res.status}: ${res.body?.message || "Scheduled"}`
    );
  } catch (err) {
    record(5, "Doctor can schedule follow-up consultation", false, err.message);
  }

  // -------------------------------------------------------------
  // 6. PATIENT CANNOT CALL FOLLOW-UP SCHEDULING DIRECTLY
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/appointments/schedule-followup", {
      method: "POST",
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        patientName: "Aditya Nikam",
        patientEmail: "aditya.nikam@trimedi.health",
        date: "2026-11-19",
        time: "02:00 PM",
      },
    });
    record(
      6,
      "Patient cannot call doctor follow-up endpoint",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(6, "Patient cannot call doctor follow-up endpoint", false, err.message);
  }

  // -------------------------------------------------------------
  // 7. APPOINTMENT STATE MACHINE: INVALID TRANSITION REJECTED
  // -------------------------------------------------------------
  try {
    const targetId = createdAppointmentId || "apt-101";
    // Attempt invalid transition directly from scheduled to completed (bypassing consultation)
    const res = await apiCall(`/appointments/${targetId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: { status: "completed" },
    });
    record(
      7,
      "Invalid appointment transition rejected by state machine",
      res.status === 400,
      `HTTP ${res.status}: ${res.body?.message || "Rejected"}`
    );
  } catch (err) {
    record(7, "Invalid appointment transition rejected", false, err.message);
  }

  // -------------------------------------------------------------
  // 8. PATIENT CANNOT MARK APPOINTMENT CONFIRMED OR COMPLETED
  // -------------------------------------------------------------
  try {
    const targetId = createdAppointmentId || "apt-101";
    const res = await apiCall(`/appointments/${targetId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${patientToken}` },
      body: { status: "confirmed" },
    });
    record(
      8,
      "Patient cannot self-complete or confirm appointment",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(8, "Patient cannot self-complete appointment", false, err.message);
  }

  // -------------------------------------------------------------
  // 9. DOCTOR CAN PROGRESS APPOINTMENT (scheduled -> confirmed -> in_consultation -> completed)
  // -------------------------------------------------------------
  try {
    const targetId = createdAppointmentId || "apt-101";
    const res1 = await apiCall(`/appointments/${targetId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: { status: "confirmed" },
    });
    const res2 = await apiCall(`/appointments/${targetId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: { status: "in_consultation" },
    });
    const res3 = await apiCall(`/appointments/${targetId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: { status: "completed" },
    });
    const passed =
      (res1.status === 200 || res1.status === 201) &&
      (res2.status === 200 || res2.status === 201) &&
      (res3.status === 200 || res3.status === 201);
    record(
      9,
      "Doctor can progress appointment through clinical states",
      passed,
      `confirmed HTTP ${res1.status}, in_consultation HTTP ${res2.status}, completed HTTP ${res3.status}`
    );
  } catch (err) {
    record(9, "Doctor can progress appointment", false, err.message);
  }

  // -------------------------------------------------------------
  // 10. DOCTOR CANNOT PLACE MEDICINE ORDERS
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        patientEmail: "aditya.nikam@trimedi.health",
        items: [{ id: "med_01", name: "Atorvastatin 10mg", quantity: 1, price: 12.0 }],
        shippingAddress: { address: "123 Main St", city: "Metropolis", zip: "10001" },
      },
    });
    record(
      10,
      "Doctor cannot place medicine orders",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(10, "Doctor cannot place medicine orders", false, err.message);
  }

  // -------------------------------------------------------------
  // 11. RECEPTION CANNOT PLACE MEDICINE ORDERS
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: {
        patientEmail: "aditya.nikam@trimedi.health",
        items: [{ id: "med_01", name: "Atorvastatin 10mg", quantity: 1, price: 12.0 }],
      },
    });
    record(
      11,
      "Reception cannot place medicine orders",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(11, "Reception cannot place medicine orders", false, err.message);
  }

  // -------------------------------------------------------------
  // 12. DOCTOR CANNOT INITIATE PAYPAL CHECKOUT
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/paypal/create-order", {
      method: "POST",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        amount: 25.0,
        currency: "USD",
        items: [{ name: "Consultation Fee", price: 25.0 }],
      },
    });
    record(
      12,
      "Doctor cannot initiate PayPal checkout order",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(12, "Doctor cannot initiate PayPal checkout", false, err.message);
  }

  // -------------------------------------------------------------
  // 13. DOCTOR CANNOT LOG PATIENT MEDICATION DOSE
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/medications/med_101/dose", {
      method: "POST",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        status: "TAKEN",
        scheduledTime: "08:00 AM",
      },
    });
    record(
      13,
      "Doctor cannot log patient medication dose ingestion",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(13, "Doctor cannot log patient medication dose", false, err.message);
  }

  // -------------------------------------------------------------
  // 14. RECEPTION CANNOT LOG PATIENT MEDICATION DOSE
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/medications/med_101/dose", {
      method: "POST",
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: {
        status: "TAKEN",
        scheduledTime: "08:00 AM",
      },
    });
    record(
      14,
      "Reception cannot log patient medication dose ingestion",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(14, "Reception cannot log patient medication dose", false, err.message);
  }

  // -------------------------------------------------------------
  // 15. DOCTOR CAN REVOKE PRESCRIPTION WITH CLINICAL REASON
  // -------------------------------------------------------------
  try {
    // First, doctor creates a prescription
    const createRes = await apiCall("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        patientName: "Aditya Nikam",
        patientEmail: "aditya.nikam@trimedi.health",
        medications: [
          { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily", duration: "30 days" },
        ],
        diagnosis: "Hyperlipidemia",
      },
    });
    createdPrescriptionId = createRes.body?.prescription?._id || createRes.body?.prescription?.id || "rx_test_01";

    const revokeRes = await apiCall(`/prescriptions/${createdPrescriptionId}/revoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        reason: "Patient reported acute muscle cramping; discontinuing statin",
      },
    });
    record(
      15,
      "Doctor can revoke prescription with clinical reason",
      revokeRes.status === 200,
      `HTTP ${revokeRes.status}: ${revokeRes.body?.message || "Revoked"}`
    );
  } catch (err) {
    record(15, "Doctor can revoke prescription", false, err.message);
  }

  // -------------------------------------------------------------
  // 16. PATIENT CANNOT REVOKE PRESCRIPTION
  // -------------------------------------------------------------
  try {
    const targetRx = createdPrescriptionId || "rx_test_01";
    const res = await apiCall(`/prescriptions/${targetRx}/revoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${patientToken}` },
      body: { reason: "Self-revocation attempt" },
    });
    record(
      16,
      "Patient cannot revoke prescription",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(16, "Patient cannot revoke prescription", false, err.message);
  }

  // -------------------------------------------------------------
  // 17. INVALID PRESCRIPTION STATUS TRANSITION REJECTED
  // -------------------------------------------------------------
  try {
    const targetRx = createdPrescriptionId || "rx_test_01";
    // Attempt invalid transition: revoked -> approved
    const res = await apiCall(`/prescriptions/${targetRx}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: { status: "approved" },
    });
    record(
      17,
      "Invalid prescription status transition rejected by state machine",
      res.status === 400,
      `HTTP ${res.status}: ${res.body?.message || "Rejected"}`
    );
  } catch (err) {
    record(17, "Invalid prescription status transition rejected", false, err.message);
  }

  // -------------------------------------------------------------
  // 18. PATIENT APPOINTMENTS QUERY SCOPED BY AUTHENTICATED USER
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/appointments", {
      headers: { Authorization: `Bearer ${patient2Token}` },
    });
    const appointments = res.body?.appointments || [];
    const hasLeak = appointments.some(
      (a) => a.patientEmail && a.patientEmail !== "other.patient@trimedi.health"
    );
    record(
      18,
      "Patient appointments query scoped to authenticated patient (IDOR protection)",
      res.status === 200 && !hasLeak,
      `Returned ${appointments.length} appointments, data leak detected: ${hasLeak}`
    );
  } catch (err) {
    record(18, "Patient appointments query scoped", false, err.message);
  }

  // -------------------------------------------------------------
  // 19. PATIENT PRESCRIPTIONS QUERY SCOPED BY AUTHENTICATED USER
  // -------------------------------------------------------------
  try {
    const res = await apiCall("/prescriptions", {
      headers: { Authorization: `Bearer ${patient2Token}` },
    });
    const prescriptions = res.body?.prescriptions || [];
    const hasLeak = prescriptions.some(
      (p) => p.patientEmail && p.patientEmail !== "other.patient@trimedi.health"
    );
    record(
      19,
      "Patient prescriptions query scoped to authenticated patient (IDOR protection)",
      res.status === 200 && !hasLeak,
      `Returned ${prescriptions.length} prescriptions, data leak detected: ${hasLeak}`
    );
  } catch (err) {
    record(19, "Patient prescriptions query scoped", false, err.message);
  }

  console.log("==================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;
  console.log(`📊 SUMMARY: Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    console.error("❌ Some role audit test scenarios failed!");
    process.exit(1);
  } else {
    console.log("🎉 ALL ROLE AUDIT & WORKFLOW TESTS PASSED!");
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith("functional_role_audit_test.js")) {
  runFunctionalRoleAuditTests().catch((err) => {
    console.error("Test runner crash:", err);
    process.exit(1);
  });
}
