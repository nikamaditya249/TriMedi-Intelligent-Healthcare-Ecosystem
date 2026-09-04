import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "pharmacy", "admin"],
      default: "patient",
    },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    // Doctor specific fields
    specialty: { type: String, default: "" },
    hospital: { type: String, default: "" },
    licenseNumber: { type: String, default: "" },
    // Pharmacy specific fields
    pharmacyName: { type: String, default: "" },
    licenseId: { type: String, default: "" },
    address: { type: String, default: "" },
    // Patient specific fields
    bloodGroup: { type: String, default: "" },
    allergies: { type: [String], default: [] },
    emergencyContact: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);