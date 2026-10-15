import express from "express";
import mongoose from "mongoose";
import ClinicQueue from "../models/ClinicQueue.js";
import {
  checkInPatient,
  getLiveQueue,
  callPatientInQueue,
  startEncounter,
  completeEncounter,
  fallbackQueueItems,
} from "../services/queueService.js";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import { logClinicalAudit } from "../services/auditService.js";

const router = express.Router();

/**
 * GET /api/queue
 * Returns active clinic queue items (waiting, called, in_consultation)
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { doctorEmail, clinicName } = req.query;
    const queue = await getLiveQueue({ doctorEmail, clinicName });
    res.json({ success: true, count: queue.length, queue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/queue/check-in
 * Idempotent Patient Check-In by Reception or Patient Self-Service
 */
router.post("/check-in", optionalAuth, async (req, res) => {
  try {
    const { appointmentId, priority = "normal", notes = "", checkedInBy } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    const actorEmail = req.user?.email || "reception@trimedi.health";
    const actorRole = req.user?.role || "reception";

    const result = await checkInPatient({
      appointmentId,
      checkedInBy: checkedInBy || req.user?.name || "Clinic Reception",
      actorRole,
      actorEmail,
      priority,
      notes,
      req,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/queue/:id/call
 * Doctor calls patient from waiting room into consultation
 */
router.put("/:id/call", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const doctorEmail = req.user?.email || "doctor@trimedi.health";
    const doctorName = req.user?.name || "Dr. Sarah Jenkins";

    const updated = await callPatientInQueue({ queueId: id, doctorEmail, doctorName, req });
    res.json({ success: true, message: `Queue #${updated.queueNumber} called`, queueItem: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/queue/:id/start
 * Doctor marks consultation started
 */
router.put("/:id/start", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentId } = req.body;
    const doctorEmail = req.user?.email || "doctor@trimedi.health";

    const updated = await startEncounter({ queueId: id, appointmentId, doctorEmail, req });
    res.json({ success: true, message: "Consultation encounter started", queueItem: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/queue/:id/complete
 * Doctor or Reception marks consultation complete
 */
router.put("/:id/complete", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentId } = req.body;
    const doctorEmail = req.user?.email || "doctor@trimedi.health";

    const updated = await completeEncounter({ queueId: id, appointmentId, doctorEmail, req });
    res.json({ success: true, message: "Consultation encounter completed", queueItem: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/queue/:id/status
 * Mark no-show or cancelled in queue
 */
router.put("/:id/status", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason = "" } = req.body;

    if (!["waiting", "called", "in_consultation", "completed", "cancelled", "no_show"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid queue status" });
    }

    let updated = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      updated = await ClinicQueue.findByIdAndUpdate(id, { status, notes: reason }, { new: true });
    } else {
      updated = fallbackQueueItems.find((q) => String(q._id) === String(id));
      if (updated) {
        updated.status = status;
        if (reason) updated.notes = reason;
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: "Queue entry not found" });
    }

    await logClinicalAudit({
      req,
      action: "QUEUE_STATUS_CHANGED",
      resourceType: "queue",
      resourceId: String(id),
      details: { status, reason },
    });

    res.json({ success: true, message: `Queue entry status updated to ${status}`, queueItem: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
