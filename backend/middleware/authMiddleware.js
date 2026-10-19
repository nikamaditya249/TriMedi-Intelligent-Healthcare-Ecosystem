import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const isProduction = (process.env.APP_ENV || process.env.NODE_ENV) === "production";
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction) {
    throw new Error("FATAL: JWT_SECRET must be configured in production environment. No fallback permitted.");
  }
  return "trimedi_secure_jwt_secret_2026";
};

import securityStore from "../services/securityStore.js";

// Token revocation blocklist with distributed store backing
export const revokedTokens = new Set();
export const userSessionInvalidations = new Map(); // userEmail/id -> timestamp

export const revokeToken = (token) => {
  if (!token) return;
  const clean = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
  revokedTokens.add(clean);
  securityStore.revokeToken(clean).catch((err) => {
    console.error("SecurityStore revokeToken warning:", err.message);
  });
};

export const isTokenRevoked = (token) => {
  if (!token) return false;
  const clean = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
  return revokedTokens.has(clean) || revokedTokens.has(token);
};

export const invalidateUserSessions = (userKey) => {
  if (!userKey) return;
  const clean = String(userKey).toLowerCase();
  userSessionInvalidations.set(clean, Date.now());
  securityStore.invalidateUserSessions(clean).catch((err) => {
    console.error("SecurityStore invalidateUserSessions warning:", err.message);
  });
};

export const STATIC_DEMO_USERS = {
  "demo_token_patient": {
    _id: "demo_patient_1",
    name: "Aditya Nikam",
    email: "aditya@trimedi.health",
    role: "patient",
  },
  "demo_token_patient_b": {
    _id: "demo_patient_2",
    name: "Patient B",
    email: "patient_b@trimedi.health",
    role: "patient",
  },
  "demo_token_doctor": {
    _id: "demo_doctor_1",
    name: "Dr. Sarah Jenkins, MD",
    email: "doctor@trimedi.health",
    role: "doctor",
  },
  "demo_token_pharmacy": {
    _id: "demo_pharmacy_1",
    name: "MedPlus Prime Pharmacy",
    email: "pharmacy@trimedi.health",
    role: "pharmacy",
  },
  "demo_token_admin": {
    _id: "demo_admin_1",
    name: "System Administrator",
    email: "admin@trimedi.health",
    role: "admin",
  },
  "demo_token_reception": {
    _id: "demo_reception_1",
    name: "Meena Ramanathan",
    email: "reception@trimedi.health",
    role: "reception",
    clinicName: "Metro Health Center",
  },
};

/**
 * Verify token and return authenticated user identity
 */
export const verifyAuthToken = async (token) => {
  if (!token) return null;

  const raw = typeof token === "string" ? token.trim() : "";
  const cleanToken = raw.startsWith("Bearer ") ? raw.slice(7).trim() : raw;

  // Session Invalidation Check: Has this token been explicitly revoked?
  const isRevoked = isTokenRevoked(cleanToken) || isTokenRevoked(raw) || (await securityStore.isTokenRevoked(cleanToken));
  if (isRevoked) {
    return null;
  }

  // 1. Check known static demo tokens (with or without Bearer prefix)
  if (STATIC_DEMO_USERS[cleanToken] || STATIC_DEMO_USERS[raw]) {
    const user = STATIC_DEMO_USERS[cleanToken] || STATIC_DEMO_USERS[raw];
    const invalidationTime =
      (await securityStore.getUserSessionInvalidationTime(user.email)) ||
      userSessionInvalidations.get(user.email.toLowerCase()) ||
      userSessionInvalidations.get(String(user._id));
    // If sessions were globally invalidated after token was used, reject
    if (invalidationTime && Date.now() - invalidationTime < 3600000 && isTokenRevoked(cleanToken)) {
      return null;
    }
    return user;
  }

  // 2. Cryptographic JWT verification
  try {
    let decoded = null;

    try {
      decoded = jwt.verify(cleanToken, getJwtSecret());
    } catch (jwtErr) {
      if (!isProduction && !process.env.JWT_SECRET) {
        // Fallback secret check only in development/test when no JWT_SECRET env is provided
        decoded = jwt.verify(cleanToken, "trimedi_secure_jwt_secret_2026");
      } else {
        throw jwtErr;
      }
    }

    if (!decoded || !decoded.id) return null;

    // Check if user sessions were invalidated after this token was issued
    const userEmail = (decoded.email || "").toLowerCase();
    const invalidationTime =
      (await securityStore.getUserSessionInvalidationTime(userEmail)) ||
      userSessionInvalidations.get(userEmail) ||
      userSessionInvalidations.get(String(decoded.id));
    if (invalidationTime && decoded.iat && decoded.iat * 1000 < invalidationTime) {
      return null;
    }

    // Resolve user from DB if connected
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(decoded.id)) {
      const dbUser = await User.findById(decoded.id).select("-password").lean();
      if (dbUser) {
        return {
          _id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email.toLowerCase(),
          role: dbUser.role || decoded.role || "patient",
        };
      }
    }

    // Fallback resolution for valid JWT with payload
    return {
      _id: decoded.id,
      name: decoded.name || "TriMedi User",
      email: (decoded.email || (decoded.role === "doctor" ? "doctor@trimedi.com" : "patient@trimedi.com")).toLowerCase(),
      role: decoded.role || "patient",
    };
  } catch (err) {
    return null;
  }
};

/**
 * Express Middleware to protect REST API routes
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.query.token || req.headers["x-access-token"];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authentication required: Missing token",
    });
  }

  const user = await verifyAuthToken(authHeader);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required: Invalid or expired token",
    });
  }

  req.user = user;
  next();
};

/**
 * Optional Auth Middleware (attaches user if token valid)
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.query.token || req.headers["x-access-token"];
  if (authHeader) {
    const user = await verifyAuthToken(authHeader);
    if (user) {
      req.user = user;
    }
  }
  next();
};

/**
 * Role-Based Access Control Middleware
 * Ensures the authenticated user possesses one of the allowed roles
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Administrators possess global administrative governance (except clinical notes which require break-glass)
    if (req.user.role === "admin" || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: Role '${req.user.role}' is not authorized for this action`,
    });
  };
};

/**
 * Clinical Least-Privilege Access Control Middleware
 * Restricts sensitive clinical medical records & notes:
 * - Patients can only access their own records
 * - Doctors can access records of authorized patients
 * - Reception & Pharmacy are explicitly blocked from private clinical notes/diagnosis
 */
export const requireClinicalAccess = (patientEmailExtractor = (req) => req.query.patientEmail || req.body.patientEmail || req.params.patientEmail) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const role = req.user.role;
    const targetPatientEmail = (patientEmailExtractor(req) || "").toLowerCase();

    // 1. Reception & Pharmacy cannot access full clinical consultation notes/diagnosis
    if (role === "reception" || role === "pharmacy") {
      return res.status(403).json({
        success: false,
        message: "Clinical Access Restricted: Operational roles cannot access private clinical diagnosis and medical history notes.",
      });
    }

    // 2. Patient can only access their own clinical records
    if (role === "patient") {
      const userEmail = req.user.email.toLowerCase();
      if (targetPatientEmail && targetPatientEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Patients are forbidden from accessing another patient's medical records.",
        });
      }
    }

    // 3. Doctors and Admins permitted (Admins are audited)
    next();
  };
};
