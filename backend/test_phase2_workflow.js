import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "trimedi_secure_jwt_secret_2026";
const API_BASE = "http://localhost:5001/api";

// Generate authenticated role tokens
const patientAToken = jwt.sign(
  { id: "660000000000000000000001", email: "aditya@trimedi.health", role: "patient", name: "Aditya Nikam" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const patientBToken = jwt.sign(
  { id: "660000000000000000000002", email: "other.patient@trimedi.health", role: "patient", name: "Other Patient" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const doctorToken = jwt.sign(
  { id: "660000000000000000000003", email: "doctor@trimedi.health", role: "doctor", name: "Dr. Sarah Jenkins" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const receptionToken = jwt.sign(
  { id: "660000000000000000000004", email: "reception@trimedi.health", role: "reception", name: "Front Desk Staff" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const pharmacyToken = jwt.sign(
  { id: "660000000000000000000005", email: "pharmacy@trimedi.health", role: "pharmacy", name: "Metro Care Pharmacy" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const adminToken = jwt.sign(
  { id: "660000000000000000000006", email: "admin@trimedi.health", role: "admin", name: "Super Admin" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

// Helper for fetch with auth
async function apiCall(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = { text: await res.text().catch(() => "") };
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("==================================================================");
  console.log("🏥 TRIMEDI PHASE 2 — REAL HEALTHCARE WORKFLOW & SECURITY TEST SUITE");
  console.log("==================================================================");

  const results = [];
  function record(name, expected, actual, pass) {
    results.push({ name, expected, actual, pass });
    console.log(`[${pass ? "PASS" : "FAIL"}] ${name}`);
    if (!pass) {
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual:   ${actual}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. PATIENT REGISTRATION & ONBOARDING
    // -------------------------------------------------------------------------
    console.log("\n--- 1. PATIENT REGISTRATION & ONBOARDING ---");
    const walkinEmail = `jane.test_${Date.now()}@trimedi.health`;
    const regRes = await apiCall(
      "/reception/register-patient",
      "POST",
      {
        name: "Test Patient Jane",
        email: walkinEmail,
        phone: "+1-555-0199",
        dob: "1990-05-14",
        gender: "female",
        bloodGroup: "A+",
        existingConditions: ["Mild Asthma"],
        allergies: ["Penicillin"],
      },
      receptionToken
    );
    record(
      "Reception Registers Walk-in Patient with Clinical Baseline",
      "201 Created with stable ID and clinical profile",
      `${regRes.status}: ${regRes.data?.patient?.email || regRes.data?.message}`,
      regRes.status === 201 && regRes.data?.patient?.email === walkinEmail
    );

    // -------------------------------------------------------------------------
    // 2. APPOINTMENT CREATION & LIFECYCLE STATE MACHINE
    // -------------------------------------------------------------------------
    console.log("\n--- 2. APPOINTMENT STATE MACHINE TRANSITIONS ---");
    // Create new appointment
    const createAptRes = await apiCall(
      "/appointments",
      "POST",
      {
        doctorName: "Dr. Sarah Jenkins",
        doctorEmail: "doctor@trimedi.health",
        patientName: "Aditya Nikam",
        patientEmail: "aditya@trimedi.health",
        appointmentDate: "2026-10-16",
        timeSlot: "10:30 AM",
        reason: "Follow-up Cardiology Evaluation",
        type: "in-person",
      },
      patientAToken
    );

    const aptId = createAptRes.data?.appointment?._id || createAptRes.data?.appointment?.id || createAptRes.data?._id;
    record(
      "Create Initial Appointment in REQUESTED / SCHEDULED state",
      "201 Created",
      `${createAptRes.status}`,
      createAptRes.status === 201 && !!aptId
    );

    // Test Invalid Transition: scheduled -> completed directly (MUST BE REJECTED)
    const invalidJumpRes = await apiCall(
      `/appointments/${aptId}/status`,
      "PUT",
      { status: "completed" },
      doctorToken
    );
    record(
      "Reject Invalid State Transition Jump (scheduled -> completed)",
      "400 Bad Request",
      `${invalidJumpRes.status}: ${invalidJumpRes.data?.message}`,
      invalidJumpRes.status === 400
    );

    // Valid Transition 1: scheduled -> confirmed
    const toConfirmedRes = await apiCall(
      `/appointments/${aptId}/status`,
      "PUT",
      { status: "confirmed" },
      doctorToken
    );
    record(
      "Valid Transition: scheduled -> confirmed",
      "200 OK",
      `${toConfirmedRes.status}`,
      toConfirmedRes.status === 200
    );

    // -------------------------------------------------------------------------
    // 3. PATIENT CHECK-IN & IDEMPOTENCY
    // -------------------------------------------------------------------------
    console.log("\n--- 3. PATIENT CHECK-IN & IDEMPOTENCY ---");
    // First Check-in by Reception
    const checkIn1Res = await apiCall(
      `/appointments/${aptId}/check-in`,
      "POST",
      { clinicName: "Metro Health Center Front Desk" },
      receptionToken
    );
    const queueEntry1 = checkIn1Res.data?.queueItem;
    record(
      "First Check-In (Validates, Enters Queue, Sets Token)",
      "200 OK with queueNumber",
      `${checkIn1Res.status}, Queue #${queueEntry1?.queueNumber}`,
      checkIn1Res.status === 200 && !!queueEntry1?.queueNumber
    );

    // Duplicate Check-in (MUST BE IDEMPOTENT)
    const checkIn2Res = await apiCall(
      `/appointments/${aptId}/check-in`,
      "POST",
      { clinicName: "Metro Health Center Front Desk" },
      receptionToken
    );
    const queueEntry2 = checkIn2Res.data?.queueItem;
    record(
      "Idempotent Duplicate Check-In (Prevents Duplicate Queue Token)",
      "200 OK returning existing queue item without duplicate",
      `${checkIn2Res.status}, Queue #${queueEntry2?.queueNumber}`,
      checkIn2Res.status === 200 && queueEntry1?.queueNumber === queueEntry2?.queueNumber
    );

    // -------------------------------------------------------------------------
    // 4. LIVE CLINIC QUEUE MANAGEMENT
    // -------------------------------------------------------------------------
    console.log("\n--- 4. LIVE CLINIC QUEUE LIFECYCLE ---");
    const queueRes = await apiCall("/queue", "GET", null, doctorToken);
    const inQueue = (queueRes.data?.queue || []).find((q) => String(q.appointmentId) === String(aptId));
    record(
      "Checked-In Patient Appears in Live Clinic Queue",
      "Patient present with status waiting",
      `Found: ${!!inQueue}, status: ${inQueue?.status}`,
      !!inQueue && inQueue.status === "waiting"
    );

    // Call Patient
    const callRes = await apiCall(`/queue/${inQueue._id}/call`, "PUT", {}, doctorToken);
    record(
      "Doctor Calls Patient from Waiting Lounge",
      "200 OK with status called",
      `${callRes.status}: ${callRes.data?.queueItem?.status}`,
      callRes.status === 200 && callRes.data?.queueItem?.status === "called"
    );

    // Start Consultation Encounter
    const startRes = await apiCall(`/queue/${inQueue._id}/start`, "PUT", {}, doctorToken);
    record(
      "Doctor Starts Consultation Encounter",
      "200 OK with status in_consultation",
      `${startRes.status}: ${startRes.data?.queueItem?.status}`,
      startRes.status === 200 && startRes.data?.queueItem?.status === "in_consultation"
    );

    // -------------------------------------------------------------------------
    // 5. DOCTOR CONSULTATION & LONGITUDINAL MEDICAL RECORD
    // -------------------------------------------------------------------------
    console.log("\n--- 5. DOCTOR CONSULTATION & LONGITUDINAL RECORD ---");
    // Init consultation
    const initConsultRes = await apiCall(
      "/consultations",
      "POST",
      {
        appointmentId: aptId,
        patientEmail: "aditya@trimedi.health",
        patientName: "Aditya Nikam",
        chiefComplaint: "Follow-up on blood pressure and mild exertion fatigue",
        vitals: { bloodPressure: "124/82", heartRate: "72", oxygenSaturation: "99%" },
      },
      doctorToken
    );
    const consultId = initConsultRes.data?.consultation?._id;
    record(
      "Doctor Initializes Consultation Encounter with Vitals",
      "201/200 with encounter ID",
      `${initConsultRes.status}, ID: ${consultId}`,
      (initConsultRes.status === 200 || initConsultRes.status === 201) && !!consultId
    );

    // Save Clinical Progress Notes & Diagnosis
    const notesRes = await apiCall(
      `/consultations/${consultId}`,
      "PUT",
      {
        clinicalNotes: "Cardiovascular exam unremarkable. S1 and S2 present, no murmurs. Patient tolerating statin well.",
        diagnosis: "Essential Hypertension (Controlled)",
        treatmentPlan: "Continue current therapy. Hydration and 30-minute daily walking.",
      },
      doctorToken
    );
    record(
      "Doctor Records Examination Notes and Diagnosis",
      "200 OK with updated clinical encounter",
      `${notesRes.status}`,
      notesRes.status === 200 && notesRes.data?.consultation?.diagnosis === "Essential Hypertension (Controlled)"
    );

    // Complete Consultation & Issue MD-Approved Digital Prescription
    const completeConsultRes = await apiCall(
      `/consultations/${consultId}/complete`,
      "POST",
      {
        diagnosis: "Essential Hypertension (Controlled)",
        clinicalNotes: "Encounter completed. Vitals stable. Follow-up scheduled.",
        followUpDate: "2026-11-16",
        prescriptionData: {
          medicines: [
            {
              medicineName: "Atorvastatin",
              dosage: "20mg",
              frequency: "Once daily (Night)",
              duration: "30 days",
              instructions: "Take after dinner with water",
            },
            {
              medicineName: "Amlodipine",
              dosage: "5mg",
              frequency: "Once daily (Morning)",
              duration: "30 days",
              instructions: "Take with breakfast",
            },
          ],
        },
      },
      doctorToken
    );
    record(
      "Doctor Concludes Encounter & Issues Approved Digital Prescription",
      "200 OK with status completed and approved prescription",
      `${completeConsultRes.status}: Rx ${completeConsultRes.data?.prescription?._id || "created"}`,
      completeConsultRes.status === 200 && completeConsultRes.data?.consultation?.status === "completed"
    );

    // -------------------------------------------------------------------------
    // 6. PRESCRIPTION LIFECYCLE & ROLE AUTHORIZATION
    // -------------------------------------------------------------------------
    console.log("\n--- 6. PRESCRIPTION LIFECYCLE & MD OVERSIGHT ---");
    // Verify AI-extracted prescription created as draft requires doctor approval
    const aiDraftRes = await apiCall(
      "/prescriptions",
      "POST",
      {
        patientName: "Aditya Nikam",
        patientEmail: "aditya@trimedi.health",
        doctorName: "Dr. Sarah Jenkins",
        medicines: [{ medicineName: "Lisinopril", dosage: "10mg", frequency: "Daily", duration: "14 days" }],
        diagnosis: "Mild Bronchial Irritation",
        aiExtracted: true,
      },
      doctorToken
    );
    const draftRxId = aiDraftRes.data?.prescription?._id || aiDraftRes.data?.prescription?.id;
    record(
      "AI-Assisted Prescription Starts in DRAFT (Never Auto-Prescribes)",
      "Created with status 'draft' requiring human MD sign-off",
      `Status: ${aiDraftRes.data?.prescription?.status}`,
      aiDraftRes.data?.prescription?.status === "draft"
    );

    // Doctor reviews and signs off
    const approveRes = await apiCall(
      `/prescriptions/${draftRxId}/approve`,
      "POST",
      { approvalNotes: "Clinically reviewed and verified contraindications. Approved by Dr. Sarah Jenkins." },
      doctorToken
    );
    record(
      "Doctor Formally Approves & Signs Digital Prescription",
      "200 OK with status 'active' / 'approved' and doctor signature audit",
      `${approveRes.status}: ${approveRes.data?.prescription?.status}`,
      approveRes.status === 200 && ["approved", "active"].includes(approveRes.data?.prescription?.status)
    );

    // Patient Attempts to Modify Prescription (MUST BE REJECTED)
    const patientModRxRes = await apiCall(
      `/prescriptions/${draftRxId}/status`,
      "PUT",
      { status: "completed" },
      patientAToken
    );
    record(
      "Security: Patient Cannot Modify Prescription Status",
      "403 Forbidden",
      `${patientModRxRes.status}: ${patientModRxRes.data?.message}`,
      patientModRxRes.status === 403
    );

    // -------------------------------------------------------------------------
    // 7. ROLE-BASED CLINICAL ACCESS CONTROL & LEAST PRIVILEGE
    // -------------------------------------------------------------------------
    console.log("\n--- 7. CLINICAL ACCESS CONTROL & LEAST PRIVILEGE ---");
    // Reception attempts to read private clinical record (MUST BE REJECTED)
    const receptionClinicalRes = await apiCall(
      "/consultations/patient-record?patientEmail=aditya@trimedi.health",
      "GET",
      null,
      receptionToken
    );
    record(
      "Least Privilege: Reception Blocked from Private Clinical Records",
      "403 Forbidden (Least privilege strictly enforced)",
      `${receptionClinicalRes.status}: ${receptionClinicalRes.data?.message}`,
      receptionClinicalRes.status === 403
    );

    // Pharmacy attempts to read private clinical encounter notes (MUST BE REJECTED)
    const pharmacyClinicalRes = await apiCall(
      "/consultations/patient-record?patientEmail=aditya@trimedi.health",
      "GET",
      null,
      pharmacyToken
    );
    record(
      "Least Privilege: Pharmacy Blocked from Private Medical Records",
      "403 Forbidden",
      `${pharmacyClinicalRes.status}: ${pharmacyClinicalRes.data?.message}`,
      pharmacyClinicalRes.status === 403
    );

    // -------------------------------------------------------------------------
    // 8. IDOR PROTECTION ACROSS PATIENT ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n--- 8. IDOR DEFENSE & OBJECT-LEVEL ACCESS CONTROL ---");
    // Patient B attempts to read Patient A's appointment (MUST BE REJECTED)
    const idorAptRes = await apiCall(`/appointments/${aptId}`, "GET", null, patientBToken);
    record(
      "IDOR Defense: Patient B Blocked from Reading Patient A's Appointment",
      "403 Forbidden",
      `${idorAptRes.status}: ${idorAptRes.data?.message}`,
      idorAptRes.status === 403
    );

    // Patient B attempts to read Patient A's longitudinal medical record (MUST BE REJECTED)
    const idorRecordRes = await apiCall(
      "/consultations/patient-record?patientEmail=aditya@trimedi.health",
      "GET",
      null,
      patientBToken
    );
    record(
      "IDOR Defense: Patient B Blocked from Querying Patient A's Medical Record",
      "403 Forbidden",
      `${idorRecordRes.status}: ${idorRecordRes.data?.message}`,
      idorRecordRes.status === 403
    );

    // -------------------------------------------------------------------------
    // 9. DOCTOR CREDENTIAL VERIFICATION & ADMIN CONTROL
    // -------------------------------------------------------------------------
    console.log("\n--- 9. DOCTOR CREDENTIAL VERIFICATION & AUDIT ---");
    // Non-admin (Patient) attempts to verify doctor credentials (MUST BE REJECTED)
    const forgedVerifyRes = await apiCall(
      "/auth/doctor/demo_doctor_1/verify",
      "PUT",
      { status: "verified" },
      patientAToken
    );
    record(
      "Security: Non-Admin Blocked from Altering Doctor Verification Status",
      "403 Forbidden",
      `${forgedVerifyRes.status}: ${forgedVerifyRes.data?.message}`,
      forgedVerifyRes.status === 403
    );

    // Authorized Admin Verifies Doctor
    const adminVerifyRes = await apiCall(
      "/auth/doctor/demo_doctor_1/verify",
      "PUT",
      {
        status: "verified",
        notes: "Board of Medicine Registry credentials verified on state medical portal.",
      },
      adminToken
    );
    record(
      "Authorized Admin Sets Doctor Credential to VERIFIED",
      "200 OK with verificationStatus verified",
      `${adminVerifyRes.status}: ${adminVerifyRes.data?.doctor?.verificationStatus || "verified"}`,
      adminVerifyRes.status === 200 && adminVerifyRes.data?.doctor?.verificationStatus === "verified"
    );

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log("\n==================================================================");
    console.log("📋 SUMMARY OF PHASE 2 CLINICAL WORKFLOW TEST RESULTS:");
    console.log("==================================================================");
    let allPassed = true;
    results.forEach((r, idx) => {
      console.log(`  ${idx + 1}. [${r.pass ? "✅ PASS" : "❌ FAIL"}] ${r.name}`);
      if (!r.pass) allPassed = false;
    });
    console.log("==================================================================");
    console.log(
      allPassed
        ? "🎉 ALL PHASE 2 HEALTHCARE WORKFLOW TESTS PASSED PERFECTLY!"
        : "⚠️ SOME TESTS FAILED. CHECK LOGS ABOVE."
    );
    console.log("==================================================================");

    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error("Test execution encountered an unexpected error:", err);
    process.exit(1);
  }
}

runTests();
