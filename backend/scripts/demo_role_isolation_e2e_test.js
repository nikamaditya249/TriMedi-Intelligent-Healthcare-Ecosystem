/**
 * ==============================================================================
 * TRIMEDI ROLE-ISOLATED DEMO AUTHENTICATION & RBAC VALIDATION TEST SUITE
 * ==============================================================================
 * Validates the complete role-isolated architecture:
 * 1. Demo account authentication for all 5 roles:
 *    - Patient: demo.patient@trimedi.health
 *    - Doctor: demo.doctor@trimedi.health
 *    - Reception: demo.reception@trimedi.health
 *    - Pharmacy: demo.pharmacy@trimedi.health
 *    - Admin: demo.admin@trimedi.health
 * 2. Strict server-side authorization:
 *    - Patient cannot call Doctor / Pharmacy / Admin APIs
 *    - Doctor cannot call Patient booking / orders / payment / dose-logging APIs
 *    - Reception cannot author prescriptions or complete consultations
 *    - Pharmacy cannot author prescriptions or book consultations
 * 3. Token-based role verification & session integrity
 * ==============================================================================
 */

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = process.env.API_BASE || "http://localhost:5001/api";

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

export async function runRoleIsolationTests() {
  console.log("==================================================================");
  console.log("🔐 TRIMEDI ROLE-ISOLATED DEMO LOGIN & RBAC TEST SUITE");
  console.log("==================================================================");

  const results = [];
  function record(id, title, pass, detail) {
    results.push({ id, title, pass, detail });
    const tag = pass ? "✅ PASS" : "❌ FAIL";
    console.log(`[TEST ${String(id).padStart(2, "0")}] ${tag}: ${title} -> ${detail}`);
  }

  const tokens = {};
  const roles = ["patient", "doctor", "reception", "pharmacy", "admin"];

  // 1-5. Verify real authentication for all 5 demo accounts
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const email = `demo.${role}@trimedi.health`;
    const testId = i + 1;

    try {
      const res = await apiCall("/auth/login", {
        method: "POST",
        body: { email, password: "password123" },
      });

      const passed =
        res.status === 200 &&
        res.body?.token &&
        res.body?.user?.role === role &&
        res.body?.user?.email === email;

      if (passed) {
        tokens[role] = res.body.token;
      }

      record(
        testId,
        `Demo ${role.toUpperCase()} real authentication against /api/auth/login`,
        passed,
        `HTTP ${res.status}, Authenticated Role: ${res.body?.user?.role || "N/A"}`
      );
    } catch (err) {
      record(testId, `Demo ${role.toUpperCase()} authentication`, false, err.message);
    }
  }

  // 6. Patient cannot call Doctor-Initiated Follow-up API
  try {
    const res = await apiCall("/appointments/schedule-followup", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.patient}` },
      body: {
        patientName: "Aditya Nikam",
        patientEmail: "demo.patient@trimedi.health",
        date: "2026-11-20",
        timeSlot: "11:00 AM",
      },
    });
    record(
      6,
      "Patient cannot call Doctor follow-up scheduling API",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(6, "Patient cannot call Doctor follow-up API", false, err.message);
  }

  // 7. Patient cannot revoke a prescription
  try {
    const res = await apiCall("/prescriptions/rx-sample-01/revoke", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.patient}` },
      body: { reason: "Patient revocation attempt" },
    });
    record(
      7,
      "Patient cannot revoke official prescription",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(7, "Patient cannot revoke prescription", false, err.message);
  }

  // 8. Doctor cannot book consultation as a patient (self-booking eliminated)
  try {
    const res = await apiCall("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.doctor}` },
      body: {
        doctorName: "Dr. Sarah Jenkins",
        date: "2026-11-12",
        timeSlot: "10:00 AM",
        mode: "video",
        reason: "Self consultation attempt",
        patientName: "Dr. Sarah Jenkins",
        patientEmail: "demo.doctor@trimedi.health",
      },
    });
    record(
      8,
      "Doctor cannot book consultation as patient",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Blocked"}`
    );
  } catch (err) {
    record(8, "Doctor cannot book consultation as patient", false, err.message);
  }

  // 9. Doctor cannot place patient medicine orders
  try {
    const res = await apiCall("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.doctor}` },
      body: {
        patientEmail: "demo.patient@trimedi.health",
        items: [{ id: "med_01", name: "Atorvastatin 10mg", quantity: 1, price: 15.0 }],
      },
    });
    record(
      9,
      "Doctor cannot place commerce medicine orders",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(9, "Doctor cannot place medicine orders", false, err.message);
  }

  // 10. Doctor cannot initiate PayPal checkout order
  try {
    const res = await apiCall("/paypal/create-order", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.doctor}` },
      body: {
        amount: 30.0,
        currency: "USD",
        items: [{ name: "Consultation Fee", price: 30.0 }],
      },
    });
    record(
      10,
      "Doctor cannot initiate PayPal checkout orders",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(10, "Doctor cannot initiate PayPal checkout", false, err.message);
  }

  // 11. Doctor cannot log patient medication dose ingestion
  try {
    const res = await apiCall("/medications/med_sample_01/dose", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.doctor}` },
      body: { status: "TAKEN", scheduledTime: "08:00 AM" },
    });
    record(
      11,
      "Doctor cannot log patient medication dose ingestion",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(11, "Doctor cannot log patient medication dose", false, err.message);
  }

  // 12. Reception cannot author clinical prescriptions
  try {
    const res = await apiCall("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.reception}` },
      body: {
        patientName: "Aditya Nikam",
        patientEmail: "demo.patient@trimedi.health",
        items: [{ medicineName: "Amoxicillin", dosage: "500mg" }],
        diagnosis: "Bacterial Infection",
      },
    });
    record(
      12,
      "Reception cannot author clinical prescriptions",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(12, "Reception cannot author prescriptions", false, err.message);
  }

  // 13. Reception cannot mark appointment completed
  try {
    const res = await apiCall("/appointments/apt-101/status", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokens.reception}` },
      body: { status: "completed" },
    });
    record(
      13,
      "Reception cannot mark consultations completed (clinical boundary)",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(13, "Reception cannot mark consultations completed", false, err.message);
  }

  // 14. Pharmacy cannot author clinical prescriptions
  try {
    const res = await apiCall("/prescriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.pharmacy}` },
      body: {
        patientName: "Aditya Nikam",
        patientEmail: "demo.patient@trimedi.health",
        items: [{ medicineName: "Metformin", dosage: "500mg" }],
        diagnosis: "Diabetes",
      },
    });
    record(
      14,
      "Pharmacy cannot author clinical prescriptions",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(14, "Pharmacy cannot author prescriptions", false, err.message);
  }

  // 15. Pharmacy cannot book patient consultations
  try {
    const res = await apiCall("/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.pharmacy}` },
      body: {
        doctorName: "Dr. Sarah Jenkins",
        date: "2026-11-12",
        timeSlot: "02:00 PM",
        patientName: "Aditya Nikam",
        patientEmail: "demo.patient@trimedi.health",
      },
    });
    record(
      15,
      "Pharmacy cannot book patient consultations",
      res.status === 403,
      `HTTP ${res.status}: ${res.body?.message || "Forbidden"}`
    );
  } catch (err) {
    record(15, "Pharmacy cannot book consultations", false, err.message);
  }

  console.log("==================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;
  console.log(`📊 SUMMARY: Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    console.error("❌ Some role isolation tests failed!");
    process.exit(1);
  } else {
    console.log("🎉 ALL ROLE ISOLATION & DEMO AUTHENTICATION TESTS PASSED!");
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith("demo_role_isolation_e2e_test.js")) {
  runRoleIsolationTests().catch((err) => {
    console.error("Test runner crash:", err);
    process.exit(1);
  });
}

