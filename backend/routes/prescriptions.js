import express from "express";
import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import eventBus from "../services/eventBus.js";

const router = express.Router();

const fallbackPrescriptions = [
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

// GET single prescription by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const rx = await Prescription.findById(id);
      if (rx) return res.json(rx);
    }

    const rx = fallbackPrescriptions.find((p) => String(p._id) === String(id));
    if (rx) return res.json(rx);

    res.status(404).json({ message: "Prescription not found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create new Digital Prescription (Doctor)
router.post("/", async (req, res) => {
  try {
    const {
      patientName,
      patientEmail,
      doctorName,
      doctorEmail,
      doctorSpecialty,
      diagnosis,
      items,
      validUntil,
      notes,
      aiExtracted = false,
      originalDocumentName = "",
    } = req.body;

    if (!patientName || !doctorName || !diagnosis || !items || !items.length) {
      return res.status(400).json({
        message: "Missing required fields: patientName, doctorName, diagnosis, and at least 1 medicine item are required",
      });
    }

    const pEmail = patientEmail || "patient@trimedi.com";
    const dEmail = doctorEmail || "doctor@trimedi.com";

    // Validate structured prescription items
    const validatedItems = items.map((it) => ({
      medicineName: it.medicineName || it.name,
      dosage: it.dosage || "1 Tab",
      frequency: it.frequency || "Once daily",
      durationDays: Number(it.durationDays) || 30,
      quantityPrescribed: Number(it.quantityPrescribed) || Number(it.quantity) || 30,
      instructions: it.instructions || "",
    }));

    const expiryDate = validUntil ? new Date(validUntil) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    let createdRx = null;

    if (mongoose.connection.readyState === 1) {
      createdRx = await Prescription.create({
        patientName,
        patientEmail: pEmail,
        doctorName,
        doctorEmail: dEmail,
        doctorSpecialty: doctorSpecialty || "General Medicine",
        diagnosis,
        items: validatedItems,
        validUntil: expiryDate,
        notes: notes || "",
        aiExtracted,
        originalDocumentName,
        status: "active",
      });
    } else {
      createdRx = {
        _id: "RX-" + Math.floor(1000 + Math.random() * 9000),
        patientName,
        patientEmail: pEmail,
        doctorName,
        doctorEmail: dEmail,
        doctorSpecialty: doctorSpecialty || "General Medicine",
        diagnosis,
        items: validatedItems,
        validUntil: expiryDate,
        notes: notes || "",
        aiExtracted,
        originalDocumentName,
        status: "active",
        createdAt: new Date(),
      };
      fallbackPrescriptions.unshift(createdRx);
    }

    // Trigger EventBus notification to Patient
    eventBus.emit("PRESCRIPTION_ISSUED", {
      prescriptionId: createdRx._id?.toString(),
      patientEmail: pEmail,
      doctorName,
      diagnosis,
    });

    res.status(201).json({ message: "Digital Prescription created successfully", prescription: createdRx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update prescription status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (mongoose.connection.readyState === 1) {
      const updated = await Prescription.findByIdAndUpdate(id, { status }, { new: true });
      if (updated) return res.json({ message: "Status updated", prescription: updated });
    }

    const rx = fallbackPrescriptions.find((p) => String(p._id) === String(id));
    if (rx) {
      rx.status = status;
      return res.json({ message: "Status updated", prescription: rx });
    }

    res.status(404).json({ message: "Prescription not found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
