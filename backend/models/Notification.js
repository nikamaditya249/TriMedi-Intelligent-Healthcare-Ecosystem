import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ["patient", "doctor", "pharmacy", "admin"],
      default: "patient",
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["appointment", "prescription", "order", "payment", "medication", "refill", "chat", "system"],
      default: "system",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    relatedEntityType: {
      type: String,
      enum: ["appointment", "prescription", "order", "conversation", "product", "general"],
      default: "general",
    },
    relatedEntityId: {
      type: String,
      default: "",
    },
    linkUrl: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userEmail: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
