import express from "express";
import mongoose from "mongoose";
import Consent from "../models/Consent.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { logClinicalAudit } from "../services/auditService.js";

const router = express.Router();

export const fallbackConsents = [
  {
    _id: "cns_demo_01",
    userId: "demo_patient_1",
    userEmail: "aditya@trimedi.health",
    consentType: "CONSULTATION_DATA",
    purpose: "Storage and processing of clinical consultation notes by licensed medical doctors.",
    version: "2026.1",
    granted: true,
    grantedAt: new Date("2026-01-10"),
    revokedAt: null,
    source: "onboarding",
    policyVersion: "2026.1",
  },
  {
    _id: "cns_demo_02",
    userId: "demo_patient_1",
    userEmail: "aditya@trimedi.health",
    consentType: "PRESCRIPTION_PROCESSING",
    purpose: "Routing doctor-approved digital prescriptions to authorized retail pharmacies.",
    version: "2026.1",
    granted: true,
    grantedAt: new Date("2026-01-10"),
    revokedAt: null,
    source: "onboarding",
    policyVersion: "2026.1",
  },
  {
    _id: "cns_demo_03",
    userId: "demo_patient_1",
    userEmail: "aditya@trimedi.health",
    consentType: "AI_ASSISTANCE",
    purpose: "Assistive optical character recognition (OCR) parsing of uploaded prescription scans.",
    version: "2026.1",
    granted: true,
    grantedAt: new Date("2026-01-10"),
    revokedAt: null,
    source: "onboarding",
    policyVersion: "2026.1",
  },
  {
    _id: "cns_demo_04",
    userId: "demo_patient_1",
    userEmail: "aditya@trimedi.health",
    consentType: "NOTIFICATION_SMS",
    purpose: "SMS and WhatsApp refill reminders and clinic queue notifications.",
    version: "2026.1",
    granted: true,
    grantedAt: new Date("2026-01-10"),
    revokedAt: null,
    source: "onboarding",
    policyVersion: "2026.1",
  },
  {
    _id: "cns_demo_05",
    userId: "demo_patient_1",
    userEmail: "aditya@trimedi.health",
    consentType: "MARKETING",
    purpose: "Optional healthcare wellness newsletters and health tips.",
    version: "2026.1",
    granted: false,
    grantedAt: null,
    revokedAt: new Date("2026-01-10"),
    source: "settings",
    policyVersion: "2026.1",
  },
];

const VALID_CONSENTS = [
  "CONSULTATION_DATA",
  "MEDICAL_RECORD_STORAGE",
  "PRESCRIPTION_PROCESSING",
  "AI_ASSISTANCE",
  "NOTIFICATION_EMAIL",
  "NOTIFICATION_SMS",
  "MARKETING",
];

const MANDATORY_TREATMENT_CONSENTS = [
  "CONSULTATION_DATA",
  "MEDICAL_RECORD_STORAGE",
  "PRESCRIPTION_PROCESSING",
];

/**
 * GET /api/consent
 * Retrieve active versioned consents for the user
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const callerEmail = req.user.email.toLowerCase();
    const queryEmail = (req.query.email || callerEmail).toLowerCase();

    // IDOR Protection: Patient can only view their own consent records
    if (req.user.role === "patient" && queryEmail !== callerEmail) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to inspect another user's consent records.",
      });
    }

    let consents = [];
    if (mongoose.connection.readyState === 1) {
      consents = await Consent.find({ userEmail: queryEmail }).sort({ createdAt: -1 }).lean();
    } else {
      consents = fallbackConsents.filter(
        (c) => c.userEmail?.toLowerCase() === queryEmail || c.userEmail?.toLowerCase() === callerEmail
      );
    }

    res.json({
      success: true,
      userEmail: queryEmail,
      policyVersion: "2026.1",
      consents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/consent
 * Grant or update versioned consent
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { consentType, purpose, version = "2026.1", source = "portal" } = req.body;
    const user = req.user;

    if (!consentType || !VALID_CONSENTS.includes(consentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid consent type. Allowed: ${VALID_CONSENTS.join(", ")}`,
      });
    }

    const consentData = {
      userId: String(user._id),
      userEmail: user.email.toLowerCase(),
      consentType,
      purpose: purpose || `Granted consent for ${consentType}`,
      version,
      granted: true,
      grantedAt: new Date(),
      revokedAt: null,
      source,
      policyVersion: "2026.1",
      ipAddress: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "TriMedi Client",
    };

    let saved = null;
    if (mongoose.connection.readyState === 1) {
      saved = await Consent.findOneAndUpdate(
        { userEmail: user.email.toLowerCase(), consentType },
        { $set: consentData },
        { upsert: true, new: true }
      );
    } else {
      const idx = fallbackConsents.findIndex(
        (c) => c.userEmail?.toLowerCase() === user.email.toLowerCase() && c.consentType === consentType
      );
      if (idx !== -1) {
        fallbackConsents[idx] = { ...fallbackConsents[idx], ...consentData };
        saved = fallbackConsents[idx];
      } else {
        saved = { _id: "cns_" + Date.now(), ...consentData };
        fallbackConsents.push(saved);
      }
    }

    await logClinicalAudit({
      req,
      action: "CONSENT_GRANTED",
      resourceType: "consent",
      resourceId: consentType,
      details: { consentType, version, source },
    });

    res.json({
      success: true,
      message: `Consent granted for ${consentType}`,
      consent: saved,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/consent/revoke
 * Revoke optional consent (e.g. AI assistance, marketing, SMS notifications)
 */
router.post("/revoke", requireAuth, async (req, res) => {
  try {
    const { consentType, reason = "Withdrawn by user" } = req.body;
    const user = req.user;

    if (!consentType || !VALID_CONSENTS.includes(consentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid consent type. Allowed: ${VALID_CONSENTS.join(", ")}`,
      });
    }

    // Protection: Clinical treatment consent cannot be revoked mid-care without account closure
    if (MANDATORY_TREATMENT_CONSENTS.includes(consentType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MANDATORY_CONSENT_CANNOT_BE_REVOKED",
          message: `Consent for '${consentType}' is mandatory for clinical treatment and prescription operations. To delete your health records, submit an Account Deletion Request under Privacy Settings.`,
        },
      });
    }

    const revokeUpdate = {
      granted: false,
      revokedAt: new Date(),
    };

    let updated = null;
    if (mongoose.connection.readyState === 1) {
      updated = await Consent.findOneAndUpdate(
        { userEmail: user.email.toLowerCase(), consentType },
        { $set: revokeUpdate },
        { new: true }
      );
    } else {
      const existing = fallbackConsents.find(
        (c) => c.userEmail?.toLowerCase() === user.email.toLowerCase() && c.consentType === consentType
      );
      if (existing) {
        existing.granted = false;
        existing.revokedAt = new Date();
        updated = existing;
      }
    }

    await logClinicalAudit({
      req,
      action: "CONSENT_REVOKED",
      resourceType: "consent",
      resourceId: consentType,
      details: { consentType, reason },
    });

    res.json({
      success: true,
      message: `Optional consent for ${consentType} revoked successfully.`,
      consent: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
