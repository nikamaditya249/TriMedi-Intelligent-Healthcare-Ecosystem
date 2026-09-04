import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patientEmail: { type: String, required: true },
    doctorEmail: { type: String, required: true },
    patientName: { type: String, default: "Patient" },
    doctorName: { type: String, default: "Doctor" },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadPatientCount: { type: Number, default: 0 },
    unreadDoctorCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ConversationSchema.index({ patientEmail: 1, doctorEmail: 1 }, { unique: true });
ConversationSchema.index({ lastMessageAt: -1 });

export default mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
