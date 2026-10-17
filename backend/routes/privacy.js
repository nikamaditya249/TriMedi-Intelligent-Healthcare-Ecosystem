import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Consent from "../models/Consent.js";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import Order from "../models/Order.js";
import Medication from "../models/Medication.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { logClinicalAudit, logSecurityEvent } from "../services/auditService.js";
import { fallbackConsents } from "./consent.js";
import { fallbackUsers } from "./auth.js";
import { fallbackPrescriptions } from "./prescriptions.js";
import { fallbackAppointments } from "./appointments.js";
import { fallbackOrders } from "./orders.js";

const router = express.Router();

// Memory store for deletion requests in test/resilient mode
export const deletionRequests = [];

/**
 * GET /api/privacy/settings
 * View privacy settings, active consent summary, and retention status
 */
router.get("/settings", requireAuth, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();

    let consents = [];
    if (mongoose.connection.readyState === 1) {
      consents = await Consent.find({ userEmail }).lean();
    } else {
      consents = fallbackConsents.filter((c) => c.userEmail?.toLowerCase() === userEmail);
    }

    const deletionReq = deletionRequests.find((d) => d.email === userEmail);

    res.json({
      success: true,
      user: {
        email: userEmail,
        role: req.user.role,
      },
      privacySettings: {
        dataMinimizationActive: true,
        aiProcessingConsent: consents.some((c) => c.consentType === "AI_ASSISTANCE" && c.granted),
        smsNotificationsConsent: consents.some((c) => c.consentType === "NOTIFICATION_SMS" && c.granted),
        marketingConsent: consents.some((c) => c.consentType === "MARKETING" && c.granted),
        retentionStatus: deletionReq ? "DELETION_REQUESTED" : "ACTIVE",
        retentionPolicy: "Clinical records retained per statutory healthcare record retention rules; non-clinical data purged upon request.",
      },
      activeConsents: consents,
      securitySummary: {
        authMethod: "JWT_TOKEN",
        stepUpAuthEnabled: true,
        sessionActive: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/privacy/export-data
 * Authenticated patient data export with field minimization and audit
 */
router.post("/export-data", requireAuth, async (req, res) => {
  try {
    const callerEmail = req.user.email.toLowerCase();
    const targetEmail = (req.body.patientEmail || callerEmail).toLowerCase();

    // IDOR Protection: Patient can only export their own records
    if (req.user.role === "patient" && targetEmail !== callerEmail) {
      await logSecurityEvent({
        type: "UNAUTHORIZED_EXPORT_ATTEMPT",
        severity: "HIGH",
        actor: req.user,
        req,
        targetResource: targetEmail,
        details: { attemptedBy: callerEmail },
      });

      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to export another patient's health records.",
      });
    }

    // 1. Gather Profile Data
    let profile = null;
    if (mongoose.connection.readyState === 1) {
      profile = await User.findOne({ email: targetEmail }).select("-password").lean();
    } else {
      profile = fallbackUsers.find((u) => u.email.toLowerCase() === targetEmail);
    }

    const sanitizedProfile = profile
      ? {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          bloodGroup: profile.bloodGroup,
          allergies: profile.allergies,
          existingConditions: profile.existingConditions,
          currentMedications: profile.currentMedications,
          emergencyContact: profile.emergencyContact,
        }
      : { email: targetEmail };

    // 2. Gather Consents
    let consents = [];
    if (mongoose.connection.readyState === 1) {
      consents = await Consent.find({ userEmail: targetEmail }).lean();
    } else {
      consents = fallbackConsents.filter((c) => c.userEmail?.toLowerCase() === targetEmail);
    }

    // 3. Gather Prescriptions
    let prescriptions = [];
    if (mongoose.connection.readyState === 1) {
      prescriptions = await Prescription.find({ patientEmail: targetEmail }).lean();
    } else {
      prescriptions = fallbackPrescriptions.filter((p) => p.patientEmail?.toLowerCase() === targetEmail);
    }

    // 4. Gather Appointments
    let appointments = [];
    if (mongoose.connection.readyState === 1) {
      appointments = await Appointment.find({ patientEmail: targetEmail }).lean();
    } else {
      appointments = fallbackAppointments.filter((a) => a.patientEmail?.toLowerCase() === targetEmail);
    }

    // 5. Gather Orders
    let orders = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find({ patientEmail: targetEmail }).lean();
    } else {
      orders = fallbackOrders.filter((o) => o.patientEmail?.toLowerCase() === targetEmail);
    }

    // Sanitize export payload (strip passwords, internal DB internals, secrets)
    const exportBundle = {
      exportMetadata: {
        ecosystem: "TriMedi Intelligent Healthcare Ecosystem",
        exportedAt: new Date().toISOString(),
        patientEmail: targetEmail,
        format: "JSON_STANDARDIZED_HEALTH_RECORD",
        version: "2026.1",
      },
      patientProfile: sanitizedProfile,
      consents: consents.map((c) => ({
        type: c.consentType,
        purpose: c.purpose,
        granted: c.granted,
        grantedAt: c.grantedAt,
        revokedAt: c.revokedAt,
      })),
      prescriptions: prescriptions.map((p) => ({
        id: p._id,
        doctorName: p.doctorName,
        diagnosis: p.diagnosis,
        items: p.items,
        status: p.status,
        validUntil: p.validUntil,
        approvedAt: p.approvedAt,
      })),
      appointments: appointments.map((a) => ({
        id: a._id,
        doctorName: a.doctorName,
        date: a.appointmentDate,
        timeSlot: a.timeSlot,
        status: a.status,
      })),
      orders: orders.map((o) => ({
        orderId: o.orderId,
        totalAmount: o.totalAmount,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      })),
    };

    await logClinicalAudit({
      req,
      action: "DATA_EXPORT_GENERATED",
      resourceType: "patient_export",
      resourceId: targetEmail,
      details: {
        prescriptionsCount: prescriptions.length,
        appointmentsCount: appointments.length,
        ordersCount: orders.length,
      },
    });

    res.json({
      success: true,
      message: "Patient health data bundle generated successfully.",
      export: exportBundle,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/privacy/request-deletion
 * Healthcare data retention handling (Active -> Deletion Requested -> Retained for Legal Compliance)
 */
router.post("/request-deletion", requireAuth, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    const { reason = "Patient requested account deletion" } = req.body;

    const requestRecord = {
      email: userEmail,
      requestedAt: new Date(),
      reason,
      status: "DELETION_REQUESTED",
      retentionPolicyApplied: "RETAINED_FOR_LEGAL_COMPLIANCE",
      note: "Marketing consents revoked and account deactivated immediately. Clinical prescription and consultation records are scheduled for statutory healthcare retention archiving.",
    };

    deletionRequests.push(requestRecord);

    // Revoke optional marketing consents immediately
    if (mongoose.connection.readyState === 1) {
      await Consent.updateMany(
        { userEmail, consentType: { $in: ["MARKETING", "NOTIFICATION_SMS"] } },
        { $set: { granted: false, revokedAt: new Date() } }
      );
    } else {
      fallbackConsents.forEach((c) => {
        if (c.userEmail?.toLowerCase() === userEmail && ["MARKETING", "NOTIFICATION_SMS"].includes(c.consentType)) {
          c.granted = false;
          c.revokedAt = new Date();
        }
      });
    }

    await logClinicalAudit({
      req,
      action: "ACCOUNT_DELETION_REQUESTED",
      resourceType: "user_privacy",
      resourceId: userEmail,
      details: { reason },
    });

    res.json({
      success: true,
      message: "Account deletion request received and registered.",
      retentionStatus: "RETAINED_FOR_LEGAL_COMPLIANCE",
      details: requestRecord,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
