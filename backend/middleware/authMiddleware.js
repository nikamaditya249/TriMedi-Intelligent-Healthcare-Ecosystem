import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "trimedi_secure_jwt_secret_2026";

export const STATIC_DEMO_USERS = {
  "demo_token_patient": {
    _id: "demo_patient_1",
    name: "Aditya Nikam",
    email: "patient@trimedi.com",
    role: "patient",
  },
  "demo_token_doctor": {
    _id: "demo_doctor_1",
    name: "Dr. Sarah Jenkins, MD",
    email: "doctor@trimedi.com",
    role: "doctor",
  },
  "demo_token_pharmacy": {
    _id: "demo_pharmacy_1",
    name: "MedPlus Prime Pharmacy",
    email: "pharmacy@trimedi.com",
    role: "pharmacy",
  },
  "demo_token_admin": {
    _id: "demo_admin_1",
    name: "System Administrator",
    email: "admin@trimedi.com",
    role: "admin",
  },
};

/**
 * Verify token and return authenticated user identity
 */
export const verifyAuthToken = async (token) => {
  if (!token) return null;

  // 1. Check known static demo tokens
  if (STATIC_DEMO_USERS[token]) {
    return STATIC_DEMO_USERS[token];
  }

  // 2. Cryptographic JWT verification
  try {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    let decoded = null;

    try {
      decoded = jwt.verify(cleanToken, JWT_SECRET);
    } catch (jwtErr) {
      // Fallback secret check
      decoded = jwt.verify(cleanToken, "trimedi_secure_jwt_secret_2026");
    }

    if (!decoded || !decoded.id) return null;

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
 * Optional Auth Middleware (attaches user if token valid, rejects if malformed token supplied)
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.query.token || req.headers["x-access-token"];
  if (authHeader) {
    const user = await verifyAuthToken(authHeader);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authorization token",
      });
    }
    req.user = user;
  }
  next();
};
