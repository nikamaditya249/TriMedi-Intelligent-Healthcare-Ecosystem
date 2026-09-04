import express from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import eventBus from "../services/eventBus.js";

const router = express.Router();

const fallbackAppointments = [
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
router.post("/", async (req, res) => {
  try {
    const {
      patientName,
      patientEmail,
      patientPhone,
      doctorName,
      doctorEmail,
      doctorSpecialty,
      hospital,
      appointmentDate,
      timeSlot,
      type = "video",
      reason,
      notes,
    } = req.body;

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

// PUT Update status (Confirm, Complete, Cancel)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelledBy } = req.body;

    if (!["scheduled", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status" });
    }

    let apt = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      apt = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    } else {
      apt = fallbackAppointments.find((a) => String(a._id) === String(id));
      if (apt) apt.status = status;
    }

    if (!apt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Trigger domain events based on new status
    if (status === "confirmed") {
      eventBus.emit("APPOINTMENT_CONFIRMED", {
        appointmentId: apt._id?.toString(),
        patientEmail: apt.patientEmail,
        doctorName: apt.doctorName,
        date: apt.appointmentDate,
        time: apt.timeSlot,
      });
    } else if (status === "cancelled") {
      eventBus.emit("APPOINTMENT_CANCELLED", {
        appointmentId: apt._id?.toString(),
        patientEmail: apt.patientEmail,
        doctorEmail: apt.doctorEmail,
        date: apt.appointmentDate,
        time: apt.timeSlot,
        cancelledBy: cancelledBy || "doctor",
      });
    }

    res.json({ message: "Appointment updated", appointment: apt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
