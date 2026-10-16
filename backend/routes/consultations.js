import express from "express";
import mongoose from "mongoose";
import Consultation from "../models/Consultation.js";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { optionalAuth, requireRole, requireClinicalAccess } from "../middleware/authMiddleware.js";
import { logClinicalAudit } from "../services/auditService.js";
import { completeEncounter } from "../services/queueService.js";
import eventBus from "../services/eventBus.js";
import medicationService from "../services/medicationService.js";

const router = express.Router();

// Fallback in-memory consultations for offline resilience
export const fallbackConsultations = [
  {
    _id: "c-101",
    appointmentId: "apt-101",
    patientId: "demo_patient_1",
    patientEmail: "patient@trimedi.com",
    patientName: "Aditya Nikam",
    doctorId: "demo_doctor_1",
    doctorEmail: "doctor@trimedi.com",
    doctorName: "Dr. Sarah Jenkins, MD",
    doctorSpecialty: "Cardiology & Internal Medicine",
    clinicName: "Metro Health Center",
    vitals: {
      bloodPressure: "128/82 mmHg",
      heartRate: "74 bpm",
      temperature: "98.4 °F",
      weightKg: 72,
      spO2: "99%",
    },
    chiefComplaint: "Follow-up for lipid management and morning dizziness",
    clinicalNotes: "Patient has adhered well to lifestyle modifications. Morning lightheadedness appears orthostatic. Recommended hydration and taking Atorvastatin strictly post-dinner.",
    diagnosis: "Dyslipidemia & Mild Orthostatic Lightheadedness",
    treatmentPlan: "Continue Atorvastatin 20mg nocte. Telmisartan 40mg mane. Recheck lipid profile in 4 weeks.",
    followUpDate: "2026-10-15",
    prescriptionId: "rx-9041",
    status: "completed",
    startedAt: new Date("2026-08-28T10:30:00Z"),
    completedAt: new Date("2026-08-28T10:55:00Z"),
    amendments: [],
  },
];

/**
 * POST /api/consultations
 * Initialize or resume a consultation encounter for an appointment
 */
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { appointmentId, patientEmail, patientName, doctorEmail, doctorName, chiefComplaint } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    const docEmail = (doctorEmail || req.user?.email || "doctor@trimedi.health").toLowerCase();
    const docName = doctorName || req.user?.name || "Dr. Sarah Jenkins, MD";
    const pEmail = (patientEmail || "patient@trimedi.com").toLowerCase();
    const pName = patientName || "Aditya Nikam";

    let consultation = null;

    if (mongoose.connection.readyState === 1) {
      consultation = await Consultation.findOne({ appointmentId });
      if (!consultation) {
        consultation = await Consultation.create({
          appointmentId,
          patientEmail: pEmail,
          patientName: pName,
          doctorEmail: docEmail,
          doctorName: docName,
          chiefComplaint: chiefComplaint || "Clinical Review",
          status: "in_progress",
          startedAt: new Date(),
        });
      }
    } else {
      consultation = fallbackConsultations.find((c) => String(c.appointmentId) === String(appointmentId));
      if (!consultation) {
        consultation = {
          _id: "c-" + Date.now(),
          appointmentId,
          patientEmail: pEmail,
          patientName: pName,
          doctorEmail: docEmail,
          doctorName: docName,
          chiefComplaint: chiefComplaint || "Clinical Review",
          vitals: { bloodPressure: "120/80 mmHg", heartRate: "72 bpm", temperature: "98.6 °F", weightKg: 70, spO2: "99%" },
          clinicalNotes: "",
          diagnosis: "Clinical Evaluation Underway",
          treatmentPlan: "",
          followUpDate: "",
          status: "in_progress",
          startedAt: new Date(),
          amendments: [],
        };
        fallbackConsultations.push(consultation);
      }
    }

    await logClinicalAudit({
      req,
      action: "CONSULTATION_ENCOUNTER_ACCESSED",
      resourceType: "consultation",
      resourceId: String(consultation._id),
      details: { appointmentId, doctorEmail: docEmail },
    });

    res.json({ success: true, consultation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/consultations/encounter/:appointmentId
 * Get current consultation details
 */
router.get("/encounter/:appointmentId", optionalAuth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    let consultation = null;

    if (mongoose.connection.readyState === 1) {
      consultation = await Consultation.findOne({ appointmentId }).populate("prescriptionId");
    } else {
      consultation = fallbackConsultations.find((c) => String(c.appointmentId) === String(appointmentId));
    }

    if (!consultation) {
      return res.status(404).json({ success: false, message: "No consultation record found for this appointment" });
    }

    // Role Security: Patient can only view their own consultation
    if (req.user && req.user.role === "patient") {
      if (consultation.patientEmail.toLowerCase() !== req.user.email.toLowerCase()) {
        return res.status(403).json({ success: false, message: "Access denied: Unauthorized to view this clinical encounter" });
      }
    }

    res.json({ success: true, consultation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/consultations/:id
 * Save progress notes, vitals, diagnosis, and treatment plan
 */
router.put("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { vitals, chiefComplaint, clinicalNotes, diagnosis, treatmentPlan, followUpDate } = req.body;

    let updated = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      updated = await Consultation.findByIdAndUpdate(
        id,
        {
          ...(vitals && { vitals }),
          ...(chiefComplaint !== undefined && { chiefComplaint }),
          ...(clinicalNotes !== undefined && { clinicalNotes }),
          ...(diagnosis && { diagnosis }),
          ...(treatmentPlan !== undefined && { treatmentPlan }),
          ...(followUpDate !== undefined && { followUpDate }),
        },
        { new: true }
      );
    } else {
      updated = fallbackConsultations.find((c) => String(c._id) === String(id));
      if (updated) {
        if (vitals) updated.vitals = { ...updated.vitals, ...vitals };
        if (chiefComplaint !== undefined) updated.chiefComplaint = chiefComplaint;
        if (clinicalNotes !== undefined) updated.clinicalNotes = clinicalNotes;
        if (diagnosis) updated.diagnosis = diagnosis;
        if (treatmentPlan !== undefined) updated.treatmentPlan = treatmentPlan;
        if (followUpDate !== undefined) updated.followUpDate = followUpDate;
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: "Consultation not found" });
    }

    await logClinicalAudit({
      req,
      action: "CLINICAL_NOTES_UPDATED",
      resourceType: "consultation",
      resourceId: String(id),
      details: { diagnosis: updated.diagnosis },
    });

    res.json({ success: true, message: "Consultation notes saved", consultation: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/consultations/:id/complete
 * Conclude consultation encounter, optionally approve & issue prescription, and close queue
 */
router.post("/:id/complete", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { prescriptionData, queueId } = req.body;
    const doctorEmail = req.user?.email || "doctor@trimedi.com";
    const doctorName = req.user?.name || "Dr. Sarah Jenkins, MD";
    const completedAt = new Date();

    let consult = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      consult = await Consultation.findById(id);
    } else {
      consult = fallbackConsultations.find((c) => String(c._id) === String(id));
    }

    if (!consult) {
      return res.status(404).json({ success: false, message: "Consultation record not found" });
    }

    // 1. Issue Prescription if provided
    let issuedPrescription = null;
    if (prescriptionData && prescriptionData.items && prescriptionData.items.length > 0) {
      const rxPayload = {
        patientName: consult.patientName,
        patientEmail: consult.patientEmail,
        doctorName: doctorName,
        doctorEmail: doctorEmail,
        doctorSpecialty: consult.doctorSpecialty || "Internal Medicine",
        diagnosis: consult.diagnosis || "Consultation Diagnosis",
        items: prescriptionData.items,
        validUntil: prescriptionData.validUntil || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: "active",
        notes: prescriptionData.notes || consult.treatmentPlan || "",
        consultationId: consult._id,
        appointmentId: consult.appointmentId,
        createdBy: doctorEmail,
        reviewedBy: doctorEmail,
        approvedBy: doctorEmail,
        approvedAt: completedAt,
        approvalNotes: "Clinically reviewed and MD-approved during consultation",
      };

      if (mongoose.connection.readyState === 1) {
        issuedPrescription = await Prescription.create(rxPayload);
      } else {
        const { fallbackPrescriptions } = await import("./prescriptions.js").catch(() => ({ fallbackPrescriptions: [] }));
        issuedPrescription = {
          _id: "rx-" + Date.now(),
          ...rxPayload,
          createdAt: completedAt,
        };
        (fallbackPrescriptions || []).unshift(issuedPrescription);
      }

      // Notify Patient via EventBus
      eventBus.emit("PRESCRIPTION_ISSUED", {
        prescriptionId: String(issuedPrescription._id),
        patientEmail: consult.patientEmail,
        doctorName: doctorName,
        diagnosis: consult.diagnosis,
      });

      await logClinicalAudit({
        req,
        action: "PRESCRIPTION_APPROVED_AND_ISSUED",
        resourceType: "prescription",
        resourceId: String(issuedPrescription._id),
        details: { patientEmail: consult.patientEmail, itemsCount: prescriptionData.items.length },
      });

      // Synchronize normalized active medications
      await medicationService.syncMedicationsFromPrescription(issuedPrescription).catch((e) =>
        console.warn("Medication sync warning on consult completion:", e.message)
      );
    }

    // 2. Mark Consultation Completed
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      consult = await Consultation.findByIdAndUpdate(
        id,
        {
          status: "completed",
          completedAt,
          ...(issuedPrescription && { prescriptionId: issuedPrescription._id }),
        },
        { new: true }
      );
    } else {
      consult.status = "completed";
      consult.completedAt = completedAt;
      if (issuedPrescription) consult.prescriptionId = issuedPrescription._id;
    }

    // 3. Complete queue encounter
    await completeEncounter({
      queueId,
      appointmentId: consult.appointmentId,
      doctorEmail,
      req,
    });

    await logClinicalAudit({
      req,
      action: "CONSULTATION_COMPLETED",
      resourceType: "consultation",
      resourceId: String(id),
      details: { patientEmail: consult.patientEmail, hasPrescription: !!issuedPrescription },
    });

    res.json({
      success: true,
      message: "Consultation successfully completed and clinical records finalized",
      consultation: consult,
      prescription: issuedPrescription,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/consultations/patient-record
 * Longitudinal Medical Record Timeline (Appointments, Consultations, Prescriptions, History)
 * Strictly Protected by requireClinicalAccess
 */
router.get("/patient-record", optionalAuth, requireClinicalAccess(), async (req, res) => {
  try {
    const patientEmail = (req.query.patientEmail || req.user?.email || "patient@trimedi.com").toLowerCase();

    // 1. Fetch Patient Profile
    let patientUser = null;
    if (mongoose.connection.readyState === 1) {
      patientUser = await User.findOne({ email: patientEmail }).select("-password").lean();
    }
    if (!patientUser) {
      const { fallbackUsers } = await import("./auth.js").catch(() => ({ fallbackUsers: [] }));
      patientUser = (fallbackUsers || []).find((u) => u.email.toLowerCase() === patientEmail) || {
        name: "Aditya Nikam",
        email: patientEmail,
        bloodGroup: "O+",
        allergies: ["Penicillin"],
        existingConditions: ["Dyslipidemia", "Mild Hypertension"],
        currentMedications: ["Atorvastatin 20mg", "Telmisartan 40mg"],
        dob: "1994-06-15",
        gender: "Male",
        phone: "+91 98765 43210",
      };
    }

    // 2. Fetch Appointments
    let appointments = [];
    if (mongoose.connection.readyState === 1) {
      appointments = await Appointment.find({ patientEmail }).sort({ appointmentDate: -1 }).lean();
    } else {
      const { fallbackAppointments } = await import("./appointments.js").catch(() => ({ fallbackAppointments: [] }));
      appointments = (fallbackAppointments || []).filter(
        (a) => a.patientEmail?.toLowerCase() === patientEmail || a.patientName?.toLowerCase().includes("aditya")
      );
    }

    // 3. Fetch Consultations
    let consultations = [];
    if (mongoose.connection.readyState === 1) {
      consultations = await Consultation.find({ patientEmail }).sort({ completedAt: -1 }).lean();
    } else {
      consultations = fallbackConsultations.filter((c) => c.patientEmail?.toLowerCase() === patientEmail);
    }

    // 4. Fetch Prescriptions
    let prescriptions = [];
    if (mongoose.connection.readyState === 1) {
      prescriptions = await Prescription.find({ patientEmail }).sort({ createdAt: -1 }).lean();
    } else {
      const { fallbackPrescriptions } = await import("./prescriptions.js").catch(() => ({ fallbackPrescriptions: [] }));
      prescriptions = (fallbackPrescriptions || []).filter(
        (p) => p.patientEmail?.toLowerCase() === patientEmail || p.patientName?.toLowerCase().includes("aditya")
      );
    }

    // 5. Build Unified Longitudinal Care Timeline
    const timeline = [];

    // Add Profile Registration Entry
    timeline.push({
      id: "reg-01",
      type: "REGISTRATION",
      title: "Patient Registered in TriMedi Health Ecosystem",
      date: patientUser.createdAt || new Date("2026-01-10"),
      actor: "Patient Registration",
      details: {
        bloodGroup: patientUser.bloodGroup || "O+",
        allergies: patientUser.allergies || ["Penicillin"],
        existingConditions: patientUser.existingConditions || ["Dyslipidemia"],
      },
    });

    // Add Consultations
    consultations.forEach((c) => {
      timeline.push({
        id: "consult-" + c._id,
        type: "CONSULTATION",
        title: `Clinical Encounter with ${c.doctorName}`,
        date: c.completedAt || c.startedAt,
        actor: c.doctorName,
        details: {
          specialty: c.doctorSpecialty,
          chiefComplaint: c.chiefComplaint,
          diagnosis: c.diagnosis,
          treatmentPlan: c.treatmentPlan,
          vitals: c.vitals,
          followUpDate: c.followUpDate,
        },
      });
    });

    // Add Prescriptions
    prescriptions.forEach((p) => {
      timeline.push({
        id: "rx-" + p._id,
        type: "PRESCRIPTION",
        title: `Digital Prescription Approved: ${p.diagnosis}`,
        date: p.createdAt,
        actor: p.doctorName,
        details: {
          diagnosis: p.diagnosis,
          status: p.status,
          medicines: p.items?.map((i) => `${i.medicineName} (${i.dosage} - ${i.frequency})`) || [],
          approvedBy: p.approvedBy || p.doctorName,
        },
      });
    });

    // Sort timeline descending (most recent first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Phase 3: Pagination / Windowing for high-volume longitudinal records
    const totalEvents = timeline.length;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || (req.query.page ? 20 : 100)));
    const startIndex = (page - 1) * limit;
    const paginatedTimeline = timeline.slice(startIndex, startIndex + limit);

    await logClinicalAudit({
      req,
      action: "PATIENT_MEDICAL_RECORD_VIEWED",
      resourceType: "patient",
      resourceId: patientEmail,
      details: { timelineEventsCount: totalEvents, page, limit },
    });

    res.json({
      success: true,
      patient: {
        name: patientUser.name,
        email: patientUser.email,
        dob: patientUser.dob || "1994-06-15",
        gender: patientUser.gender || "Male",
        phone: patientUser.phone || "",
        bloodGroup: patientUser.bloodGroup || "O+",
        allergies: patientUser.allergies || [],
        existingConditions: patientUser.existingConditions || [],
        currentMedications: patientUser.currentMedications || [],
      },
      timeline: paginatedTimeline,
      pagination: {
        page,
        limit,
        total: totalEvents,
        totalPages: Math.ceil(totalEvents / limit) || 1,
        hasMore: startIndex + limit < totalEvents,
      },
      counts: {
        appointments: appointments.length,
        consultations: consultations.length,
        prescriptions: prescriptions.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
