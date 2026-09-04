import express from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import eventBus from "../services/eventBus.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(optionalAuth);

// Fallback user notification preferences store
const userPreferences = new Map();

// Default preferences
const defaultPrefs = {
  appointment: true,
  prescription: true,
  order: true,
  medication: true,
  refill: true,
  chat: true,
  payment: true,
  system: true,
};

// GET /api/notifications - Fetch user notifications (IDOR protected)
router.get("/", async (req, res) => {
  try {
    const userEmail = (req.user?.email || req.query.userEmail || "").toLowerCase();
    const role = (req.user?.role || req.query.role || "patient").toLowerCase();
    const category = req.query.category;
    const isRead = req.query.isRead;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "userEmail is required" });
    }

    // Security Check: If authenticated and not admin, prevent accessing other users' notifications
    if (req.user && req.user.role !== "admin" && req.query.userEmail) {
      if (req.query.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You cannot access notifications for another user",
        });
      }
    }

    let notifications = [];
    if (mongoose.connection.readyState === 1) {
      const query = {
        $or: [{ userEmail }, { userRole: role }],
      };
      if (category && category !== "all") query.category = category;
      if (isRead !== undefined) query.isRead = isRead === "true";

      notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    } else {
      notifications = eventBus.fallbackNotifications.filter((n) => {
        const matchesUser = n.userEmail === userEmail || n.userRole === role;
        const matchesCategory = !category || category === "all" || n.category === category;
        const matchesRead = isRead === undefined || String(n.isRead) === isRead;
        return matchesUser && matchesCategory && matchesRead;
      });
    }

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const userEmail = (req.user?.email || req.query.userEmail || "").toLowerCase();
    const role = (req.user?.role || req.query.role || "patient").toLowerCase();

    if (!userEmail) {
      return res.json({ success: true, count: 0 });
    }

    let count = 0;
    if (mongoose.connection.readyState === 1) {
      count = await Notification.countDocuments({
        $or: [{ userEmail }, { userRole: role }],
        isRead: false,
      });
    } else {
      count = eventBus.fallbackNotifications.filter(
        (n) => (n.userEmail === userEmail || n.userRole === role) && !n.isRead
      ).length;
    }

    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, count: 0 });
  }
});

// PATCH /api/notifications/:id/read - Mark one read (with Ownership check)
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = (req.user?.email || "").toLowerCase();

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      const query = { _id: id };
      if (userEmail && req.user?.role !== "admin") {
        query.$or = [{ userEmail }, { userRole: req.user.role }];
      }
      await Notification.findOneAndUpdate(query, { isRead: true, readAt: new Date() });
    } else {
      const notif = eventBus.fallbackNotifications.find((n) => n._id === id);
      if (notif) {
        notif.isRead = true;
        notif.readAt = new Date();
      }
    }
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error marking read" });
  }
});

// PATCH /api/notifications/read-all - Mark all read for user
router.patch("/read-all", async (req, res) => {
  try {
    const userEmail = (req.user?.email || req.body.userEmail || "").toLowerCase();
    const role = (req.user?.role || req.body.role || "patient").toLowerCase();

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "userEmail is required" });
    }

    if (mongoose.connection.readyState === 1) {
      await Notification.updateMany(
        { $or: [{ userEmail }, { userRole: role }], isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
    } else {
      eventBus.fallbackNotifications.forEach((n) => {
        if ((n.userEmail === userEmail || n.userRole === role) && !n.isRead) {
          n.isRead = true;
          n.readAt = new Date();
        }
      });
    }

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating notifications" });
  }
});

// GET /api/notifications/preferences
router.get("/preferences", (req, res) => {
  const userEmail = (req.user?.email || req.query.userEmail || "").toLowerCase();
  const prefs = userPreferences.get(userEmail) || defaultPrefs;
  res.json({ success: true, preferences: prefs });
});

// PUT /api/notifications/preferences
router.put("/preferences", (req, res) => {
  const userEmail = (req.user?.email || req.body.userEmail || "").toLowerCase();
  const { preferences } = req.body;
  if (!userEmail) {
    return res.status(400).json({ success: false, message: "userEmail is required" });
  }
  const updated = { ...defaultPrefs, ...(preferences || {}) };
  userPreferences.set(userEmail, updated);
  res.json({ success: true, preferences: updated });
});

export default router;
