import mongoose from "mongoose";

const consentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    consentType: {
      type: String,
      required: true,
      enum: [
        "CONSULTATION_DATA",
        "MEDICAL_RECORD_STORAGE",
        "PRESCRIPTION_PROCESSING",
        "AI_ASSISTANCE",
        "NOTIFICATION_EMAIL",
        "NOTIFICATION_SMS",
        "MARKETING",
      ],
      index: true,
    },
    purpose: { type: String, required: true },
    version: { type: String, default: "2026.1" },
    granted: { type: Boolean, default: true },
    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    source: { type: String, default: "portal" },
    policyVersion: { type: String, default: "2026.1" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

consentSchema.index({ userEmail: 1, consentType: 1 });

export default mongoose.models.Consent || mongoose.model("Consent", consentSchema);
