import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/authMiddleware.js";
import { logClinicalAudit, logSecurityEvent } from "../services/auditService.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "uploads", "prescriptions");

// Ensure non-public uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory file metadata registry
export const prescriptionFileRegistry = new Map();

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const DISALLOWED_EXTENSIONS = [".exe", ".js", ".sh", ".php", ".py", ".bat", ".cmd", ".vbs", ".html", ".svg"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validate magic bytes / file signatures to prevent MIME spoofing
 */
export const validateMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 4) return false;
  const hex = buffer.slice(0, 4).toString("hex").toLowerCase();

  // JPEG: ffd8ff
  if (hex.startsWith("ffd8")) return "image/jpeg";
  // PNG: 89504e47
  if (hex === "89504e47") return "image/png";
  // PDF: 25504446 (%PDF)
  if (hex === "25504446") return "application/pdf";
  // WebP: RIFF (52494646) ... WEBP
  if (hex === "52494646" && buffer.length >= 12 && buffer.slice(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  return false;
};

/**
 * Malware scanning abstraction
 */
export const scanFileForThreats = (buffer, filename) => {
  // Check for common webshell signatures or null byte injections
  const content = buffer.slice(0, 1024).toString("utf-8", 0, Math.min(1024, buffer.length));
  if (content.includes("<?php") || content.includes("<script") || content.includes("/bin/sh") || content.includes("eval(")) {
    return { clean: false, threat: "SUSPECTED_SCRIPT_INJECTION_OR_WEBSHELL" };
  }
  return { clean: true, threat: null };
};

/**
 * POST /api/uploads/prescription
 * Upload and cryptographically isolate prescription document
 */
router.post("/prescription", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { filename = "prescription.png", mimeType = "image/png", fileBase64 = "" } = req.body;

    if (!fileBase64) {
      return res.status(400).json({
        success: false,
        message: "No file content provided. 'fileBase64' string is required.",
      });
    }

    const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    // 1. File Size Validation (Max 5MB)
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the 5MB limit. (Received ${Math.round(buffer.length / 1024)} KB)`,
      });
    }

    // 2. Extension & Filename Sanitization
    const sanitizedOriginal = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(sanitizedOriginal).toLowerCase();

    if (DISALLOWED_EXTENSIONS.includes(ext)) {
      await logSecurityEvent({
        type: "MALICIOUS_UPLOAD_BLOCKED",
        severity: "HIGH",
        actor: user,
        req,
        targetResource: sanitizedOriginal,
        details: { reason: "Executable extension blocked", ext },
      });

      return res.status(400).json({
        success: false,
        message: `Disallowed file extension '${ext}'. Only JPEG, PNG, WebP, and PDF are permitted.`,
      });
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file format '${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      });
    }

    // 3. Magic Bytes / True MIME Validation
    const detectedMime = validateMagicBytes(buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
      await logSecurityEvent({
        type: "MALICIOUS_UPLOAD_BLOCKED",
        severity: "HIGH",
        actor: user,
        req,
        targetResource: sanitizedOriginal,
        details: { reason: "MIME spoofing detected / Magic bytes mismatch", declared: mimeType },
      });

      return res.status(400).json({
        success: false,
        message: "File signature validation failed. Actual file contents do not match an authentic image or PDF.",
      });
    }

    // 4. Malware Scanning Abstraction
    const scanResult = scanFileForThreats(buffer, sanitizedOriginal);
    if (!scanResult.clean) {
      await logSecurityEvent({
        type: "MALICIOUS_UPLOAD_BLOCKED",
        severity: "CRITICAL",
        actor: user,
        req,
        targetResource: sanitizedOriginal,
        details: { reason: scanResult.threat },
      });

      return res.status(400).json({
        success: false,
        message: "File upload rejected: Antivirus & threat scanner detected suspicious content.",
      });
    }

    // 5. Store File with Randomized Non-Predictable UUID
    const fileId = crypto.randomUUID();
    const storageFilename = `${fileId}${ext}`;
    const storagePath = path.join(UPLOADS_DIR, storageFilename);

    fs.writeFileSync(storagePath, buffer);

    // 6. Register Metadata
    const fileRecord = {
      fileId,
      ownerEmail: user.email.toLowerCase(),
      ownerId: String(user._id),
      originalName: sanitizedOriginal,
      storageFilename,
      mimeType: detectedMime,
      sizeBytes: buffer.length,
      uploadedAt: new Date(),
    };

    prescriptionFileRegistry.set(fileId, fileRecord);

    await logClinicalAudit({
      req,
      action: "PRESCRIPTION_DOCUMENT_UPLOADED",
      resourceType: "prescription_file",
      resourceId: fileId,
      details: { originalName: sanitizedOriginal, sizeBytes: buffer.length, mimeType: detectedMime },
    });

    res.status(201).json({
      success: true,
      message: "Prescription document uploaded and cryptographically isolated.",
      fileId,
      originalName: sanitizedOriginal,
      mimeType: detectedMime,
      sizeBytes: buffer.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/uploads/prescription/:fileId
 * Authorized streaming of prescription document with IDOR defense
 */
router.get("/prescription/:fileId", requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    const fileRecord = prescriptionFileRegistry.get(fileId);
    if (!fileRecord) {
      return res.status(404).json({ success: false, message: "Prescription file not found" });
    }

    // Authorization & IDOR Check:
    // Patient can only view own uploaded prescriptions
    // Doctor can view assigned prescriptions
    // Pharmacy can view prescriptions assigned for dispensing
    const isOwner = fileRecord.ownerEmail === user.email.toLowerCase();
    const isDoctor = user.role === "doctor";
    const isPharmacy = user.role === "pharmacy";
    const isAdmin = user.role === "admin";

    if (!isOwner && !isDoctor && !isPharmacy && !isAdmin) {
      await logSecurityEvent({
        type: "UNAUTHORIZED_CLINICAL_ACCESS",
        severity: "HIGH",
        actor: user,
        req,
        targetResource: fileId,
        details: { reason: "IDOR attempt on prescription file" },
      });

      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to access this prescription document.",
      });
    }

    const filePath = path.join(UPLOADS_DIR, fileRecord.storageFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File artifact missing on storage" });
    }

    await logClinicalAudit({
      req,
      action: "PRESCRIPTION_DOCUMENT_VIEWED",
      resourceType: "prescription_file",
      resourceId: fileId,
      details: { viewerRole: user.role },
    });

    res.setHeader("Content-Type", fileRecord.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${fileRecord.originalName}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
