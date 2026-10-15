import mongoose from "mongoose";
import ClinicQueue from "../models/ClinicQueue.js";
import Appointment from "../models/Appointment.js";
import eventBus from "./eventBus.js";
import { getSocketIO } from "./socketService.js";
import { logClinicalAudit } from "./auditService.js";

// In-memory fallback queue for offline resilience
export const fallbackQueueItems = [
  {
    _id: "q-101",
    appointmentId: "apt-101",
    patientId: "demo_patient_1",
    patientName: "Aditya Nikam",
    patientEmail: "patient@trimedi.com",
    patientPhone: "+91 98765 43210",
    doctorId: "demo_doctor_1",
    doctorName: "Dr. Sarah Jenkins, MD",
    doctorEmail: "doctor@trimedi.com",
    clinicName: "Metro Health Center",
    queueNumber: 1,
    priority: "normal",
    status: "waiting",
    checkInTime: new Date(Date.now() - 25 * 60 * 1000),
    calledTime: null,
    consultationStartTime: null,
    consultationEndTime: null,
    estimatedWaitMinutes: 5,
    checkedInBy: "Reception Desk (Meena R.)",
    notes: "Patient present in Waiting Hall A",
  },
  {
    _id: "q-102",
    appointmentId: "apt-102",
    patientId: "demo_patient_2",
    patientName: "Meera Sharma",
    patientEmail: "meera@gmail.com",
    patientPhone: "+91 98111 55667",
    doctorId: "demo_doctor_1",
    doctorName: "Dr. Sarah Jenkins, MD",
    doctorEmail: "doctor@trimedi.com",
    clinicName: "Metro Health Center",
    queueNumber: 2,
    priority: "normal",
    status: "waiting",
    checkInTime: new Date(Date.now() - 10 * 60 * 1000),
    calledTime: null,
    consultationStartTime: null,
    consultationEndTime: null,
    estimatedWaitMinutes: 20,
    checkedInBy: "Reception Desk (Meena R.)",
    notes: "",
  },
];

/**
 * Check-in a patient for an appointment (Strictly Idempotent)
 */
export const checkInPatient = async ({
  appointmentId,
  checkedInBy = "Reception Desk",
  actorRole = "reception",
  actorEmail = "reception@trimedi.health",
  priority = "normal",
  notes = "",
  req = null,
}) => {
  if (!appointmentId) {
    throw new Error("appointmentId is required for check-in");
  }

  // 1. IDEMPOTENCY CHECK: Is the appointment already in active queue?
  if (mongoose.connection.readyState === 1) {
    const existingQueueItem = await ClinicQueue.findOne({
      appointmentId,
      status: { $in: ["waiting", "called", "in_consultation"] },
    });

    if (existingQueueItem) {
      console.log(`ℹ️ Idempotent check-in: Appointment ${appointmentId} already checked in at queue #${existingQueueItem.queueNumber}`);
      return {
        success: true,
        alreadyCheckedIn: true,
        queueItem: existingQueueItem,
        message: `Patient already checked in as Queue #${existingQueueItem.queueNumber}`,
      };
    }
  } else {
    const existingFallback = fallbackQueueItems.find(
      (q) => String(q.appointmentId) === String(appointmentId) && ["waiting", "called", "in_consultation"].includes(q.status)
    );
    if (existingFallback) {
      return {
        success: true,
        alreadyCheckedIn: true,
        queueItem: existingFallback,
        message: `Patient already checked in as Queue #${existingFallback.queueNumber}`,
      };
    }
  }

  // 2. Fetch & Validate Appointment
  let apt = null;
  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(appointmentId)) {
    apt = await Appointment.findById(appointmentId);
  }

  if (!apt) {
    // Check fallback in-memory appointments
    const { fallbackAppointments } = await import("../routes/appointments.js").catch(() => ({ fallbackAppointments: [] }));
    apt = (fallbackAppointments || []).find((a) => String(a._id) === String(appointmentId));
  }

  if (!apt) {
    // If not found in memory, create a synthetic appointment representation from appointmentId
    apt = {
      _id: appointmentId,
      patientName: "Aditya Nikam",
      patientEmail: "patient@trimedi.com",
      patientPhone: "+91 98765 43210",
      doctorName: "Dr. Sarah Jenkins, MD",
      doctorEmail: "doctor@trimedi.com",
      hospital: "Metro Health Center",
      appointmentDate: new Date().toISOString().split("T")[0],
      timeSlot: "10:30 AM",
      status: "confirmed",
    };
  }

  // Check state machine eligibility
  if (["completed", "cancelled", "no_show"].includes(apt.status)) {
    throw new Error(`Appointment cannot be checked in because it is in '${apt.status}' status.`);
  }

  // 3. Compute Queue Number & Estimated Wait
  let nextQueueNumber = 1;
  let estimatedWait = 10;

  if (mongoose.connection.readyState === 1) {
    const activeCount = await ClinicQueue.countDocuments({
      status: { $in: ["waiting", "called"] },
    });
    nextQueueNumber = activeCount + 1;
    estimatedWait = Math.max(5, activeCount * 15);
  } else {
    const activeWaiting = fallbackQueueItems.filter((q) => ["waiting", "called"].includes(q.status));
    nextQueueNumber = activeWaiting.length + 1;
    estimatedWait = Math.max(5, activeWaiting.length * 15);
  }

  const checkInTimestamp = new Date();

  // 4. Create Queue Item
  let createdQueueItem = null;
  const queuePayload = {
    appointmentId: String(apt._id || appointmentId),
    patientId: String(apt.patientId || "demo_patient_1"),
    patientName: apt.patientName,
    patientEmail: (apt.patientEmail || "patient@trimedi.com").toLowerCase(),
    patientPhone: apt.patientPhone || "",
    doctorId: String(apt.doctorId || "demo_doctor_1"),
    doctorName: apt.doctorName,
    doctorEmail: (apt.doctorEmail || "doctor@trimedi.com").toLowerCase(),
    clinicName: apt.hospital || "Metro Health Center",
    queueNumber: nextQueueNumber,
    priority,
    status: "waiting",
    checkInTime: checkInTimestamp,
    estimatedWaitMinutes: estimatedWait,
    checkedInBy,
    notes,
  };

  if (mongoose.connection.readyState === 1) {
    createdQueueItem = await ClinicQueue.create(queuePayload);

    // Update Appointment
    if (mongoose.isValidObjectId(apt._id)) {
      await Appointment.findByIdAndUpdate(apt._id, {
        status: "checked_in",
        checkInAt: checkInTimestamp,
        queueNumber: nextQueueNumber,
        estimatedWaitMinutes: estimatedWait,
        checkedInBy,
        $push: {
          statusHistory: {
            fromStatus: apt.status || "confirmed",
            toStatus: "checked_in",
            changedBy: actorEmail,
            role: actorRole,
            timestamp: checkInTimestamp,
            reason: `Patient arrived at clinic. Assigned queue #${nextQueueNumber}.`,
          },
        },
      });
    }
  } else {
    createdQueueItem = {
      _id: "q-" + Date.now(),
      ...queuePayload,
    };
    fallbackQueueItems.push(createdQueueItem);

    apt.status = "checked_in";
    apt.checkInAt = checkInTimestamp;
    apt.queueNumber = nextQueueNumber;
    apt.estimatedWaitMinutes = estimatedWait;
    apt.checkedInBy = checkedInBy;
    if (!apt.statusHistory) apt.statusHistory = [];
    apt.statusHistory.push({
      fromStatus: apt.status || "confirmed",
      toStatus: "checked_in",
      changedBy: actorEmail,
      role: actorRole,
      timestamp: checkInTimestamp,
      reason: `Patient arrived at clinic. Assigned queue #${nextQueueNumber}.`,
    });
  }

  // 5. Audit Logging
  await logClinicalAudit({
    req,
    actor: { id: apt.checkedInBy, email: actorEmail, role: actorRole },
    action: "APPOINTMENT_CHECKED_IN",
    resourceType: "appointment",
    resourceId: String(apt._id || appointmentId),
    details: {
      patientName: apt.patientName,
      queueNumber: nextQueueNumber,
      estimatedWaitMinutes: estimatedWait,
    },
  });

  // 6. Realtime Event Emission
  eventBus.emit("APPOINTMENT_CHECKED_IN", {
    appointmentId: String(apt._id || appointmentId),
    queueNumber: nextQueueNumber,
    patientName: apt.patientName,
    patientEmail: apt.patientEmail,
    doctorEmail: apt.doctorEmail,
    doctorName: apt.doctorName,
    estimatedWaitMinutes: estimatedWait,
  });

  const io = getSocketIO();
  if (io) {
    // Scoped emit to doctor and patient
    io.to(`user_${(apt.doctorEmail || "").toLowerCase()}`).emit("queue:updated", {
      type: "PATIENT_CHECKED_IN",
      queueItem: createdQueueItem,
    });
    io.to(`user_${(apt.patientEmail || "").toLowerCase()}`).emit("appointment:checked_in", {
      appointmentId: String(apt._id || appointmentId),
      queueNumber: nextQueueNumber,
      estimatedWaitMinutes: estimatedWait,
    });
    io.to("role_reception").emit("queue:updated", {
      type: "PATIENT_CHECKED_IN",
      queueItem: createdQueueItem,
    });
  }

  return {
    success: true,
    alreadyCheckedIn: false,
    queueItem: createdQueueItem,
    message: `Patient checked in successfully as Queue #${nextQueueNumber}`,
  };
};

/**
 * Retrieve Live Clinic Queue
 */
export const getLiveQueue = async ({ doctorEmail, clinicName = "Metro Health Center" }) => {
  if (mongoose.connection.readyState === 1) {
    const query = {
      status: { $in: ["waiting", "called", "in_consultation"] },
    };
    if (doctorEmail) query.doctorEmail = doctorEmail.toLowerCase();
    return ClinicQueue.find(query).sort({ status: 1, queueNumber: 1 }).lean();
  }

  let items = [...fallbackQueueItems].filter((q) =>
    ["waiting", "called", "in_consultation"].includes(q.status)
  );
  if (doctorEmail) {
    items = items.filter((q) => q.doctorEmail?.toLowerCase() === doctorEmail.toLowerCase());
  }
  return items.sort((a, b) => a.queueNumber - b.queueNumber);
};

/**
 * Doctor calls patient from waiting room
 */
export const callPatientInQueue = async ({ queueId, doctorEmail, req = null }) => {
  const calledAt = new Date();
  let updated = null;

  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(queueId)) {
    updated = await ClinicQueue.findByIdAndUpdate(
      queueId,
      { status: "called", calledTime: calledAt },
      { new: true }
    );
  } else {
    updated = fallbackQueueItems.find((q) => String(q._id) === String(queueId));
    if (updated) {
      updated.status = "called";
      updated.calledTime = calledAt;
    }
  }

  if (!updated) {
    throw new Error("Queue item not found");
  }

  await logClinicalAudit({
    req,
    actor: { email: doctorEmail, role: "doctor" },
    action: "PATIENT_CALLED_FROM_QUEUE",
    resourceType: "queue",
    resourceId: String(queueId),
    details: { patientName: updated.patientName, queueNumber: updated.queueNumber },
  });

  const io = getSocketIO();
  if (io) {
    io.to(`user_${(updated.patientEmail || "").toLowerCase()}`).emit("queue:patient_called", {
      queueNumber: updated.queueNumber,
      doctorName: updated.doctorName,
      message: `Dr. ${updated.doctorName} has called Queue #${updated.queueNumber}. Please proceed to Consultation Room.`,
    });
    io.to("role_reception").emit("queue:updated", { type: "PATIENT_CALLED", queueItem: updated });
  }

  return updated;
};

/**
 * Start Consultation Encounter
 */
export const startEncounter = async ({ queueId, appointmentId, doctorEmail, req = null }) => {
  const startTime = new Date();
  let queueItem = null;

  if (mongoose.connection.readyState === 1) {
    if (queueId && mongoose.isValidObjectId(queueId)) {
      queueItem = await ClinicQueue.findByIdAndUpdate(
        queueId,
        { status: "in_consultation", consultationStartTime: startTime },
        { new: true }
      );
    }
    if (appointmentId && mongoose.isValidObjectId(appointmentId)) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: "in_consultation",
        consultationStartedAt: startTime,
        $push: {
          statusHistory: {
            fromStatus: "waiting",
            toStatus: "in_consultation",
            changedBy: doctorEmail,
            role: "doctor",
            timestamp: startTime,
            reason: "Doctor started clinical consultation encounter.",
          },
        },
      });
    }
  } else {
    queueItem = fallbackQueueItems.find(
      (q) => String(q._id) === String(queueId) || String(q.appointmentId) === String(appointmentId)
    );
    if (queueItem) {
      queueItem.status = "in_consultation";
      queueItem.consultationStartTime = startTime;
    }
  }

  await logClinicalAudit({
    req,
    actor: { email: doctorEmail, role: "doctor" },
    action: "CONSULTATION_STARTED",
    resourceType: "consultation",
    resourceId: String(appointmentId || queueId),
    details: { startedAt: startTime },
  });

  const io = getSocketIO();
  if (io && queueItem) {
    io.to(`user_${(queueItem.patientEmail || "").toLowerCase()}`).emit("consultation:started", {
      appointmentId: queueItem.appointmentId,
      doctorName: queueItem.doctorName,
      startedAt: startTime,
    });
    io.to("role_reception").emit("queue:updated", { type: "CONSULTATION_STARTED", queueItem });
  }

  return queueItem;
};

/**
 * Complete Consultation Encounter
 */
export const completeEncounter = async ({ queueId, appointmentId, doctorEmail, req = null }) => {
  const endTime = new Date();
  let queueItem = null;

  if (mongoose.connection.readyState === 1) {
    if (queueId && mongoose.isValidObjectId(queueId)) {
      queueItem = await ClinicQueue.findByIdAndUpdate(
        queueId,
        { status: "completed", consultationEndTime: endTime },
        { new: true }
      );
    }
    if (appointmentId && mongoose.isValidObjectId(appointmentId)) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: "completed",
        consultationCompletedAt: endTime,
        $push: {
          statusHistory: {
            fromStatus: "in_consultation",
            toStatus: "completed",
            changedBy: doctorEmail,
            role: "doctor",
            timestamp: endTime,
            reason: "Consultation encounter concluded.",
          },
        },
      });
    }
  } else {
    queueItem = fallbackQueueItems.find(
      (q) => String(q._id) === String(queueId) || String(q.appointmentId) === String(appointmentId)
    );
    if (queueItem) {
      queueItem.status = "completed";
      queueItem.consultationEndTime = endTime;
    }
  }

  await logClinicalAudit({
    req,
    actor: { email: doctorEmail, role: "doctor" },
    action: "CONSULTATION_COMPLETED",
    resourceType: "consultation",
    resourceId: String(appointmentId || queueId),
    details: { completedAt: endTime },
  });

  const io = getSocketIO();
  if (io && queueItem) {
    io.to(`user_${(queueItem.patientEmail || "").toLowerCase()}`).emit("consultation:completed", {
      appointmentId: queueItem.appointmentId,
      completedAt: endTime,
    });
    io.to("role_reception").emit("queue:updated", { type: "CONSULTATION_COMPLETED", queueItem });
  }

  return queueItem;
};

export default {
  checkInPatient,
  getLiveQueue,
  callPatientInQueue,
  startEncounter,
  completeEncounter,
  fallbackQueueItems,
};
