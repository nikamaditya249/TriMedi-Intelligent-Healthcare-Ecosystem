import mongoose from "mongoose";

const clinicQueueSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      required: false,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientEmail: {
      type: String,
      required: true,
      index: true,
    },
    patientPhone: {
      type: String,
      default: "",
    },
    doctorId: {
      type: String,
      required: false,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    doctorEmail: {
      type: String,
      default: "",
      index: true,
    },
    clinicName: {
      type: String,
      default: "Metro Health Center",
      index: true,
    },
    queueNumber: {
      type: Number,
      required: true,
    },
    priority: {
      type: String,
      enum: ["normal", "urgent", "follow_up"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["waiting", "called", "in_consultation", "completed", "cancelled", "no_show"],
      default: "waiting",
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    calledTime: {
      type: Date,
      default: null,
    },
    consultationStartTime: {
      type: Date,
      default: null,
    },
    consultationEndTime: {
      type: Date,
      default: null,
    },
    estimatedWaitMinutes: {
      type: Number,
      default: 15,
    },
    checkedInBy: {
      type: String,
      default: "Reception Desk",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index for querying active clinic queue efficiently
clinicQueueSchema.index({ clinicName: 1, status: 1, queueNumber: 1 });
clinicQueueSchema.index({ doctorEmail: 1, status: 1 });

export default mongoose.models.ClinicQueue || mongoose.model("ClinicQueue", clinicQueueSchema);
