import express from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import eventBus from "../services/eventBus.js";
import { checkInPatient } from "../services/queueService.js";
import { logClinicalAudit } from "../services/auditService.js";
import { optionalAuth } from "../middleware/authMiddleware.js";
import { requireDatabase } from "../middleware/dbGuard.js";

const router = express.Router();

export const fallbackAppointments = [
  {
    _id: "apt-101",
    patientName: "Aditya Nikam",
    patientEmail: "patient@trimedi.com",
    patientPhone: "+91 98765 43210",
    doctorName: "Dr. Sarah Jenkins, MD",
    doctorEmail: "doctor@trimedi.com",
    doctorSpecialty: "Cardiology & Internal Medicine",
    hospital: "Metro Health Center",
    appointmentDate: "2026-09-12",
    timeSlot: "10:30 AM",
    type: "video",
    status: "confirmed",
    reason: "Cardio Lipid Panel Review & Blood Pressure check",
    notes: "Patient reported slight morning dizziness.",
    createdAt: new Date("2026-09-01"),
  },
  {
    _id: "apt-102",
    patientName: "Meera Sharma",
    patientEmail: "meera@gmail.com",
    patientPhone: "+91 98111 55667",
    doctorName: "Dr. Sarah Jenkins, MD",
    doctorEmail: "doctor@trimedi.com",
    doctorSpecialty: "Cardiology & Internal Medicine",
    hospital: "Metro Health Center",
    appointmentDate: "2026-09-12",
    timeSlot: "11:15 AM",
    type: "in-person",
    status: "confirmed",
    reason: "Recurrent Migraine & Aura Examination",
    notes: "",
    createdAt: new Date("2026-09-02"),
  },
  {
    _id: "apt-103",
    patientName: "Robert Vance",
    patientEmail: "vance@refrigeration.com",
    patientPhone: "+91 98222 33445",
    doctorName: "Dr. Sarah Jenkins, MD",
    doctorEmail: "doctor@trimedi.com",
    doctorSpecialty: "Cardiology & Internal Medicine",
    hospital: "Metro Health Center",
    appointmentDate: "2026-09-13",
    timeSlot: "02:00 PM",
    type: "follow-up",
    status: "scheduled",
    reason: "Prescription Renewal & Routine Checkup",
    notes: "",
    createdAt: new Date("2026-09-03"),
  },
];

// GET Appointments
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
      const appointments = await Appointment.find(query).sort({ appointmentDate: 1 });
      if (appointments && appointments.length > 0) {
        return res.json(appointments);
      }
    }

    let result = fallbackAppointments;
    if (role === "patient" && patientEmail) {
      result = result.filter(
        (a) => a.patientEmail?.toLowerCase() === patientEmail.toLowerCase() || a.patientName.toLowerCase().includes("aditya")
      );
    } else if (role === "doctor" && doctorEmail) {
      result = result.filter(
        (a) => a.doctorEmail?.toLowerCase() === doctorEmail.toLowerCase() || a.doctorName.toLowerCase().includes("jenkins")
      );
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Book Consultation / Appointment
router.post("/", requireDatabase, async (req, res) => {
  try {
    const {
      patientName,
      patientEmail,
      patientPhone,
      doctorName,
      doctorEmail,
      doctorSpecialty,
      hospital,
      appointmentDate: rawDate,
      date,
      timeSlot,
      type = "video",
      reason,
      notes,
    } = req.body;

    const appointmentDate = rawDate || date;

    if (!patientName || !doctorName || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        message: "Patient name, Doctor name, date, and timeSlot are required",
      });
    }

    const pEmail = patientEmail || "patient@trimedi.com";
    const dEmail = doctorEmail || "doctor@trimedi.com";

    let createdAppointment = null;

    if (mongoose.connection.readyState === 1) {
      createdAppointment = await Appointment.create({
        patientName,
        patientEmail: pEmail,
        patientPhone: patientPhone || "+91 98765 43210",
        doctorName,
        doctorEmail: dEmail,
        doctorSpecialty: doctorSpecialty || "General Medicine",
        hospital: hospital || "Metro Health Center",
        appointmentDate,
        timeSlot,
        type,
        status: "scheduled",
        reason: reason || "General Consultation",
        notes: notes || "",
      });
    } else {
      createdAppointment = {
        _id: "APT-" + Math.floor(100 + Math.random() * 900),
        patientName,
        patientEmail: pEmail,
        patientPhone: patientPhone || "+91 98765 43210",
        doctorName,
        doctorEmail: dEmail,
        doctorSpecialty: doctorSpecialty || "General Medicine",
        hospital: hospital || "Metro Health Center",
        appointmentDate,
        timeSlot,
        type,
        status: "scheduled",
        reason: reason || "General Consultation",
        notes: notes || "",
        createdAt: new Date(),
      };
      fallbackAppointments.unshift(createdAppointment);
    }

    // Trigger EventBus notification to Doctor
    eventBus.emit("APPOINTMENT_CREATED", {
      appointmentId: createdAppointment._id?.toString(),
      doctorEmail: dEmail,
      patientEmail: pEmail,
      patientName,
      date: appointmentDate,
      time: timeSlot,
    });

    res.status(201).json({ message: "Appointment booked successfully", appointment: createdAppointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const VALID_TRANSITIONS = {
  requested: ["scheduled", "cancelled"],
  scheduled: ["confirmed", "checked_in", "cancelled", "no_show"],
  confirmed: ["checked_in", "waiting", "cancelled", "no_show"],
  checked_in: ["waiting", "in_consultation", "cancelled", "no_show"],
  waiting: ["in_consultation", "cancelled", "no_show"],
  in_consultation: ["completed", "cancelled"],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  no_show: [],   // Terminal state
};

// POST Check-in appointment (Idempotent, enqueues patient in clinic queue)
router.post("/:id/check-in", requireDatabase, optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { priority = "normal", notes = "" } = req.body;
    const actorEmail = req.user?.email || "reception@trimedi.health";
    const actorRole = req.user?.role || "reception";

    const result = await checkInPatient({
      appointmentId: id,
      checkedInBy: req.user?.name || "Reception Desk",
      actorRole,
      actorEmail,
      priority,
      notes,
      req,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET single appointment with IDOR validation
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let apt = null;

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      apt = await Appointment.findById(id);
    } else {
      apt = fallbackAppointments.find((a) => String(a._id) === String(id));
    }

    if (!apt) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // IDOR Protection: Patient can only access their own appointment
    if (req.user && req.user.role === "patient") {
      const patientEmail = (apt.patientEmail || "").toLowerCase();
      if (patientEmail && patientEmail !== req.user.email.toLowerCase()) {
        await logClinicalAudit({
          req,
          action: "ACCESS_DENIED_IDOR",
          resourceType: "appointment",
          resourceId: String(id),
          status: "DENIED",
          details: { attempt: "cross_patient_appointment_query" },
        });
        return res.status(403).json({
          success: false,
          message: "Access denied: You are not authorized to view this appointment record.",
        });
      }
    }

    res.json({ success: true, appointment: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT Update status with State Machine Validation & Audit Log
router.put("/:id/status", requireDatabase, optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status: targetStatus, reason = "", cancelledBy } = req.body;

    const allowedStatuses = Object.keys(VALID_TRANSITIONS);
    if (!allowedStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${targetStatus}'. Allowed statuses: ${allowedStatuses.join(", ")}`,
      });
    }

    let apt = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      apt = await Appointment.findById(id);
    } else {
      apt = fallbackAppointments.find((a) => String(a._id) === String(id));
    }

    if (!apt) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const currentStatus = apt.status || "scheduled";

    // Validate State Machine Transition
    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus) && currentStatus !== targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot move appointment from '${currentStatus}' to '${targetStatus}'. Valid next states: [${allowedNext.join(", ")}]`,
      });
    }

    const actorEmail = req.user?.email || "doctor@trimedi.com";
    const actorRole = req.user?.role || "doctor";
    const transitionTimestamp = new Date();

    const historyEntry = {
      fromStatus: currentStatus,
      toStatus: targetStatus,
      changedBy: actorEmail,
      role: actorRole,
      timestamp: transitionTimestamp,
      reason: reason || `Status changed from ${currentStatus} to ${targetStatus}`,
    };

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      const updateData = { status: targetStatus, $push: { statusHistory: historyEntry } };
      if (targetStatus === "checked_in") updateData.checkInAt = transitionTimestamp;
      if (targetStatus === "in_consultation") updateData.consultationStartedAt = transitionTimestamp;
      if (targetStatus === "completed") updateData.consultationCompletedAt = transitionTimestamp;

      apt = await Appointment.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      apt.status = targetStatus;
      if (targetStatus === "checked_in") apt.checkInAt = transitionTimestamp;
      if (targetStatus === "in_consultation") apt.consultationStartedAt = transitionTimestamp;
      if (targetStatus === "completed") apt.consultationCompletedAt = transitionTimestamp;
      if (!apt.statusHistory) apt.statusHistory = [];
      apt.statusHistory.push(historyEntry);
    }

    // Clinical Audit Log
    await logClinicalAudit({
      req,
      action: "APPOINTMENT_STATUS_CHANGED",
      resourceType: "appointment",
      resourceId: String(id),
      details: { fromStatus: currentStatus, toStatus: targetStatus, reason },
    });

    // Trigger Domain Events
    if (targetStatus === "confirmed") {
      eventBus.emit("APPOINTMENT_CONFIRMED", {
        appointmentId: String(apt._id),
        patientEmail: apt.patientEmail,
        doctorName: apt.doctorName,
        date: apt.appointmentDate,
        time: apt.timeSlot,
      });
    } else if (targetStatus === "cancelled") {
      eventBus.emit("APPOINTMENT_CANCELLED", {
        appointmentId: String(apt._id),
        patientEmail: apt.patientEmail,
        doctorEmail: apt.doctorEmail,
        date: apt.appointmentDate,
        time: apt.timeSlot,
        cancelledBy: cancelledBy || actorRole,
      });
    }

    res.json({ success: true, message: "Appointment updated successfully", appointment: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
