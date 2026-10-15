import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: false,
    },
    patientName: { type: String, required: true },
    patientEmail: { type: String, default: "" },
    patientPhone: { type: String, default: "" },
    doctorId: {
      type: String,
      required: false,
    },
    doctorName: { type: String, required: true },
    doctorEmail: { type: String, default: "" },
    doctorSpecialty: { type: String, default: "Internal Medicine & Cardiology" },
    hospital: { type: String, default: "Metro Health Center" },
    appointmentDate: { type: String, required: true }, // e.g. "2026-09-12"
    timeSlot: { type: String, required: true, default: "10:30 AM" },
    type: {
      type: String,
      enum: ["video", "in-person", "follow-up"],
      default: "video",
    },
    status: {
      type: String,
      enum: [
        "requested",
        "scheduled",
        "confirmed",
        "checked_in",
        "waiting",
        "in_consultation",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "scheduled",
      index: true,
    },
    reason: { type: String, default: "General Consultation & Prescription Review" },
    notes: { type: String, default: "" },
    // Phase 2 State Machine Tracking & Audit
    checkInAt: { type: Date, default: null },
    consultationStartedAt: { type: Date, default: null },
    consultationCompletedAt: { type: Date, default: null },
    queueNumber: { type: Number, default: null },
    estimatedWaitMinutes: { type: Number, default: 0 },
    checkedInBy: { type: String, default: "" },
    statusHistory: [
      {
        fromStatus: { type: String },
        toStatus: { type: String },
        changedBy: { type: String },
        role: { type: String },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
