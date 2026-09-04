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
      enum: ["scheduled", "confirmed", "completed", "cancelled"],
      default: "scheduled",
    },
    reason: { type: String, default: "General Consultation & Prescription Review" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
