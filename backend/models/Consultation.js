import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      required: false,
      index: true,
    },
    patientEmail: {
      type: String,
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      required: false,
      index: true,
    },
    doctorEmail: {
      type: String,
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    doctorSpecialty: {
      type: String,
      default: "Internal Medicine",
    },
    clinicName: {
      type: String,
      default: "Metro Health Center",
    },
    // Vitals recorded at check-in or consultation
    vitals: {
      bloodPressure: { type: String, default: "" }, // e.g., "120/80 mmHg"
      heartRate: { type: String, default: "" },     // e.g., "72 bpm"
      temperature: { type: String, default: "" },   // e.g., "98.6 °F"
      weightKg: { type: Number, default: null },     // e.g., 70
      spO2: { type: String, default: "" },          // e.g., "99%"
    },
    chiefComplaint: {
      type: String,
      default: "",
    },
    clinicalNotes: {
      type: String,
      default: "",
    },
    diagnosis: {
      type: String,
      required: true,
      default: "General Clinical Review",
    },
    treatmentPlan: {
      type: String,
      default: "",
    },
    followUpDate: {
      type: String,
      default: "",
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      required: false,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Longitudinal Audit & Append-Only Record Amendments
    amendments: [
      {
        amendedAt: { type: Date, default: Date.now },
        amendedBy: { type: String, required: true },
        reason: { type: String, required: true },
        previousNotes: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// Longitudinal patient medical record lookup index
consultationSchema.index({ patientEmail: 1, completedAt: -1 });
consultationSchema.index({ doctorEmail: 1, completedAt: -1 });

export default mongoose.models.Consultation || mongoose.model("Consultation", consultationSchema);
