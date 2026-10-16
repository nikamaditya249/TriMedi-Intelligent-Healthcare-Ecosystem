import mongoose from "mongoose";

const doseLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // e.g., "2026-10-16"
    timeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "as_needed"],
      default: "morning",
    },
    status: {
      type: String,
      enum: ["TAKEN", "MISSED", "SKIPPED", "UPCOMING"],
      default: "UPCOMING",
    },
    scheduledTime: { type: String, default: "" }, // e.g., "08:00 AM"
    recordedAt: { type: Date, default: null },
    recordedBy: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: true }
);

const medicationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      default: "",
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      required: false,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    doctorName: {
      type: String,
      default: "Dr. Sarah Jenkins, MD",
    },
    medicationName: {
      type: String,
      required: true,
      index: true,
    },
    normalizedMedicationName: {
      type: String,
      required: true,
      index: true,
    },
    strength: {
      type: String,
      default: "", // e.g., "20mg", "500mg"
    },
    dosage: {
      type: String,
      default: "1 Tablet",
    },
    frequency: {
      type: String,
      default: "Once daily",
    },
    route: {
      type: String,
      default: "Oral",
    },
    durationDays: {
      type: Number,
      default: 30,
    },
    prescribedQuantity: {
      type: Number,
      default: 30,
    },
    remainingQuantity: {
      type: Number,
      default: 30,
    },
    instructions: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "completed", "discontinued", "paused"],
      default: "active",
      index: true,
    },
    category: {
      type: String,
      default: "General",
    },
    scheduleSlots: [
      {
        slot: { type: String, enum: ["morning", "afternoon", "evening", "night", "as_needed"] },
        time: { type: String, default: "08:00 AM" },
        dose: { type: String, default: "1 Tab" },
      },
    ],
    doseLogs: [doseLogSchema],
    adherence: {
      totalScheduled: { type: Number, default: 0 },
      totalTaken: { type: Number, default: 0 },
      totalMissed: { type: Number, default: 0 },
      totalSkipped: { type: Number, default: 0 },
      adherencePercentage: { type: Number, default: 100 },
      lastRecordedAt: { type: Date, default: null },
    },
    refillInfo: {
      estimatedDepletionDate: { type: Date, default: null },
      refillDue: { type: Boolean, default: false },
      lastReminderSentAt: { type: Date, default: null },
      reminderCount: { type: Number, default: 0 },
    },
    source: {
      type: String,
      enum: ["PRESCRIPTION", "AI_OCR_EXTRACTION", "MANUAL_ENTRY"],
      default: "PRESCRIPTION",
    },
  },
  { timestamps: true }
);

medicationSchema.index({ patientEmail: 1, status: 1 });
medicationSchema.index({ patientEmail: 1, normalizedMedicationName: 1 });

export default mongoose.models.Medication || mongoose.model("Medication", medicationSchema);
