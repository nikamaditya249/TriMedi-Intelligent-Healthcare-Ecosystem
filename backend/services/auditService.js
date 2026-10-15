import mongoose from "mongoose";
import ClinicalAudit from "../models/ClinicalAudit.js";

// In-memory audit log for fallback when MongoDB cluster is offline
export const fallbackAuditLogs = [];

/**
 * Log a clinical audit event securely
 */
export const logClinicalAudit = async ({
  req = null,
  actor = null,
  action,
  resourceType,
  resourceId = "",
  details = {},
  status = "SUCCESS",
}) => {
  try {
    const actorId = actor?._id || actor?.id || req?.user?._id || "system";
    const actorEmail = actor?.email || req?.user?.email || "system@trimedi.health";
    const actorRole = actor?.role || req?.user?.role || "system";

    const ipAddress =
      req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || req?.ip || "127.0.0.1";
    const userAgent = req?.headers?.["user-agent"] || "TriMedi Client";

    // Sanitize details: strictly remove passwords, tokens, private keys
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.jwt;
    delete sanitizedDetails.secret;

    const auditEntry = {
      actorId: String(actorId),
      actorEmail: actorEmail.toLowerCase(),
      actorRole,
      action,
      resourceType,
      resourceId: String(resourceId),
      details: sanitizedDetails,
      status,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      await ClinicalAudit.create(auditEntry);
    } else {
      fallbackAuditLogs.unshift({
        _id: "audit_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        ...auditEntry,
      });
      // Cap in-memory audit logs at 1000 items
      if (fallbackAuditLogs.length > 1000) {
        fallbackAuditLogs.pop();
      }
    }

    return auditEntry;
  } catch (err) {
    console.error("Clinical audit logging error:", err.message);
    // Never throw from audit logging to prevent interrupting healthcare transaction
    return null;
  }
};

/**
 * Query clinical audit logs (Admin and authorized clinical governance only)
 */
export const queryAuditLogs = async ({ actorEmail, action, resourceType, limit = 50 }) => {
  if (mongoose.connection.readyState === 1) {
    const query = {};
    if (actorEmail) query.actorEmail = actorEmail.toLowerCase();
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    return ClinicalAudit.find(query).sort({ timestamp: -1 }).limit(limit).lean();
  }

  let results = [...fallbackAuditLogs];
  if (actorEmail) results = results.filter((l) => l.actorEmail === actorEmail.toLowerCase());
  if (action) results = results.filter((l) => l.action === action);
  if (resourceType) results = results.filter((l) => l.resourceType === resourceType);
  return results.slice(0, limit);
};

export default {
  logClinicalAudit,
  queryAuditLogs,
  fallbackAuditLogs,
};
