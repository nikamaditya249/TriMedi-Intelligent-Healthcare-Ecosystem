/**
 * Medication Service — TriMedi Intelligent Healthcare Ecosystem
 * Handles Medication normalization, dose schedules, adherence calculation, and refill intelligence
 */

import Medication from "../models/Medication.js";
import Prescription from "../models/Prescription.js";
import Order from "../models/Order.js";
import { getSocketIO } from "./socketService.js";
import eventBus from "./eventBus.js";
import mongoose from "mongoose";

// In-memory fallback medications store for offline resilience
export const fallbackMedications = [
  {
    _id: "med-101",
    patientEmail: "aditya@trimedi.health",
    patientName: "Aditya Nikam",
    prescriptionId: "demo_rx_atorvastatin",
    doctorName: "Dr. Sarah Jenkins, MD",
    medicationName: "Atorvastatin",
    normalizedMedicationName: "atorvastatin",
    strength: "20mg",
    dosage: "1 Tablet",
    frequency: "Once daily (Night)",
    route: "Oral",
    durationDays: 30,
    prescribedQuantity: 30,
    remainingQuantity: 26,
    instructions: "Take 1 tablet after dinner with water",
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    status: "active",
    category: "Cardiovascular",
    scheduleSlots: [
      { slot: "night", time: "09:00 PM", dose: "1 Tab (20mg)" },
    ],
    adherence: {
      totalScheduled: 10,
      totalTaken: 9,
      totalMissed: 1,
      totalSkipped: 0,
      adherencePercentage: 90,
      lastRecordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    doseLogs: [
      { date: new Date().toISOString().split("T")[0], timeSlot: "night", status: "UPCOMING", scheduledTime: "09:00 PM" },
    ],
    refillInfo: {
      estimatedDepletionDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      refillDue: true,
      lastReminderSentAt: null,
      reminderCount: 0,
    },
  },
  {
    _id: "med-102",
    patientEmail: "aditya@trimedi.health",
    patientName: "Aditya Nikam",
    prescriptionId: "demo_rx_atorvastatin",
    doctorName: "Dr. Sarah Jenkins, MD",
    medicationName: "Telmisartan",
    normalizedMedicationName: "telmisartan",
    strength: "40mg",
    dosage: "1 Tablet",
    frequency: "Once daily (Morning)",
    route: "Oral",
    durationDays: 30,
    prescribedQuantity: 30,
    remainingQuantity: 28,
    instructions: "Take with breakfast",
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    status: "active",
    category: "Hypertension",
    scheduleSlots: [
      { slot: "morning", time: "08:30 AM", dose: "1 Tab (40mg)" },
    ],
    adherence: {
      totalScheduled: 10,
      totalTaken: 10,
      totalMissed: 0,
      totalSkipped: 0,
      adherencePercentage: 100,
      lastRecordedAt: new Date(),
    },
    doseLogs: [
      { date: new Date().toISOString().split("T")[0], timeSlot: "morning", status: "TAKEN", scheduledTime: "08:30 AM", recordedAt: new Date() },
    ],
    refillInfo: {
      estimatedDepletionDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      refillDue: false,
      lastReminderSentAt: null,
      reminderCount: 0,
    },
  },
];

/**
 * Helper to determine default schedule slots from frequency string
 */
const deriveScheduleSlotsFromFrequency = (frequency = "") => {
  const lower = frequency.toLowerCase();
  const slots = [];

  if (lower.includes("twice") || lower.includes("bid") || lower.includes("2 times")) {
    slots.push({ slot: "morning", time: "08:00 AM", dose: "1 Dose" });
    slots.push({ slot: "night", time: "08:00 PM", dose: "1 Dose" });
  } else if (lower.includes("3 times") || lower.includes("tid") || lower.includes("thrice")) {
    slots.push({ slot: "morning", time: "08:00 AM", dose: "1 Dose" });
    slots.push({ slot: "afternoon", time: "01:00 PM", dose: "1 Dose" });
    slots.push({ slot: "night", time: "08:00 PM", dose: "1 Dose" });
  } else if (lower.includes("night") || lower.includes("nocte") || lower.includes("bedtime")) {
    slots.push({ slot: "night", time: "09:00 PM", dose: "1 Dose" });
  } else if (lower.includes("evening")) {
    slots.push({ slot: "evening", time: "06:00 PM", dose: "1 Dose" });
  } else {
    // Default morning
    slots.push({ slot: "morning", time: "08:30 AM", dose: "1 Dose" });
  }

  return slots;
};

export class MedicationService {
  /**
   * Deterministically calculate estimated supply depletion date
   */
  calculateSupplyDepletionDate(startDate = new Date(), quantity = 30, frequency = "Once daily") {
    const start = startDate ? new Date(startDate) : new Date();
    const cleanQty = Number(quantity) > 0 ? Number(quantity) : 30;
    const lowerFreq = (frequency || "Once daily").toLowerCase();

    let dosesPerDay = 1;
    if (lowerFreq.includes("twice") || lowerFreq.includes("bid") || lowerFreq.includes("2 times")) {
      dosesPerDay = 2;
    } else if (lowerFreq.includes("thrice") || lowerFreq.includes("tid") || lowerFreq.includes("3 times")) {
      dosesPerDay = 3;
    } else if (lowerFreq.includes("4 times") || lowerFreq.includes("qid")) {
      dosesPerDay = 4;
    }

    const daysOfSupply = Math.ceil(cleanQty / dosesPerDay);
    return new Date(start.getTime() + daysOfSupply * 24 * 60 * 60 * 1000);
  }

  /**
   * Normalize and create Medication records when a Prescription is approved
   */
  async syncMedicationsFromPrescription(prescription) {
    if (!prescription) return [];
    const items = prescription.items || prescription.medicines || [];
    const createdMedications = [];

    const pEmail = (prescription.patientEmail || "").toLowerCase();
    const dName = prescription.doctorName || "Dr. Sarah Jenkins, MD";

    for (const item of items) {
      const medName = item.medicineName || item.name;
      if (!medName) continue;

      const duration = Number(item.durationDays) || parseInt(item.duration?.split(" ")[0]) || 30;
      const quantity = Number(item.quantityPrescribed) || Number(item.quantity) || duration;
      const freq = item.frequency || "Once daily";
      const slots = deriveScheduleSlotsFromFrequency(freq);

      const medPayload = {
        patientEmail: pEmail,
        patientName: prescription.patientName || "",
        prescriptionId: prescription._id,
        doctorName: dName,
        medicationName: medName,
        normalizedMedicationName: medName.toLowerCase().trim(),
        strength: item.dosage || "",
        dosage: item.dosage || "1 Tablet",
        frequency: freq,
        route: "Oral",
        durationDays: duration,
        prescribedQuantity: quantity,
        remainingQuantity: quantity,
        instructions: item.instructions || "",
        startDate: new Date(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        status: "active",
        scheduleSlots: slots,
        adherence: {
          totalScheduled: 1,
          totalTaken: 0,
          totalMissed: 0,
          totalSkipped: 0,
          adherencePercentage: 100,
        },
        doseLogs: [
          {
            date: new Date().toISOString().split("T")[0],
            timeSlot: slots[0]?.slot || "morning",
            status: "UPCOMING",
            scheduledTime: slots[0]?.time || "08:00 AM",
          },
        ],
        refillInfo: {
          estimatedDepletionDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
          refillDue: false,
          lastReminderSentAt: null,
          reminderCount: 0,
        },
        source: prescription.aiExtracted ? "AI_OCR_EXTRACTION" : "PRESCRIPTION",
      };

      if (mongoose.connection.readyState === 1) {
        const created = await Medication.create(medPayload);
        createdMedications.push(created);
      } else {
        const fallbackMed = {
          _id: "med-" + Math.floor(1000 + Math.random() * 9000),
          ...medPayload,
          createdAt: new Date(),
        };
        fallbackMedications.unshift(fallbackMed);
        createdMedications.push(fallbackMed);
      }
    }

    return createdMedications;
  }

  /**
   * Get active and historical medications for a patient
   */
  async getPatientMedications(patientEmail, statusFilter = null) {
    const cleanEmail = (patientEmail || "").toLowerCase();
    const query = { patientEmail: cleanEmail };
    if (statusFilter) query.status = statusFilter;

    if (mongoose.connection.readyState === 1) {
      return Medication.find(query).sort({ createdAt: -1 });
    }

    let meds = fallbackMedications.filter((m) => {
      const mEmail = (m.patientEmail || "").toLowerCase();
      return (
        mEmail === cleanEmail ||
        (cleanEmail === "patient@trimedi.com" && mEmail === "aditya@trimedi.health") ||
        (cleanEmail === "aditya@trimedi.health" && mEmail === "patient@trimedi.com")
      );
    });
    if (statusFilter) {
      meds = meds.filter((m) => m.status === statusFilter);
    }
    return meds;
  }

  /**
   * Get today's scheduled dose items for patient
   */
  async getTodaySchedule(patientEmail) {
    const today = new Date().toISOString().split("T")[0];
    const medications = await this.getPatientMedications(patientEmail, "active");
    const scheduleItems = [];

    medications.forEach((med) => {
      const slots = med.scheduleSlots || [{ slot: "morning", time: "08:00 AM", dose: "1 Tab" }];

      slots.forEach((s) => {
        const slotKey = (s.slot || "morning").toLowerCase();
        // Find existing log for today + slot
        const existingLog = (med.doseLogs || []).find(
          (l) => l.date === today && (l.timeSlot || "").toLowerCase() === slotKey
        );

        scheduleItems.push({
          medicationId: med._id,
          prescriptionId: med.prescriptionId,
          medicationName: med.medicationName,
          dosage: med.strength || med.dosage,
          dose: s.dose || "1 Tab",
          instructions: med.instructions,
          slot: slotKey,
          timeSlot: slotKey,
          scheduledTime: s.time || "08:00 AM",
          date: today,
          status: existingLog ? existingLog.status : "UPCOMING",
          recordedAt: existingLog?.recordedAt || null,
          refillDue: Boolean(med.refillInfo?.refillDue),
        });
      });
    });

    // Calculate today's adherence metrics
    let takenToday = 0;
    let missedToday = 0;
    let skippedToday = 0;
    const scheduledToday = scheduleItems.length;

    scheduleItems.forEach((item) => {
      if (item.status === "TAKEN") takenToday++;
      else if (item.status === "MISSED") missedToday++;
      else if (item.status === "SKIPPED") skippedToday++;
    });

    const evaluatedToday = takenToday + missedToday + skippedToday;
    const adherenceRateToday = evaluatedToday > 0 ? Math.round((takenToday / evaluatedToday) * 100) : 100;

    return {
      date: today,
      count: scheduleItems.length,
      schedule: scheduleItems,
      adherence: {
        totalScheduled: scheduledToday,
        totalTaken: takenToday,
        totalMissed: missedToday,
        totalSkipped: skippedToday,
        adherencePercentage: adherenceRateToday,
        statement: `Medication adherence: ${adherenceRateToday}% based on recorded doses.`,
      },
    };
  }

  /**
   * Record dose event (TAKEN, MISSED, SKIPPED) and calculate adherence rate
   */
  async recordDose({ medicationId, date, timeSlot, status, actorEmail, actorRole, notes = "", reason = "" }) {
    const validStatuses = ["TAKEN", "MISSED", "SKIPPED"];
    if (!validStatuses.includes(status)) {
      const err = new Error(`Invalid dose status '${status}'. Must be one of: ${validStatuses.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    if (!timeSlot) {
      const err = new Error("Dose status and timeSlot are required.");
      err.statusCode = 400;
      throw err;
    }

    const today = date || new Date().toISOString().split("T")[0];
    const recordTime = new Date();
    const normalizedSlot = (timeSlot || "morning").toLowerCase().trim();
    const actor = (actorEmail || "patient@trimedi.com").toLowerCase().trim();

    let med = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(medicationId)) {
      med = await Medication.findById(medicationId);
    } else if (mongoose.connection.readyState === 1) {
      med = await Medication.findOne({ _id: medicationId });
    }
    if (!med) {
      med = fallbackMedications.find((m) => String(m._id) === String(medicationId));
    }

    if (!med) {
      const err = new Error("Medication record not found.");
      err.statusCode = 404;
      throw err;
    }

    // Role & Ownership IDOR Guard
    if (actorRole === "doctor" || actorRole === "reception" || actorRole === "pharmacy") {
      const err = new Error("Forbidden: Clinical medication doses cannot be recorded by doctor, reception, or pharmacy roles.");
      err.statusCode = 403;
      throw err;
    }

    if (actorRole === "patient" && med.patientEmail && med.patientEmail.toLowerCase() !== actor) {
      const err = new Error("Forbidden: You are not authorized to modify another patient's medication regimen.");
      err.statusCode = 403;
      throw err;
    }

    // 1. Idempotency & Conflict Resolution
    if (!med.doseLogs) med.doseLogs = [];
    const logIndex = med.doseLogs.findIndex(
      (l) => l.date === today && (l.timeSlot || "").toLowerCase() === normalizedSlot
    );

    let isDuplicate = false;

    if (logIndex !== -1) {
      const currentLog = med.doseLogs[logIndex];

      // Case A: Idempotent duplicate submission (e.g. double click or retry)
      if (currentLog.status === status) {
        isDuplicate = true;
      } else if (currentLog.status === "TAKEN" && status !== "TAKEN") {
        // Case B: Conflict: Once TAKEN, cannot transition to SKIPPED or MISSED
        const conflictErr = new Error(
          `Conflict: Dose on ${today} (${normalizedSlot}) was already recorded as TAKEN and cannot be marked as ${status}.`
        );
        conflictErr.statusCode = 409;
        throw conflictErr;
      } else {
        // Case C: Transitioning from UPCOMING/SKIPPED/MISSED to TAKEN or between SKIPPED/MISSED
        const prevStatus = currentLog.status;
        currentLog.status = status;
        currentLog.recordedAt = recordTime;
        currentLog.recordedBy = actor;
        currentLog.notes = notes || reason || currentLog.notes || "";

        // Adjust remaining quantity if transition is to TAKEN
        if (status === "TAKEN" && prevStatus !== "TAKEN" && med.remainingQuantity > 0) {
          med.remainingQuantity = Math.max(0, med.remainingQuantity - 1);
        }
      }
    } else {
      // New dose log entry
      med.doseLogs.push({
        date: today,
        timeSlot: normalizedSlot,
        status,
        scheduledTime: "08:00 AM",
        recordedAt: recordTime,
        recordedBy: actor,
        notes: notes || reason || "",
      });

      if (status === "TAKEN" && med.remainingQuantity > 0) {
        med.remainingQuantity = Math.max(0, med.remainingQuantity - 1);
      }
    }

    // 2. Recalculate adherence metrics neutrally
    let takenCount = 0;
    let missedCount = 0;
    let skippedCount = 0;

    med.doseLogs.forEach((l) => {
      if (l.status === "TAKEN") takenCount++;
      else if (l.status === "MISSED") missedCount++;
      else if (l.status === "SKIPPED") skippedCount++;
    });

    const totalEvaluated = takenCount + missedCount + skippedCount;
    const adherenceRate = totalEvaluated > 0 ? Math.round((takenCount / totalEvaluated) * 100) : 100;
    const adherenceStatement = `Medication adherence: ${adherenceRate}% based on recorded doses.`;

    med.adherence = {
      totalScheduled: Math.max(totalEvaluated, 1),
      totalTaken: takenCount,
      totalMissed: missedCount,
      totalSkipped: skippedCount,
      adherencePercentage: adherenceRate,
      statement: adherenceStatement,
      lastRecordedAt: recordTime,
    };

    // 3. Update refill status if supply is running low (<= 5 doses remaining)
    if (med.remainingQuantity <= 5) {
      if (!med.refillInfo) med.refillInfo = {};
      med.refillInfo.refillDue = true;
      med.refillInfo.estimatedDepletionDate = new Date(Date.now() + med.remainingQuantity * 24 * 60 * 60 * 1000);
    }

    if (mongoose.connection.readyState === 1 && typeof med.save === "function") {
      await med.save();
    }

    // 4. Realtime broadcast via Socket.IO
    try {
      const io = getSocketIO();
      if (io) {
        const payload = {
          medicationId: med._id,
          medicationName: med.medicationName,
          patientEmail: med.patientEmail,
          status,
          date: today,
          timeSlot: normalizedSlot,
          adherencePercentage: adherenceRate,
          remainingQuantity: med.remainingQuantity,
          refillDue: Boolean(med.refillInfo?.refillDue),
        };

        // Emit specific dose outcome event
        io.to(`user_${med.patientEmail.toLowerCase()}`).emit(`medication:dose:${status.toLowerCase()}`, payload);
        io.to(`user:${med.patientEmail.toLowerCase()}`).emit(`medication:dose:${status.toLowerCase()}`, payload);

        // Emit adherence updated event to patient and doctor rooms
        io.to(`user_${med.patientEmail.toLowerCase()}`).emit("medication:adherence:updated", payload);
        io.to(`user:${med.patientEmail.toLowerCase()}`).emit("medication:adherence:updated", payload);
        io.to(`user_${med.patientEmail.toLowerCase()}`).emit("medication:adherence_updated", payload);
        io.to(`user:${med.patientEmail.toLowerCase()}`).emit("medication:adherence_updated", payload);
        io.to("role_doctor").emit("medication:adherence_updated", payload);
        io.to("role:doctor").emit("medication:adherence_updated", payload);

        // Emit refill alert if threshold reached
        if (med.refillInfo?.refillDue) {
          io.to(`user_${med.patientEmail.toLowerCase()}`).emit("medication:refill:alert", payload);
          io.to(`user:${med.patientEmail.toLowerCase()}`).emit("medication:refill:alert", payload);
        }
      }
    } catch (sockErr) {
      // Non-blocking socket emission
    }

    return {
      success: true,
      isDuplicate,
      message: isDuplicate
        ? `Dose was already recorded as ${status}.`
        : `Dose recorded as ${status}. Current calculated adherence is ${adherenceRate}%.`,
      medication: med,
      adherence: med.adherence,
      adherenceSummary: {
        adherencePercentage: adherenceRate,
        statement: adherenceStatement,
        taken: takenCount,
        missed: missedCount,
        skipped: skippedCount,
      },
    };
  }

  /**
   * Medication timeline for longitudinal care history
   */
  async getMedicationTimeline(patientEmail) {
    const medications = await this.getPatientMedications(patientEmail);
    const events = [];

    medications.forEach((m) => {
      // 1. Started
      events.push({
        type: "MEDICATION_PRESCRIBED",
        date: m.startDate || m.createdAt,
        title: `${m.medicationName} Prescribed`,
        description: `Prescribed for ${m.durationDays} days (${m.frequency}). Attending: ${m.doctorName || "Doctor"}.`,
        category: "prescription",
        medicationId: m._id,
      });

      // 2. Doses recorded
      (m.doseLogs || []).forEach((l) => {
        if (l.recordedAt) {
          events.push({
            type: `DOSE_${l.status}`,
            date: l.recordedAt,
            title: `Dose ${l.status}: ${m.medicationName}`,
            description: `Scheduled slot: ${l.timeSlot} on ${l.date}.`,
            category: "adherence",
            medicationId: m._id,
          });
        }
      });

      // 3. Refill due
      if (m.refillInfo?.refillDue) {
        events.push({
          type: "REFILL_DUE",
          date: m.refillInfo.estimatedDepletionDate || new Date(),
          title: `Refill Approaching: ${m.medicationName}`,
          description: `Estimated supply depletion around ${new Date(m.refillInfo.estimatedDepletionDate || Date.now()).toLocaleDateString()}. Order Again available.`,
          category: "refill",
          medicationId: m._id,
        });
      }
    });

    // Chronological order descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }
}

export default new MedicationService();
