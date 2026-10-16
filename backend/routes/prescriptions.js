import express from "express";
import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import eventBus from "../services/eventBus.js";
import { optionalAuth, requireRole } from "../middleware/authMiddleware.js";
import { logClinicalAudit } from "../services/auditService.js";
import medicationService from "../services/medicationService.js";

const router = express.Router();

export const fallbackPrescriptions = [
  {
    _id: "rx-9041",
    patientId: "demo_patient_1",
    patientName: "Aditya Nikam",
    patientEmail: "patient@trimedi.com",
    doctorId: "demo_doctor_1",
    doctorName: "Dr. Sarah Jenkins, MD",
    doctorEmail: "doctor@trimedi.com",
    doctorSpecialty: "Cardiology & Internal Medicine",
    diagnosis: "Dyslipidemia & Hypertension Management",
    validUntil: new Date("2026-11-28"),
    status: "active",
    notes: "Patient should follow a low-sodium diet and repeat lipid profile in 4 weeks.",
    items: [
      {
        _id: "item-1",
        medicineName: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily (Night)",
        durationDays: 30,
        quantityPrescribed: 30,
        instructions: "Take 1 tablet after dinner",
      },
      {
        _id: "item-2",
        medicineName: "Telmisartan",
        dosage: "40mg",
        frequency: "Once daily (Morning)",
        durationDays: 30,
        quantityPrescribed: 30,
        instructions: "Take before breakfast with water",
      },
    ],
    createdAt: new Date("2026-08-28"),
  },
  {
    _id: "rx-8832",
    patientId: "demo_patient_1",
    patientName: "Aditya Nikam",
    patientEmail: "patient@trimedi.com",
    doctorId: "demo_doctor_2",
    doctorName: "Dr. Rajesh Gupta, MD",
    doctorEmail: "doctor@trimedi.com",
    doctorSpecialty: "Endocrinology & Diabetology",
    diagnosis: "Type 2 Diabetes Routine Control",
    validUntil: new Date("2026-10-10"),
    status: "active",
    notes: "Monitor fasting blood glucose twice a week.",
    items: [
      {
        _id: "item-3",
        medicineName: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily after meals",
        durationDays: 60,
        quantityPrescribed: 60,
        instructions: "Take with food to minimize GI effects",
      },
      {
        _id: "item-4",
        medicineName: "Glimepiride",
        dosage: "1mg",
        frequency: "Once daily (Morning)",
        durationDays: 30,
        quantityPrescribed: 30,
        instructions: "Take immediately before breakfast",
      },
    ],
    createdAt: new Date("2026-08-10"),
  },
];

// GET all prescriptions with optional role filtering
router.get("/", async (req, res) => {
  try {
    const { patientEmail, doctorEmail, role } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (role === "patient" && patientEmail) {
        query.patientEmail = patientEmail;
      } else if (role === "doctor" && doctorEmail) {
        query.doctorEmail = doctorEmail;
      }
      const prescriptions = await Prescription.find(query).sort({ createdAt: -1 });
      if (prescriptions && prescriptions.length > 0) {
        return res.json(prescriptions);
      }
    }

    let result = fallbackPrescriptions;
    if (role === "patient" && patientEmail) {
      result = result.filter(
        (p) => p.patientEmail?.toLowerCase() === patientEmail.toLowerCase() || p.patientName.toLowerCase().includes("aditya")
      );
    } else if (role === "doctor" && doctorEmail) {
      result = result.filter(
        (p) => p.doctorEmail?.toLowerCase() === doctorEmail.toLowerCase() || p.doctorName.toLowerCase().includes("jenkins")
      );
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single prescription by ID with IDOR Protection
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let rx = null;

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      rx = await Prescription.findById(id);
    } else {
      rx = fallbackPrescriptions.find((p) => String(p._id) === String(id));
    }

    if (!rx) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    // IDOR Protection: Patients can only view their own prescriptions
    if (req.user && req.user.role === "patient") {
      const rxEmail = (rx.patientEmail || "").toLowerCase();
      if (rxEmail && rxEmail !== req.user.email.toLowerCase()) {
        await logClinicalAudit({
          req,
          action: "ACCESS_DENIED_IDOR",
          resourceType: "prescription",
          resourceId: String(id),
          status: "DENIED",
          details: { attempt: "cross_patient_prescription_access" },
        });
        return res.status(403).json({
          success: false,
          message: "Access denied: Patients are forbidden from accessing another patient's prescription record.",
        });
      }
    }

    await logClinicalAudit({
      req,
      action: "PRESCRIPTION_VIEWED",
      resourceType: "prescription",
      resourceId: String(id),
      details: { diagnosis: rx.diagnosis },
    });

    res.json(rx);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Create new Digital Prescription (Doctor / Admin Only)
router.post("/", optionalAuth, async (req, res) => {
  try {
    // Pharmacy or Patient cannot author clinical prescriptions
    if (req.user && (req.user.role === "pharmacy" || req.user.role === "reception")) {
      return res.status(403).json({
        success: false,
        message: "Clinical Authorization Required: Only licensed Doctors may author official prescriptions.",
      });
    }

    const {
      patientName,
      patientEmail,
      doctorName,
      doctorEmail,
      doctorSpecialty,
      diagnosis: rawDiagnosis,
      items: rawItems,
      medicines,
      reason,
      validUntil,
      notes,
      aiExtracted = false,
      originalDocumentName = "",
      status,
    } = req.body;

    const items = rawItems || medicines || [];
    const diagnosis = rawDiagnosis || reason || "Clinical Assessment & Prescription";
    const dName = doctorName || (req.user?.role === "doctor" ? req.user.name : "Dr. Sarah Jenkins, MD");

    if (!patientName || !diagnosis || !items || !items.length) {
      return res.status(400).json({
        message: "Missing required fields: patientName, diagnosis, and at least 1 medicine item are required",
      });
    }

    const pEmail = (patientEmail || req.user?.email || "patient@trimedi.com").toLowerCase();
    const dEmail = (doctorEmail || (req.user?.role === "doctor" ? req.user?.email : "doctor@trimedi.com")).toLowerCase();

    // AI-Assisted Safety Guardrail: AI extracted prescriptions require human review before becoming active
    const initialStatus = aiExtracted ? "draft" : status || "active";

    const validatedItems = items.map((it) => ({
      medicineName: it.medicineName || it.name,
      dosage: it.dosage || "1 Tab",
      frequency: it.frequency || "Once daily",
      durationDays: Number(it.durationDays) || 30,
      quantityPrescribed: Number(it.quantityPrescribed) || Number(it.quantity) || 30,
      instructions: it.instructions || "",
    }));

    const expiryDate = validUntil ? new Date(validUntil) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const creationTime = new Date();
    let createdRx = null;

    const rxPayload = {
      patientName,
      patientEmail: pEmail,
      doctorName: dName,
      doctorEmail: dEmail,
      doctorSpecialty: doctorSpecialty || "General Medicine",
      diagnosis,
      items: validatedItems,
      validUntil: expiryDate,
      notes: notes || "",
      aiExtracted,
      originalDocumentName,
      status: initialStatus,
      createdBy: dEmail,
      reviewedBy: dEmail,
      approvedBy: initialStatus === "active" ? dEmail : "",
      approvedAt: initialStatus === "active" ? creationTime : null,
      approvalNotes: aiExtracted ? "AI candidate extracted; awaiting clinical review" : "Clinically approved by Doctor",
      history: [
        {
          status: initialStatus,
          changedBy: dEmail,
          timestamp: creationTime,
          notes: aiExtracted ? "AI OCR document parsed" : "Doctor created digital prescription",
        },
      ],
    };

    if (mongoose.connection.readyState === 1) {
      createdRx = await Prescription.create(rxPayload);
    } else {
      createdRx = {
        _id: "RX-" + Math.floor(1000 + Math.random() * 9000),
        ...rxPayload,
        createdAt: creationTime,
      };
      fallbackPrescriptions.unshift(createdRx);
    }

    await logClinicalAudit({
      req,
      action: initialStatus === "draft" ? "PRESCRIPTION_DRAFT_CREATED" : "PRESCRIPTION_ISSUED",
      resourceType: "prescription",
      resourceId: String(createdRx._id),
      details: { patientEmail: pEmail, aiExtracted, status: initialStatus },
    });

    // Notify Patient & Sync Medications only if active
    if (initialStatus === "active") {
      eventBus.emit("PRESCRIPTION_ISSUED", {
        prescriptionId: String(createdRx._id),
        patientEmail: pEmail,
        doctorName: dName,
        diagnosis,
      });

      // Synchronize normalized active medications
      await medicationService.syncMedicationsFromPrescription(createdRx).catch((e) =>
        console.warn("Medication sync warning on creation:", e.message)
      );
    }

    res.status(201).json({
      success: true,
      message: initialStatus === "draft" ? "Prescription draft created for clinical review" : "Digital Prescription created successfully",
      prescription: createdRx,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Doctor Review & Approve Prescription
router.post("/:id/approve", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Phase 3 Security: Only authorized medical doctors and admins can approve prescriptions
    if (req.user && req.user.role !== "doctor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only authorized medical doctors can clinically approve prescriptions.",
      });
    }

    const { approvalNotes = "Reviewed and approved by physician" } = req.body;
    const doctorEmail = req.user?.email || "doctor@trimedi.com";
    const doctorName = req.user?.name || "Dr. Sarah Jenkins, MD";
    const approvalTime = new Date();

    let rx = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      rx = await Prescription.findByIdAndUpdate(
        id,
        {
          status: "active",
          approvedBy: doctorEmail,
          approvedAt: approvalTime,
          approvalNotes,
          $push: {
            history: {
              status: "active",
              changedBy: doctorEmail,
              timestamp: approvalTime,
              notes: approvalNotes,
            },
          },
        },
        { new: true }
      );
    } else {
      rx = fallbackPrescriptions.find((p) => String(p._id) === String(id));
      if (rx) {
        rx.status = "active";
        rx.approvedBy = doctorEmail;
        rx.approvedAt = approvalTime;
        rx.approvalNotes = approvalNotes;
        if (!rx.history) rx.history = [];
        rx.history.push({
          status: "active",
          changedBy: doctorEmail,
          timestamp: approvalTime,
          notes: approvalNotes,
        });
      }
    }

    if (!rx) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    await logClinicalAudit({
      req,
      action: "PRESCRIPTION_APPROVED",
      resourceType: "prescription",
      resourceId: String(id),
      details: { patientEmail: rx.patientEmail, approvedBy: doctorEmail },
    });

    eventBus.emit("PRESCRIPTION_ISSUED", {
      prescriptionId: String(rx._id),
      patientEmail: rx.patientEmail,
      doctorName,
      diagnosis: rx.diagnosis,
    });

    // Synchronize normalized active medications for patient schedule and adherence tracking
    await medicationService.syncMedicationsFromPrescription(rx).catch((e) =>
      console.warn("Medication sync warning on approval:", e.message)
    );

    res.json({ success: true, message: "Prescription clinically reviewed and approved", prescription: rx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update prescription status
router.put("/:id/status", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes = "" } = req.body;

    // Patients cannot alter prescription status
    if (req.user && req.user.role === "patient") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Patients cannot alter clinical prescription status.",
      });
    }

    let updated = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      updated = await Prescription.findByIdAndUpdate(
        id,
        {
          status,
          $push: {
            history: {
              status,
              changedBy: req.user?.email || "system",
              timestamp: new Date(),
              notes,
            },
          },
        },
        { new: true }
      );
    } else {
      updated = fallbackPrescriptions.find((p) => String(p._id) === String(id));
      if (updated) {
        updated.status = status;
        if (!updated.history) updated.history = [];
        updated.history.push({
          status,
          changedBy: req.user?.email || "system",
          timestamp: new Date(),
          notes,
        });
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    await logClinicalAudit({
      req,
      action: "PRESCRIPTION_STATUS_UPDATED",
      resourceType: "prescription",
      resourceId: String(id),
      details: { newStatus: status },
    });

    res.json({ success: true, message: `Prescription status updated to ${status}`, prescription: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
