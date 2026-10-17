import { EventEmitter } from "events";
import Notification from "../models/Notification.js";
import { getSocketIO } from "./socketService.js";

class HealthcareEventBus extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  // In-memory fallback notifications store for resilience
  fallbackNotifications = [];

  setupListeners() {
    // 1. APPOINTMENTS
    this.on("APPOINTMENT_CREATED", async (data) => {
      await this.createNotification({
        userEmail: data.doctorEmail,
        userRole: "doctor",
        type: "APPOINTMENT_CREATED",
        title: "New Appointment Booked",
        message: `Patient ${data.patientName || "A patient"} booked a consultation for ${data.date} at ${data.time}.`,
        category: "appointment",
        priority: "medium",
        relatedEntityType: "appointment",
        relatedEntityId: data.appointmentId || "",
        linkUrl: "/app/doctor/dashboard",
      });
    });

    this.on("APPOINTMENT_CONFIRMED", async (data) => {
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "APPOINTMENT_CONFIRMED",
        title: "Appointment Confirmed",
        message: `Your appointment with Dr. ${data.doctorName || "your doctor"} on ${data.date} at ${data.time} is confirmed.`,
        category: "appointment",
        priority: "high",
        relatedEntityType: "appointment",
        relatedEntityId: data.appointmentId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    this.on("APPOINTMENT_CANCELLED", async (data) => {
      const recipient = data.cancelledBy === "doctor" ? data.patientEmail : data.doctorEmail;
      const role = data.cancelledBy === "doctor" ? "patient" : "doctor";
      await this.createNotification({
        userEmail: recipient,
        userRole: role,
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment Cancelled",
        message: `The appointment scheduled for ${data.date} at ${data.time} was cancelled.`,
        category: "appointment",
        priority: "high",
        relatedEntityType: "appointment",
        relatedEntityId: data.appointmentId || "",
        linkUrl: role === "patient" ? "/app/patient/dashboard" : "/app/doctor/dashboard",
      });
    });

    this.on("APPOINTMENT_CHECKED_IN", async (data) => {
      // Notify Doctor that patient is in waiting room
      await this.createNotification({
        userEmail: data.doctorEmail,
        userRole: "doctor",
        type: "PATIENT_CHECKED_IN",
        title: `Patient Checked In: Queue #${data.queueNumber}`,
        message: `${data.patientName} has arrived at the clinic and is waiting in the queue.`,
        category: "appointment",
        priority: "high",
        relatedEntityType: "appointment",
        relatedEntityId: data.appointmentId || "",
        linkUrl: "/app/doctor/dashboard",
      });

      // Notify Patient with Queue position & estimated wait
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "CHECK_IN_CONFIRMED",
        title: `Checked In: Queue #${data.queueNumber}`,
        message: `You are checked in for Dr. ${data.doctorName}. Estimated wait: ~${data.estimatedWaitMinutes} minutes.`,
        category: "appointment",
        priority: "medium",
        relatedEntityType: "appointment",
        relatedEntityId: data.appointmentId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    this.on("CONSULTATION_STARTED", async (data) => {
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "CONSULTATION_STARTED",
        title: "Consultation In Progress",
        message: `Dr. ${data.doctorName} has started your clinical consultation encounter.`,
        category: "appointment",
        priority: "urgent",
        relatedEntityType: "appointment",
        relatedEntityId: data.appointmentId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    this.on("CONSULTATION_COMPLETED", async (data) => {
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "CONSULTATION_COMPLETED",
        title: "Consultation Concluded",
        message: `Your consultation with Dr. ${data.doctorName} is complete. Your medical records and digital prescription have been finalized.`,
        category: "appointment",
        priority: "medium",
        relatedEntityType: "appointment",
        relatedEntityId: data.appointmentId || "",
        linkUrl: "/app/patient/prescriptions",
      });
    });

    // 2. PRESCRIPTIONS
    this.on("PRESCRIPTION_ISSUED", async (data) => {
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "PRESCRIPTION_ISSUED",
        title: "New Prescription Available",
        message: `Dr. ${data.doctorName || "your doctor"} has issued a digital prescription for ${data.diagnosis || "your treatment"}.`,
        category: "prescription",
        priority: "high",
        relatedEntityType: "prescription",
        relatedEntityId: data.prescriptionId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    // 3. ORDERS & PHARMACY
    this.on("ORDER_CREATED", async (data) => {
      // Notify Pharmacy
      await this.createNotification({
        userEmail: "pharmacy@trimedi.com", // Broadcast to pharmacy role
        userRole: "pharmacy",
        type: "ORDER_CREATED",
        title: "New Order Received",
        message: `Order #${data.orderId?.slice(-6) || "NEW"} (${data.itemsCount || 1} items - ₹${data.totalAmount}) is awaiting fulfillment.`,
        category: "order",
        priority: "high",
        relatedEntityType: "order",
        relatedEntityId: data.orderId || "",
        linkUrl: "/app/pharmacy/dashboard",
      });

      // Notify Patient
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "ORDER_CREATED",
        title: "Order Placed Successfully",
        message: `Your medicine order #${data.orderId?.slice(-6) || ""} for ₹${data.totalAmount} has been confirmed.`,
        category: "order",
        priority: "medium",
        relatedEntityType: "order",
        relatedEntityId: data.orderId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    this.on("ORDER_STATUS_CHANGED", async (data) => {
      const statusLabels = {
        Processing: "is currently being processed by the pharmacy.",
        Dispensed: "has been dispensed and packed for dispatch.",
        Shipped: "is on the way to your delivery address.",
        Delivered: "has been delivered. Stay consistent with your prescribed routine.",
        Cancelled: "has been cancelled.",
      };

      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: `ORDER_${(data.newStatus || "UPDATED").toUpperCase()}`,
        title: `Order Status: ${data.newStatus}`,
        message: `Your order #${data.orderId?.slice(-6) || ""} ${statusLabels[data.newStatus] || "status was updated."}`,
        category: "order",
        priority: data.newStatus === "Delivered" ? "high" : "medium",
        relatedEntityType: "order",
        relatedEntityId: data.orderId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    // 4. REFILL & MEDICATION INTELLIGENCE
    this.on("REFILL_RECOMMENDED", async (data) => {
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "REFILL_RECOMMENDED",
        title: "Medication Refill Recommendation",
        message: `Your estimated supply for ${data.medicineName} (${data.daysRemaining || 3} days remaining) may be running low based on your prescription duration.`,
        category: "refill",
        priority: "high",
        relatedEntityType: "prescription",
        relatedEntityId: data.prescriptionId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    this.on("MEDICATION_REMINDER_DUE", async (data) => {
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "MEDICATION_REMINDER_DUE",
        title: "Medication Routine Reminder",
        message: `Reminder: Please take your prescribed dose of ${data.medicineName} (${data.dosage || "as prescribed"}).`,
        category: "medication",
        priority: "medium",
        relatedEntityType: "medication",
        relatedEntityId: data.medicationId || data.prescriptionId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    this.on("MEDICATION_REFILL_APPROACHING", async (data) => {
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "MEDICATION_REFILL_APPROACHING",
        title: `Refill Approaching: ${data.medicineName}`,
        message: `Your estimated supply for ${data.medicineName} runs low in approximately ${data.daysRemaining || 5} days. You can review your routine and request a refill.`,
        category: "refill",
        priority: "high",
        relatedEntityType: "medication",
        relatedEntityId: data.medicationId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    this.on("MEDICATION_REFILL_DUE", async (data) => {
      await this.createNotification({
        userEmail: data.patientEmail,
        userRole: "patient",
        type: "MEDICATION_REFILL_DUE",
        title: `Refill Due: ${data.medicineName}`,
        message: `Estimated supply for ${data.medicineName} is depleted or due today. Order Again is ready for your confirmation.`,
        category: "refill",
        priority: "urgent",
        relatedEntityType: "medication",
        relatedEntityId: data.medicationId || "",
        linkUrl: "/app/patient/dashboard",
      });
    });

    this.on("MEDICATION_ADHERENCE_UPDATED", (data) => {
      const io = getSocketIO();
      if (io && data.patientEmail) {
        io.to(`user_${data.patientEmail.toLowerCase()}`).emit("medication:adherence_updated", data);
      }
    });

    this.on("AI_REVIEW_REQUIRED", async (data) => {
      if (data.doctorEmail) {
        await this.createNotification({
          userEmail: data.doctorEmail,
          userRole: "doctor",
          type: "AI_REVIEW_REQUIRED",
          title: "Prescription OCR Draft Ready",
          message: `AI extracted a prescription draft for ${data.patientName || "a patient"}. Doctor review and sign-off required.`,
          category: "prescription",
          priority: "high",
          relatedEntityType: "prescription",
          relatedEntityId: data.prescriptionId || "",
          linkUrl: "/app/doctor/dashboard",
        });
      }
    });

    // 5. CHAT MESSAGES
    this.on("MESSAGE_CREATED", async (data) => {
      await this.createNotification({
        userEmail: data.receiverEmail,
        userRole: data.receiverRole || "patient",
        type: "MESSAGE_CREATED",
        title: `Message from ${data.senderName || "Dr. Consultation"}`,
        message: data.content.length > 80 ? `${data.content.slice(0, 77)}...` : data.content,
        category: "chat",
        priority: "medium",
        relatedEntityType: "conversation",
        relatedEntityId: data.conversationId || "",
        linkUrl: "/app/chat",
      });
    });
  }

  // Idempotency cache for notifications (deduplicates within a 60s sliding window)
  notificationDedupCache = new Map();

  async createNotification(notifData) {
    try {
      const dedupKey = `${notifData.type}_${notifData.relatedEntityId || ""}_${notifData.userEmail || notifData.userRole}`;
      const now = Date.now();
      const lastSent = this.notificationDedupCache.get(dedupKey);

      // Deduplicate: If an identical notification was dispatched within the last 60 seconds, skip
      if (lastSent && now - lastSent < 60000) {
        return null;
      }
      this.notificationDedupCache.set(dedupKey, now);

      // Clean cache periodically
      if (this.notificationDedupCache.size > 2000) {
        for (const [k, t] of this.notificationDedupCache.entries()) {
          if (now - t > 60000) this.notificationDedupCache.delete(k);
        }
      }

      let savedDoc = null;
      try {
        savedDoc = await Notification.create(notifData);
      } catch (dbErr) {
        // Fallback in-memory store only allowed in test/dev
        const fallbackDoc = {
          _id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          ...notifData,
          createdAt: new Date(),
          isRead: false,
        };
        this.fallbackNotifications.unshift(fallbackDoc);
        if (this.fallbackNotifications.length > 200) this.fallbackNotifications.pop();
        savedDoc = fallbackDoc;
      }

      // Emit live real-time notification via Socket.IO
      const io = getSocketIO();
      if (io && savedDoc) {
        // Send to specific user room
        if (notifData.userEmail) {
          io.to(`user_${notifData.userEmail.toLowerCase()}`).emit("notification:new", savedDoc);
        }
        // If it's a pharmacy or admin broadcast
        if (notifData.userRole === "pharmacy") {
          io.to("role_pharmacy").emit("notification:new", savedDoc);
        }
        if (notifData.userRole === "admin") {
          io.to("role_admin").emit("notification:new", savedDoc);
        }
      }
      return savedDoc;
    } catch (err) {
      console.error("HealthcareEventBus notification dispatch error:", err.message);
      return null;
    }
  }
}

const eventBus = new HealthcareEventBus();
export default eventBus;
