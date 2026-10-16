import mongoose from "mongoose";

const aiAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
      // e.g. "PRESCRIPTION_OCR_EXTRACTION", "INSTRUCTION_SIMPLIFICATION", "CONSULTATION_SUMMARIZATION", "SAFETY_INTERACTION_CHECK"
    },
    provider: {
      type: String,
      default: "TriMedi Medical NLP / Gemini",
    },
    model: {
      type: String,
      default: "gemini-1.5-flash",
    },
    modelVersion: {
      type: String,
      default: "1.5-flash-latest",
    },
    actorId: {
      type: String,
      default: "",
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      default: "patient",
      index: true,
    },
    patientEmail: {
      type: String,
      default: "",
      index: true,
    },
    resourceType: {
      type: String,
      default: "prescription",
    },
    resourceId: {
      type: String,
      default: "",
      index: true,
    },
    overallConfidence: {
      type: Number,
      default: 0.9,
    },
    fieldConfidences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reviewStatus: {
      type: String,
      enum: ["AI_GENERATED", "PENDING_REVIEW", "REVIEWED", "APPROVED", "REJECTED"],
      default: "PENDING_REVIEW",
      index: true,
    },
    reviewedBy: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    isError: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Immutability: AI audits are write-only ledgers
aiAuditSchema.pre("updateOne", function () {
  throw new Error("AI_AUDIT_IMMUTABLE: AI audit records cannot be altered.");
});
aiAuditSchema.pre("updateMany", function () {
  throw new Error("AI_AUDIT_IMMUTABLE: AI audit records cannot be altered.");
});
aiAuditSchema.pre("deleteOne", function () {
  throw new Error("AI_AUDIT_IMMUTABLE: AI audit records cannot be deleted.");
});
aiAuditSchema.pre("deleteMany", function () {
  throw new Error("AI_AUDIT_IMMUTABLE: AI audit records cannot be deleted.");
});

aiAuditSchema.index({ actorEmail: 1, action: 1, timestamp: -1 });
aiAuditSchema.index({ patientEmail: 1, timestamp: -1 });

export default mongoose.models.AIAudit || mongoose.model("AIAudit", aiAuditSchema);
