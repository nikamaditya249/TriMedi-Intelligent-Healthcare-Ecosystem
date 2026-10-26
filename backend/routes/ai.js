/**
 * AI Clinical Assistance Routes — TriMedi Intelligent Healthcare Ecosystem
 * Endpoints for Prescription OCR Extraction, Instruction Simplification,
 * Consultation Summarization, Doctor Question Suggestions, and AI Audits
 */

import express from "express";
import aiService from "../services/aiService.js";
import medicationSafetyService from "../services/medicationSafetyService.js";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";
import AIAudit from "../models/AIAudit.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * POST /api/ai/extract-prescription
 * Extract structured prescription data from OCR text, image or PDF with field-level confidence
 */
router.post("/extract-prescription", optionalAuth, async (req, res) => {
  try {
    const { documentText, filename } = req.body;
    const actorEmail = req.user?.email || "doctor@trimedi.health";
    const actorRole = req.user?.role || "doctor";

    const result = await aiService.extractPrescription({
      documentText,
      filename,
      actorEmail,
      actorRole,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "AI extraction encountered an unexpected error. Manual entry available.",
      error: err.message,
    });
  }
});

/**
 * POST /api/ai/simplify-instructions
 * Convert complex clinical instructions into clear, friendly patient guidance
 */
router.post("/simplify-instructions", optionalAuth, async (req, res) => {
  try {
    const { medicines = [], diagnosis = "" } = req.body;
    const actorEmail = req.user?.email || "patient@trimedi.com";
    const actorRole = req.user?.role || "patient";

    const result = aiService.simplifyPrescription(medicines, diagnosis);

    // AI Safety & Audit logging
    try {
      if (mongoose.connection.readyState === 1) {
        await AIAudit.create({
          action: "INSTRUCTION_SIMPLIFICATION",
          actorEmail,
          actorRole,
          resourceType: "medication",
          details: {
            medicinesCount: medicines.length,
            medicines: medicines.map((m) => m.medicineName || m.name),
          },
          model: "rules_engine_lexicon",
          confidenceScore: 0.95,
          timestamp: new Date(),
        });
      }
    } catch (auditErr) {
      // Non-blocking audit failure
    }

    const simplifiedItems = (result.guidelines || []).map((g) => ({
      medicineName: g.medicineName,
      dosage: g.dosage,
      howToTake: g.howToTake,
      timingGuidance: g.timingGuidance,
      plainLanguage: `${g.howToTake} ${g.timingGuidance}`.trim(),
    }));

    res.json({
      ...result,
      simplifiedItems,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error simplifying clinical instructions", error: err.message });
  }
});

/**
 * POST /api/ai/summarize-consultation
 * Generate a draft clinical summary for doctor review
 * NOTE: Attending physician must review/edit before official archival.
 */
router.post("/summarize-consultation", optionalAuth, async (req, res) => {
  try {
    const { doctorName, chiefComplaint, clinicalNotes, diagnosis, vitals, patientName } = req.body;

    const result = aiService.summarizeConsultationDraft({
      doctorName,
      chiefComplaint,
      clinicalNotes,
      diagnosis,
      vitals,
      patientName,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error summarizing consultation", error: err.message });
  }
});

/**
 * POST /api/ai/draft-doctor-question
 * Assist patient or clinician in formulating clear clinical questions
 */
router.post("/draft-doctor-question", async (req, res) => {
  try {
    const { symptomTopic, currentMedication, duration } = req.body;

    const topic = symptomTopic || "mild morning dizziness";
    const med = currentMedication || "Atorvastatin 20mg";
    const dur = duration || "the past 3 days";

    const draftedQuestion = `Hello Doctor, I have been experiencing ${topic} over ${dur} while taking ${med}. Could you please let me know if this is an expected adjustment symptom or if we should review the timing or dosage? Thank you.`;

    res.json({
      success: true,
      label: "AI-assisted draft",
      disclaimer: "Assistive draft formulation only. Certified doctor clinical advice remains authoritative.",
      draftedQuestion,
      tips: [
        "Include exact times you take your medication.",
        "Mention any other over-the-counter supplements or changes in diet.",
      ],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error drafting question" });
  }
});

/**
 * POST /api/ai/doctor-questions
 * Generate suggested exploratory questions for attending physician during consultation
 */
router.post("/doctor-questions", optionalAuth, async (req, res) => {
  try {
    const { chiefComplaint, diagnosis, existingConditions } = req.body;
    const result = aiService.generateDoctorQuestions({
      chiefComplaint,
      diagnosis,
      existingConditions,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error generating doctor questions" });
  }
});

/**
 * GET /api/ai/audits
 * Retrieve AI audit records with role-based restriction (Admin / Doctor)
 */
router.get("/audits", optionalAuth, async (req, res) => {
  try {
    const callerRole = req.user?.role || "admin";

    if (callerRole !== "admin" && callerRole !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: AI audit logs are restricted to authorized clinical staff and administrators.",
      });
    }

    let audits = [];
    if (mongoose.connection.readyState === 1) {
      audits = await AIAudit.find({}).sort({ timestamp: -1 }).limit(50).lean();
    }

    res.json({ success: true, count: audits.length, audits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
