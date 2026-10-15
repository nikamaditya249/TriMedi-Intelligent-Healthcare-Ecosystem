import express from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import ClinicQueue from "../models/ClinicQueue.js";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import { checkInPatient, getLiveQueue } from "../services/queueService.js";
import { logClinicalAudit } from "../services/auditService.js";

const router = express.Router();

// Fallback appointments helper
const getOperationalAppointments = async () => {
  const today = new Date().toISOString().split("T")[0];
  let appointments = [];

  if (mongoose.connection.readyState === 1) {
    appointments = await Appointment.find({}).sort({ appointmentDate: 1, timeSlot: 1 }).lean();
  } else {
    const { fallbackAppointments } = await import("./appointments.js").catch(() => ({ fallbackAppointments: [] }));
    appointments = fallbackAppointments || [];
  }

  // Sanitize for reception: Strip sensitive diagnosis & clinical notes (Least Privilege)
  return appointments.map((apt) => ({
    _id: apt._id,
    patientName: apt.patientName,
    patientEmail: apt.patientEmail,
    patientPhone: apt.patientPhone || "+91 98765 43210",
    doctorName: apt.doctorName,
    doctorEmail: apt.doctorEmail,
    doctorSpecialty: apt.doctorSpecialty,
    hospital: apt.hospital,
    appointmentDate: apt.appointmentDate,
    timeSlot: apt.timeSlot,
    type: apt.type,
    status: apt.status,
    queueNumber: apt.queueNumber || null,
    checkInAt: apt.checkInAt || null,
    estimatedWaitMinutes: apt.estimatedWaitMinutes || 0,
    // Note: diagnosis and clinicalNotes are intentionally omitted
  }));
};

/**
 * GET /api/reception/today-appointments
 * Reception operational overview of appointments
 */
router.get("/today-appointments", optionalAuth, async (req, res) => {
  try {
    const appointments = await getOperationalAppointments();
    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/reception/register-patient
 * Reception quick registration for walk-in or new clinic patients
 */
router.post("/register-patient", optionalAuth, async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, emergencyContact, dob, gender } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Patient name and email are required" });
    }

    let existingUser = null;
    if (mongoose.connection.readyState === 1) {
      existingUser = await User.findOne({ email });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Patient already registered with this email" });
    }

    const patientData = {
      name,
      email: email.toLowerCase(),
      password: "$2a$10$demoDefaultRegisteredPassword1234567890",
      role: "patient",
      phone: phone || "",
      bloodGroup: bloodGroup || "",
      emergencyContact: emergencyContact || "",
      dob: dob || "",
      gender: gender || "",
    };

    let created = null;
    if (mongoose.connection.readyState === 1) {
      created = await User.create(patientData);
    } else {
      const { fallbackUsers } = await import("./auth.js").catch(() => ({ fallbackUsers: [] }));
      created = { _id: "user_" + Date.now(), ...patientData };
      (fallbackUsers || []).push(created);
    }

    await logClinicalAudit({
      req,
      action: "PATIENT_ONBOARDED_BY_RECEPTION",
      resourceType: "patient",
      resourceId: String(created._id),
      details: { patientName: name, patientEmail: email },
    });

    res.status(201).json({
      success: true,
      message: "Patient registered successfully at clinic reception",
      patient: {
        _id: created._id,
        name: created.name,
        email: created.email,
        phone: created.phone,
        bloodGroup: created.bloodGroup,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/reception/check-in
 * Check in patient and assign queue position
 */
router.post("/check-in", optionalAuth, async (req, res) => {
  try {
    const { appointmentId, priority = "normal", notes = "" } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    const result = await checkInPatient({
      appointmentId,
      checkedInBy: req.user?.name || "Reception Desk",
      actorRole: "reception",
      actorEmail: req.user?.email || "reception@trimedi.health",
      priority,
      notes,
      req,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/reception/appointments/:id/status
 * Reception updates operational status (e.g., mark no-show, confirm, cancel)
 */
router.put("/appointments/:id/status", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason = "" } = req.body;

    if (!["scheduled", "confirmed", "checked_in", "cancelled", "no_show"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Reception cannot update appointment to this status",
      });
    }

    let apt = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      apt = await Appointment.findByIdAndUpdate(
        id,
        {
          status,
          $push: {
            statusHistory: {
              fromStatus: "current",
              toStatus: status,
              changedBy: req.user?.email || "reception@trimedi.health",
              role: "reception",
              timestamp: new Date(),
              reason: reason || `Reception marked as ${status}`,
            },
          },
        },
        { new: true }
      );
    } else {
      const { fallbackAppointments } = await import("./appointments.js").catch(() => ({ fallbackAppointments: [] }));
      apt = (fallbackAppointments || []).find((a) => String(a._id) === String(id));
      if (apt) {
        apt.status = status;
        if (!apt.statusHistory) apt.statusHistory = [];
        apt.statusHistory.push({
          fromStatus: "previous",
          toStatus: status,
          changedBy: req.user?.email || "reception@trimedi.health",
          role: "reception",
          timestamp: new Date(),
          reason: reason || `Reception marked as ${status}`,
        });
      }
    }

    if (!apt) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    await logClinicalAudit({
      req,
      action: "RECEPTION_STATUS_UPDATE",
      resourceType: "appointment",
      resourceId: String(id),
      details: { newStatus: status, reason },
    });

    res.json({ success: true, message: `Appointment status updated to ${status}`, appointment: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
