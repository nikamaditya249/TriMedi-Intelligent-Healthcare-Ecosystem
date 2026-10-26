/**
 * Medication Routes — TriMedi Intelligent Healthcare Ecosystem
 * Endpoints for Patient Medications, Daily Dose Schedules, Adherence Logging, and Timelines
 */

import express from "express";
import medicationService from "../services/medicationService.js";
import medicationSafetyService from "../services/medicationSafetyService.js";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import { logClinicalAudit } from "../services/auditService.js";
import { requireDatabase } from "../middleware/dbGuard.js";

const router = express.Router();

/**
 * GET /api/medications
 * Get all active or historical medications for patient with strict IDOR verification
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const callerEmail = req.user?.email || "patient@trimedi.com";
    const callerRole = req.user?.role || "patient";
    const requestedEmail = req.query.patientEmail || callerEmail;
    const status = req.query.status || null;

    // IDOR Protection: Patient can only view their own medications
    if (callerRole === "patient" && requestedEmail.toLowerCase() !== callerEmail.toLowerCase()) {
      await logClinicalAudit({
        req,
        action: "ACCESS_DENIED_IDOR",
        resourceType: "medication",
        resourceId: requestedEmail,
        status: "DENIED",
        details: { attempt: "cross_patient_medication_query" },
      });
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view another patient's medication regimen.",
      });
    }

    // Least Privilege: Reception and Pharmacy are blocked from private clinical medication regimens
    if (callerRole === "reception" || callerRole === "pharmacy") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Clinical medication regimens require patient ownership or doctor clinical authorization.",
      });
    }

    const medications = await medicationService.getPatientMedications(requestedEmail, status);
    res.json({ success: true, count: medications.length, medications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/medications/schedule/today
 * Today's dose schedule for patient
 */
router.get("/schedule/today", optionalAuth, async (req, res) => {
  try {
    const callerEmail = req.user?.email || "patient@trimedi.com";
    const callerRole = req.user?.role || "patient";
    const requestedEmail = req.query.patientEmail || callerEmail;

    if (callerRole === "patient" && requestedEmail.toLowerCase() !== callerEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot access another patient's medication schedule.",
      });
    }

    if (callerRole === "reception" || callerRole === "pharmacy") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access restricted by least privilege.",
      });
    }

    const scheduleData = await medicationService.getTodaySchedule(requestedEmail);
    res.json({
      success: true,
      count: scheduleData.schedule.length,
      date: scheduleData.date,
      schedule: scheduleData.schedule,
      adherence: scheduleData.adherence,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/medications/:id/dose
 * Patient records dose outcome (TAKEN, MISSED, SKIPPED)
 */
router.post("/:id/dose", requireDatabase, optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, timeSlot, slot, notes, reason } = req.body;
    const slotKey = timeSlot || slot;
    const actorEmail = req.user?.email || "patient@trimedi.com";
    const actorRole = req.user?.role || "patient";

    if (!status || !slotKey) {
      return res.status(400).json({
        success: false,
        message: "Dose status ('TAKEN', 'MISSED', 'SKIPPED') and timeSlot are required.",
      });
    }

    const result = await medicationService.recordDose({
      medicationId: id,
      date,
      timeSlot: slotKey,
      status,
      actorEmail,
      actorRole,
      notes,
      reason,
    });

    await logClinicalAudit({
      req,
      action: `MEDICATION_DOSE_${status}`,
      resourceType: "medication",
      resourceId: String(id),
      details: {
        timeSlot: slotKey,
        date,
        status,
        isDuplicate: result.isDuplicate,
        adherence: result.adherenceSummary,
      },
    });

    res.json(result);
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ success: false, message: err.message });
    }
    if (err.statusCode === 403 || err.message?.includes("Forbidden") || err.message?.includes("IDOR")) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.statusCode === 404 || err.message?.includes("not found")) {
      return res.status(404).json({ success: false, message: err.message });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/medications/timeline
 * Chronological care history of prescriptions, doses, and refill events
 */
router.get("/timeline", optionalAuth, async (req, res) => {
  try {
    const callerEmail = req.user?.email || "patient@trimedi.com";
    const requestedEmail = req.query.patientEmail || callerEmail;

    if (req.user && req.user.role === "patient" && requestedEmail.toLowerCase() !== callerEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot access another patient's medication timeline.",
      });
    }

    const timeline = await medicationService.getMedicationTimeline(requestedEmail);
    res.json({ success: true, count: timeline.length, timeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/medications/safety-check
 * Check drug-drug interactions, allergy conflicts, and duplicates across active medications
 */
router.post("/safety-check", optionalAuth, async (req, res) => {
  try {
    const { medications = [], patientAllergies = [] } = req.body;

    const safetyResult = medicationSafetyService.performComprehensiveSafetyCheck({
      medications,
      patientAllergies,
    });

    res.json(safetyResult);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
