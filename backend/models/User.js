import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "pharmacy", "admin", "reception"],
      default: "patient",
    },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    // Doctor specific fields & verification
    specialty: { type: String, default: "" },
    hospital: { type: String, default: "" },
    licenseNumber: { type: String, default: "" },
    qualifications: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ["pending", "under_review", "verified", "rejected", "suspended"],
      default: "verified", // Demo doctors verified, new registers pending
    },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: String, default: "" },
    // Reception specific fields
    clinicName: { type: String, default: "Metro Health Center" },
    shift: { type: String, default: "General Day Shift" },
    // Pharmacy specific fields
    pharmacyName: { type: String, default: "" },
    licenseId: { type: String, default: "" },
    address: { type: String, default: "" },
    // Patient clinical onboarding fields
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    allergies: { type: [String], default: [] },
    existingConditions: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    medicalHistoryNotes: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);