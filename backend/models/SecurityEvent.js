import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "FAILED_LOGIN_SPIKE",
        "IDOR_ATTEMPT",
        "ROLE_TAMPERING",
        "MALICIOUS_UPLOAD_BLOCKED",
        "PAYMENT_SIGNATURE_TAMPER",
        "BREAK_GLASS_INVOKED",
        "UNAUTHORIZED_EXPORT_ATTEMPT",
        "UNAUTHORIZED_CLINICAL_ACCESS",
        "PROMPT_INJECTION_DETECTED",
        "TOKEN_REVOCATION",
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    actorEmail: { type: String, default: "unknown" },
    actorRole: { type: String, default: "unknown" },
    targetResource: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
    resolved: { type: Boolean, default: false },
    resolutionNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("SecurityEvent", securityEventSchema);
