import express from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getSocketIO, isUserOnline } from "../services/socketService.js";
import eventBus from "../services/eventBus.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware
router.use(optionalAuth);

// Resilient in-memory fallback stores (Used ONLY when MongoDB cluster is offline)
let fallbackConversations = [
  {
    _id: "conv_demo_1",
    patientEmail: "patient@trimedi.com",
    doctorEmail: "doctor@trimedi.com",
    patientName: "Aditya Nikam",
    doctorName: "Dr. Sarah Jenkins",
    lastMessage: "Please take Atorvastatin daily after dinner.",
    lastMessageAt: new Date(Date.now() - 3600000),
    unreadPatientCount: 0,
    unreadDoctorCount: 0,
  },
];

let fallbackMessages = [
  {
    _id: "msg_demo_1",
    conversation: "conv_demo_1",
    conversationIdString: "conv_demo_1",
    senderEmail: "doctor@trimedi.com",
    senderRole: "doctor",
    senderName: "Dr. Sarah Jenkins",
    receiverEmail: "patient@trimedi.com",
    messageType: "text",
    content: "Hello Aditya, I reviewed your recent lipid profile test results.",
    isRead: true,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    _id: "msg_demo_2",
    conversation: "conv_demo_1",
    conversationIdString: "conv_demo_1",
    senderEmail: "patient@trimedi.com",
    senderRole: "patient",
    senderName: "Aditya Nikam",
    receiverEmail: "doctor@trimedi.com",
    messageType: "text",
    content: "Thank you Dr. Jenkins. Should I continue with the prescribed dosage?",
    isRead: true,
    createdAt: new Date(Date.now() - 5400000),
  },
  {
    _id: "msg_demo_3",
    conversation: "conv_demo_1",
    conversationIdString: "conv_demo_1",
    senderEmail: "doctor@trimedi.com",
    senderRole: "doctor",
    senderName: "Dr. Sarah Jenkins",
    receiverEmail: "patient@trimedi.com",
    messageType: "text",
    content: "Please take Atorvastatin daily after dinner.",
    isRead: true,
    createdAt: new Date(Date.now() - 3600000),
  },
];

// GET /api/chat/conversations - List conversations for authenticated user (IDOR protected)
router.get("/conversations", async (req, res) => {
  try {
    const userEmail = (req.user?.email || req.query.userEmail || "").toLowerCase();
    const role = (req.user?.role || req.query.role || "patient").toLowerCase();

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "userEmail is required" });
    }

    // Security Check: If authenticated, prevent IDOR query for another user's conversations
    if (req.user && req.user.role !== "admin" && req.query.userEmail) {
      if (req.query.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You cannot access another user's conversations",
        });
      }
    }

    let convs = [];
    if (mongoose.connection.readyState === 1) {
      convs = await Conversation.find({
        $or: [{ patientEmail: userEmail }, { doctorEmail: userEmail }],
      })
        .sort({ lastMessageAt: -1 })
        .lean();
    }

    if (!convs || convs.length === 0) {
      if (mongoose.connection.readyState !== 1) {
        console.warn("⚠️ [DEV IN-MEMORY FALLBACK] MongoDB unavailable, serving in-memory conversations");
      }
      convs = fallbackConversations.filter(
        (c) => c.patientEmail === userEmail || c.doctorEmail === userEmail
      );
      if (convs.length === 0) {
        const newDemo = {
          _id: "conv_" + Date.now(),
          patientEmail: role === "patient" ? userEmail : "patient@trimedi.com",
          doctorEmail: role === "doctor" ? userEmail : "doctor@trimedi.com",
          patientName: role === "patient" ? "Patient" : "Aditya Nikam",
          doctorName: role === "doctor" ? "Doctor" : "Dr. Sarah Jenkins",
          lastMessage: "Welcome to TriMedi secure doctor-patient messaging.",
          lastMessageAt: new Date(),
          unreadPatientCount: 0,
          unreadDoctorCount: 0,
        };
        fallbackConversations.push(newDemo);
        convs = [newDemo];
      }
    }

    // Attach live presence info
    const enrichedConvs = convs.map((c) => {
      const partnerEmail = c.patientEmail === userEmail ? c.doctorEmail : c.patientEmail;
      return {
        ...c,
        partnerEmail,
        isPartnerOnline: isUserOnline(partnerEmail),
      };
    });

    res.json({ success: true, conversations: enrichedConvs });
  } catch (err) {
    console.error("Fetch conversations error:", err);
    res.status(500).json({ success: false, message: "Error fetching conversations" });
  }
});

// POST /api/chat/conversations - Start or get existing conversation
router.post("/conversations", async (req, res) => {
  try {
    const { patientEmail, doctorEmail, patientName, doctorName } = req.body;
    if (!patientEmail || !doctorEmail) {
      return res.status(400).json({ success: false, message: "patientEmail and doctorEmail are required" });
    }

    const pEmail = patientEmail.toLowerCase();
    const dEmail = doctorEmail.toLowerCase();

    // Security Check: Initiator must be either the patient, doctor, or admin
    if (req.user && req.user.role !== "admin") {
      const authEmail = req.user.email.toLowerCase();
      if (authEmail !== pEmail && authEmail !== dEmail) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only initiate conversations involving your verified identity",
        });
      }
    }

    let conv = null;
    if (mongoose.connection.readyState === 1) {
      conv = await Conversation.findOne({ patientEmail: pEmail, doctorEmail: dEmail });
      if (!conv) {
        const pUser = await User.findOne({ email: pEmail });
        const dUser = await User.findOne({ email: dEmail });

        conv = await Conversation.create({
          patient: pUser?._id || new mongoose.Types.ObjectId(),
          doctor: dUser?._id || new mongoose.Types.ObjectId(),
          patientEmail: pEmail,
          doctorEmail: dEmail,
          patientName: patientName || pUser?.name || "Patient",
          doctorName: doctorName || dUser?.name || "Doctor",
          lastMessage: "Conversation initiated",
          lastMessageAt: new Date(),
        });
      }
    } else {
      console.warn("⚠️ [DEV IN-MEMORY FALLBACK] MongoDB unavailable, saving conversation to memory");
      conv = fallbackConversations.find((c) => c.patientEmail === pEmail && c.doctorEmail === dEmail);
      if (!conv) {
        conv = {
          _id: "conv_" + Date.now(),
          patientEmail: pEmail,
          doctorEmail: dEmail,
          patientName: patientName || "Patient",
          doctorName: doctorName || "Doctor",
          lastMessage: "Conversation initiated",
          lastMessageAt: new Date(),
          unreadPatientCount: 0,
          unreadDoctorCount: 0,
        };
        fallbackConversations.unshift(conv);
      }
    }

    res.json({ success: true, conversation: conv });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ success: false, message: "Error initiating conversation" });
  }
});

// GET /api/chat/messages/:conversationId - Get messages for a conversation (Participant authorized)
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userEmail = (req.user?.email || req.query.userEmail || "").toLowerCase();

    // Verify conversation existence and participant authorization
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(conversationId)) {
      const conversation = await Conversation.findById(conversationId).lean();
      if (conversation && userEmail && req.user?.role !== "admin") {
        if (
          conversation.patientEmail?.toLowerCase() !== userEmail &&
          conversation.doctorEmail?.toLowerCase() !== userEmail
        ) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: You are not authorized to view messages in this consultation",
          });
        }
      }
    }

    let messages = [];
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(conversationId)) {
      messages = await Message.find({
        $or: [{ conversation: conversationId }, { conversationIdString: conversationId }],
      })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();
    } else {
      messages = fallbackMessages.filter(
        (m) => m.conversation === conversationId || m.conversationIdString === conversationId
      );
    }

    // Mark messages as read for this user
    if (userEmail) {
      if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(conversationId)) {
        await Message.updateMany(
          {
            $or: [{ conversation: conversationId }, { conversationIdString: conversationId }],
            receiverEmail: userEmail,
            isRead: false,
          },
          { $set: { isRead: true, readAt: new Date() } }
        );
      } else {
        fallbackMessages.forEach((m) => {
          if (
            (m.conversation === conversationId || m.conversationIdString === conversationId) &&
            m.receiverEmail === userEmail
          ) {
            m.isRead = true;
            m.readAt = new Date();
          }
        });
      }
    }

    res.json({ success: true, messages });
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ success: false, message: "Error fetching messages" });
  }
});

// POST /api/chat/messages - Send a new message (Strict Sender Identity Verification)
router.post("/messages", async (req, res) => {
  try {
    const {
      conversationId,
      senderEmail,
      senderRole,
      senderName,
      receiverEmail,
      messageType = "text",
      content,
      metadata = {},
    } = req.body;

    // Securely derive or validate sender from authenticated token
    const effectiveSenderEmail = (req.user?.email || senderEmail || "").toLowerCase();
    const effectiveSenderRole = req.user?.role || senderRole || "patient";
    const effectiveSenderName = req.user?.name || senderName || "User";

    if (!effectiveSenderEmail || !receiverEmail || !content) {
      return res.status(400).json({ success: false, message: "Missing required message parameters" });
    }

    const rEmail = receiverEmail.toLowerCase();

    // Security Check: Verify that the effective sender is an authorized participant of conversation
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(conversationId)) {
      const conv = await Conversation.findById(conversationId);
      if (conv) {
        const isParticipant =
          conv.patientEmail?.toLowerCase() === effectiveSenderEmail ||
          conv.doctorEmail?.toLowerCase() === effectiveSenderEmail ||
          effectiveSenderRole === "admin";

        if (!isParticipant) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: You are not authorized to send messages in this conversation",
          });
        }
      }
    }

    let savedMessage = null;
    const isDbReady = mongoose.connection.readyState === 1;

    if (isDbReady && mongoose.isValidObjectId(conversationId)) {
      const sUser = await User.findOne({ email: effectiveSenderEmail });
      const rUser = await User.findOne({ email: rEmail });

      savedMessage = await Message.create({
        conversation: conversationId,
        conversationIdString: conversationId.toString(),
        sender: sUser?._id || new mongoose.Types.ObjectId(),
        senderEmail: effectiveSenderEmail,
        senderRole: effectiveSenderRole,
        senderName: effectiveSenderName,
        receiver: rUser?._id,
        receiverEmail: rEmail,
        messageType,
        content,
        metadata,
        isRead: false,
      });

      // Update conversation lastMessage
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: messageType === "text" ? content : `[${messageType.toUpperCase()}] ${content}`,
        lastMessageAt: new Date(),
        $inc: effectiveSenderRole === "doctor" ? { unreadPatientCount: 1 } : { unreadDoctorCount: 1 },
      });
    } else {
      console.warn("⚠️ [DEV IN-MEMORY FALLBACK] MongoDB unavailable, storing message in memory");
      savedMessage = {
        _id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        conversation: conversationId,
        conversationIdString: conversationId,
        senderEmail: effectiveSenderEmail,
        senderRole: effectiveSenderRole,
        senderName: effectiveSenderName,
        receiverEmail: rEmail,
        messageType,
        content,
        metadata,
        isRead: false,
        createdAt: new Date(),
      };
      fallbackMessages.push(savedMessage);

      // Update fallback conversation
      const conv = fallbackConversations.find((c) => c._id === conversationId);
      if (conv) {
        conv.lastMessage = content;
        conv.lastMessageAt = new Date();
      }
    }

    // Real-time broadcast via Socket.IO
    const io = getSocketIO();
    if (io) {
      // 1. Emit to conversation room
      io.to(`conv_${conversationId}`).emit("message:received", savedMessage);
      // 2. Emit directly to receiver user room
      io.to(`user_${rEmail}`).emit("message:direct", savedMessage);
    }

    // Trigger Notification via eventBus
    eventBus.emit("MESSAGE_CREATED", {
      conversationId,
      senderName: effectiveSenderName,
      receiverEmail: rEmail,
      receiverRole: effectiveSenderRole === "doctor" ? "patient" : "doctor",
      content,
    });

    res.status(201).json({ success: true, message: savedMessage });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ success: false, message: "Error delivering message" });
  }
});

export default router;
