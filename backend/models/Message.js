import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    conversationIdString: {
      type: String,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderEmail: { type: String, required: true },
    senderRole: { type: String, enum: ["patient", "doctor", "pharmacy", "admin", "system"], required: true },
    senderName: { type: String, default: "" },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiverEmail: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["text", "prescription", "appointment", "medication", "system", "ai_summary"],
      default: "text",
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ receiverEmail: 1, isRead: 1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
