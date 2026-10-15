import mongoose from "mongoose";

const prescriptionItemSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false,
  },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true }, // e.g., "500mg", "1 Tab"
  frequency: { type: String, required: true }, // e.g., "Twice daily after meals", "Once daily (Night)"
  durationDays: { type: Number, required: true, default: 30 }, // e.g., 30 days
  quantityPrescribed: { type: Number, required: true, default: 30 },
  instructions: { type: String, default: "" },
});

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    patientName: { type: String, required: true },
    patientEmail: { type: String, default: "" },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    doctorName: { type: String, required: true },
    doctorEmail: { type: String, default: "" },
    doctorSpecialty: { type: String, default: "General Medicine" },
    diagnosis: { type: String, required: true },
    items: [prescriptionItemSchema],
    validUntil: { type: Date },
    status: {
      type: String,
      enum: ["draft", "reviewed", "approved", "issued", "active", "completed", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    notes: { type: String, default: "" },
    aiExtracted: { type: Boolean, default: false },
    originalDocumentName: { type: String, default: "" },
    // Phase 2 Clinical Governance & Lifecycle Tracking
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: false,
    },
    appointmentId: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    approvalNotes: { type: String, default: "" },
    history: [
      {
        status: { type: String },
        changedBy: { type: String },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);
