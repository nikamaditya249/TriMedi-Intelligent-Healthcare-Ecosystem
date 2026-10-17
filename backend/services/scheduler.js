import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import Medication from "../models/Medication.js";
import eventBus from "./eventBus.js";
import mongoose from "mongoose";

// Fast in-memory deduplication cache
const processedReminders = new Set();
const processedRefillAlerts = new Set();

/**
 * Check if notification was already sent (Persistent DB check + Memory check)
 */
const wasNotificationAlreadySent = async ({ userEmail, type, relatedEntityType, relatedEntityId, withinHours = 48 }) => {
  const memKey = `${type}_${relatedEntityId}_${userEmail}`;
  if (processedReminders.has(memKey) || processedRefillAlerts.has(memKey)) {
    return true;
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const sinceDate = new Date(Date.now() - withinHours * 60 * 60 * 1000);
      const existing = await Notification.findOne({
        userEmail: userEmail.toLowerCase(),
        type,
        relatedEntityType,
        relatedEntityId: relatedEntityId?.toString(),
        createdAt: { $gte: sinceDate },
      }).lean();

      if (existing) {
        processedReminders.add(memKey);
        return true;
      }
    } catch (e) {
      console.warn("Deduplication check error:", e.message);
    }
  }

  return false;
};

export const startHealthcareScheduler = () => {
  console.log("⏰ Starting TriMedi Idempotent Healthcare Scheduler (60s database-backed intervals)...");

  const runScheduledChecks = async () => {
    try {
      const now = new Date();

      // 1. APPOINTMENT REMINDERS (24 Hours & 1 Hour Before)
      try {
        let upcomingAppointments = [];
        if (mongoose.connection.readyState === 1) {
          upcomingAppointments = await Appointment.find({
            status: "confirmed",
          }).limit(50).lean();
        }

        for (const appt of upcomingAppointments) {
          if (!appt.date || !appt.time) continue;

          // Parse appointment date & time
          const apptDateTime = new Date(`${appt.date}T${appt.time}:00`);
          if (isNaN(apptDateTime.getTime())) continue;

          const timeDiffMs = apptDateTime.getTime() - now.getTime();
          const hoursRemaining = timeDiffMs / (1000 * 60 * 60);

          // 24 Hour Reminder Window (Between 23h and 25h before)
          if (hoursRemaining > 23 && hoursRemaining <= 25) {
            const alreadySent = await wasNotificationAlreadySent({
              userEmail: appt.patientEmail,
              type: "APPOINTMENT_REMINDER_24H",
              relatedEntityType: "appointment",
              relatedEntityId: appt._id,
              withinHours: 48,
            });

            if (!alreadySent) {
              const memKey = `APPOINTMENT_REMINDER_24H_${appt._id}_${appt.patientEmail}`;
              processedReminders.add(memKey);

              await eventBus.createNotification({
                userEmail: appt.patientEmail,
                userRole: "patient",
                type: "APPOINTMENT_REMINDER_24H",
                title: "Upcoming Appointment Tomorrow",
                message: `Reminder: You have an appointment with Dr. ${appt.doctorName || "your doctor"} tomorrow at ${appt.time}.`,
                category: "appointment",
                priority: "medium",
                relatedEntityType: "appointment",
                relatedEntityId: appt._id.toString(),
                linkUrl: "/app/patient/dashboard",
              });
              console.log(`⏰ Sent 24h appointment reminder to ${appt.patientEmail} for appointment ${appt._id}`);
            }
          }

          // 1 Hour Reminder Window (Between 0h and 1.2h before)
          if (hoursRemaining > 0 && hoursRemaining <= 1.2) {
            const alreadySent = await wasNotificationAlreadySent({
              userEmail: appt.patientEmail,
              type: "APPOINTMENT_REMINDER_1H",
              relatedEntityType: "appointment",
              relatedEntityId: appt._id,
              withinHours: 6,
            });

            if (!alreadySent) {
              const memKey = `APPOINTMENT_REMINDER_1H_${appt._id}_${appt.patientEmail}`;
              processedReminders.add(memKey);

              await eventBus.createNotification({
                userEmail: appt.patientEmail,
                userRole: "patient",
                type: "APPOINTMENT_REMINDER_1H",
                title: "Appointment Starts in 1 Hour",
                message: `Your consultation with Dr. ${appt.doctorName || "your doctor"} begins in less than an hour (${appt.time}).`,
                category: "appointment",
                priority: "urgent",
                relatedEntityType: "appointment",
                relatedEntityId: appt._id.toString(),
                linkUrl: "/app/patient/dashboard",
              });
              console.log(`⏰ Sent 1h appointment reminder to ${appt.patientEmail} for appointment ${appt._id}`);
            }
          }
        }
      } catch (apptErr) {
        console.warn("Scheduler appointment check notice:", apptErr.message);
      }

      // 2. MEDICATION SUPPLY & REFILL GAP CHECKS (Deterministic Calculation)
      try {
        let activePrescriptions = [];
        if (mongoose.connection.readyState === 1) {
          activePrescriptions = await Prescription.find({ status: "active" }).limit(50).lean();
        }

        for (const rx of activePrescriptions) {
          if (!rx.medicines || rx.medicines.length === 0) continue;

          // Get completed orders for this patient/prescription
          const patientOrders = await Order.find({
            patientEmail: rx.patientEmail,
            status: { $in: ["Processing", "Dispensed", "Shipped", "Delivered"] },
          }).lean();

          for (const med of rx.medicines) {
            const rxDuration = parseInt(med.duration?.split(" ")[0]) || 30; // default 30 days
            
            // Calculate total units purchased
            let totalUnitsPurchased = 0;
            let latestOrderDate = rx.createdAt || new Date();

            patientOrders.forEach((ord) => {
              const matchedItem = ord.items?.find((item) =>
                item.name?.toLowerCase().includes(med.name?.toLowerCase()) ||
                med.name?.toLowerCase().includes(item.name?.toLowerCase())
              );
              if (matchedItem) {
                totalUnitsPurchased += (matchedItem.quantity || matchedItem.qty || 1);
                if (new Date(ord.createdAt) > new Date(latestOrderDate)) {
                  latestOrderDate = ord.createdAt;
                }
              }
            });

            if (totalUnitsPurchased > 0) {
              const daysSupply = totalUnitsPurchased; // 1 unit ~ 1 day supply
              const startDate = new Date(latestOrderDate);
              const daysSinceOrder = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const daysRemaining = Math.max(0, daysSupply - daysSinceOrder);

              // If supply is <= 3 days and there is a shortage vs prescribed duration
              if (daysRemaining <= 3 && daysSupply < rxDuration) {
                const alreadySent = await wasNotificationAlreadySent({
                  userEmail: rx.patientEmail,
                  type: "REFILL_RECOMMENDED",
                  relatedEntityType: "prescription",
                  relatedEntityId: rx._id,
                  withinHours: 168, // 7 days window
                });

                if (!alreadySent) {
                  const memKey = `REFILL_RECOMMENDED_${rx._id}_${rx.patientEmail}`;
                  processedRefillAlerts.add(memKey);

                  eventBus.emit("REFILL_RECOMMENDED", {
                    patientEmail: rx.patientEmail,
                    medicineName: med.name,
                    daysRemaining,
                    prescriptionId: rx._id.toString(),
                    prescribedDuration: rxDuration,
                    purchasedSupply: daysSupply,
                  });
                  console.log(`⏰ Triggered refill recommendation for ${rx.patientEmail} on ${med.name}`);
                }
              }
            }
          }
        }
      } catch (rxErr) {
        console.warn("Scheduler refill check notice:", rxErr.message);
      }

      // 3. NORMALIZED MEDICATION REFILL INTELLIGENCE (Idempotent Refill Alerts)
      try {
        let activeMedications = [];
        if (mongoose.connection.readyState === 1) {
          activeMedications = await Medication.find({ status: "active" }).limit(100).lean();
        }

        for (const med of activeMedications) {
          const depletionDate = med.refillInfo?.estimatedDepletionDate ? new Date(med.refillInfo.estimatedDepletionDate) : null;
          if (!depletionDate || isNaN(depletionDate.getTime())) continue;

          const daysRemaining = Math.ceil((depletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // If supply depleted or <= 5 days remaining
          if (daysRemaining <= 5) {
            const notifType = daysRemaining <= 1 ? "MEDICATION_REFILL_DUE" : "MEDICATION_REFILL_APPROACHING";
            const alreadySent = await wasNotificationAlreadySent({
              userEmail: med.patientEmail,
              type: notifType,
              relatedEntityType: "medication",
              relatedEntityId: med._id,
              withinHours: 120, // 5 days idempotency window
            });

            if (!alreadySent) {
              const memKey = `${notifType}_${med._id}_${med.patientEmail}`;
              processedRefillAlerts.add(memKey);

              eventBus.emit(notifType, {
                patientEmail: med.patientEmail,
                medicineName: med.medicationName,
                daysRemaining: Math.max(0, daysRemaining),
                medicationId: med._id.toString(),
                prescribedQuantity: med.prescribedQuantity,
                remainingQuantity: med.remainingQuantity,
              });

              console.log(`⏰ Triggered ${notifType} for ${med.patientEmail} on ${med.medicationName}`);

              // Update last reminder timestamp in DB
              if (mongoose.connection.readyState === 1) {
                await Medication.findByIdAndUpdate(med._id, {
                  "refillInfo.refillDue": true,
                  "refillInfo.lastReminderSentAt": now,
                  $inc: { "refillInfo.reminderCount": 1 },
                });
              }
            }
          }
        }
      } catch (medErr) {
        console.warn("Scheduler medication refill check notice:", medErr.message);
      }

      // 4. AUTOMATED PAYMENT & CHECKOUT RECONCILIATION (Every 5 minutes)
      if (now.getMinutes() % 5 === 0) {
        try {
          const { ReconciliationService } = await import("./reconciliationService.js");
          await ReconciliationService.runBatchReconciliation({ olderThanMinutes: 15, limit: 20 });
        } catch (recErr) {
          // Silent failure in scheduler to avoid interrupting clinical reminders
        }
      }
    } catch (err) {
      console.error("Scheduler run error:", err.message);
    }
  };

  // Run initial check after 5s, then every 60s
  setTimeout(runScheduledChecks, 5000);
  const intervalId = setInterval(runScheduledChecks, 60000);

  return () => clearInterval(intervalId);
};
