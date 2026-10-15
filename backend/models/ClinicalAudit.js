import mongoose from "mongoose";

const clinicalAuditSchema = new mongoose.Schema(
  {
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      // e.g., "PATIENT_PROFILE_VIEWED", "MEDICAL_RECORD_VIEWED", "APPOINTMENT_CHECKED_IN",
      // "CONSULTATION_STARTED", "CONSULTATION_COMPLETED", "PRESCRIPTION_APPROVED", "DOCTOR_VERIFIED", "ACCESS_DENIED"
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
      // e.g., "patient", "appointment", "queue", "consultation", "prescription", "doctor"
    },
    resourceId: {
      type: String,
      default: "",
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["SUCCESS", "DENIED", "FAILED"],
      default: "SUCCESS",
      index: true,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    // Immutable collection: audits are append-only
  }
);

// Prevent updates or deletions on clinical audit logs
clinicalAuditSchema.pre("updateOne", function () {
  throw new Error("CLINICAL_AUDIT_IMMUTABLE: Clinical audit logs cannot be updated.");
});
clinicalAuditSchema.pre("updateMany", function () {
  throw new Error("CLINICAL_AUDIT_IMMUTABLE: Clinical audit logs cannot be updated.");
});
clinicalAuditSchema.pre("deleteOne", function () {
  throw new Error("CLINICAL_AUDIT_IMMUTABLE: Clinical audit logs cannot be deleted.");
});
clinicalAuditSchema.pre("deleteMany", function () {
  throw new Error("CLINICAL_AUDIT_IMMUTABLE: Clinical audit logs cannot be deleted.");
});

clinicalAuditSchema.index({ actorEmail: 1, action: 1, timestamp: -1 });
clinicalAuditSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

export default mongoose.models.ClinicalAudit || mongoose.model("ClinicalAudit", clinicalAuditSchema);
