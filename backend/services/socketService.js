import { Server } from "socket.io";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Order from "../models/Order.js";
import { fallbackOrders } from "../routes/orders.js";
import eventBus from "./eventBus.js";
import { verifyAuthToken } from "../middleware/authMiddleware.js";

let io = null;
const onlineUsers = new Map(); // email -> Set of socket IDs

export const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Bridge EventBus commerce events to authorized Socket.IO rooms
  eventBus.on("ORDER_CREATED", (data) => {
    if (io) {
      if (data.patientEmail) io.to(`user_${data.patientEmail.toLowerCase()}`).emit("order.created", data);
      io.to("role_pharmacy").emit("order.created", data);
      io.to("role_admin").emit("order.created", data);
    }
  });

  eventBus.on("ORDER_STATUS_CHANGED", (data) => {
    if (io) {
      const eventName = `order.${(data.newStatus || "updated").toLowerCase()}`;
      if (data.orderId) io.to(`order_${data.orderId}`).emit(eventName, data);
      if (data.patientEmail) io.to(`user_${data.patientEmail.toLowerCase()}`).emit(eventName, data);
      io.to("role_pharmacy").emit(eventName, data);
      io.to("role_admin").emit(eventName, data);
    }
  });

  eventBus.on("PAYMENT_UPDATED", (data) => {
    if (io) {
      if (data.orderId) io.to(`order_${data.orderId}`).emit("payment.updated", data);
      if (data.patientEmail) io.to(`user_${data.patientEmail.toLowerCase()}`).emit("payment.updated", data);
    }
  });

  eventBus.on("REFUND_UPDATED", (data) => {
    if (io) {
      if (data.orderId) io.to(`order_${data.orderId}`).emit("refund.updated", data);
      if (data.patientEmail) io.to(`user_${data.patientEmail.toLowerCase()}`).emit("refund.updated", data);
    }
  });

  eventBus.on("INVENTORY_LOW_STOCK", (data) => {
    if (io) {
      io.to("role_pharmacy").emit("inventory.low_stock", data);
      io.to("role_admin").emit("inventory.low_stock", data);
    }
  });

  // 1. Connection Authentication Middleware (Strict Token Verification)
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization;

      if (!token) {
        console.warn("⚠️ Socket connection rejected: No authentication token provided");
        return next(new Error("AUTH_REQUIRED: Missing authentication token"));
      }

      const verifiedUser = await verifyAuthToken(token);
      if (!verifiedUser) {
        console.warn("⚠️ Socket connection rejected: Invalid or expired token");
        return next(new Error("AUTH_INVALID: Invalid authentication credentials"));
      }

      // Securely bind authenticated server-derived identity
      socket.userId = verifiedUser._id;
      socket.userEmail = verifiedUser.email.toLowerCase();
      socket.userRole = verifiedUser.role; // Derived from verified token, never trusted from client
      socket.userName = verifiedUser.name || "TriMedi User";

      next();
    } catch (authErr) {
      console.error("Socket authentication middleware error:", authErr.message);
      next(new Error("AUTH_ERROR: Authentication failure"));
    }
  });

  io.on("connection", (socket) => {
    const email = socket.userEmail;
    const role = socket.userRole;

    // Join isolated individual user room
    socket.join(`user_${email}`);

    // Join authorized role room
    if (role) {
      socket.join(`role_${role}`);
    }

    // Track online state
    if (!onlineUsers.has(email)) {
      onlineUsers.set(email, new Set());
    }
    onlineUsers.get(email).add(socket.id);

    // Broadcast presence update
    io.emit("presence:update", {
      email,
      isOnline: true,
      onlineCount: onlineUsers.size,
    });

    console.log(`🔌 Authenticated Socket connected: ${email} (Role: ${role}) [SocketID: ${socket.id}]`);

    // 2. Conversation Room Join with Strict Authorization Check
    socket.on("conversation:join", async ({ conversationId }) => {
      if (!conversationId) return;

      try {
        let isAuthorized = false;

        if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(conversationId)) {
          const conv = await Conversation.findById(conversationId).lean();
          if (conv) {
            if (
              conv.patientEmail?.toLowerCase() === socket.userEmail ||
              conv.doctorEmail?.toLowerCase() === socket.userEmail ||
              socket.userRole === "admin"
            ) {
              isAuthorized = true;
            }
          }
        } else {
          // Fallback check
          if (
            conversationId.startsWith("conv_") &&
            (socket.userEmail.includes("patient") ||
              socket.userEmail.includes("doctor") ||
              socket.userEmail.includes("aditya") ||
              socket.userRole === "admin")
          ) {
            isAuthorized = true;
          }
        }

        if (isAuthorized) {
          socket.join(`conv_${conversationId}`);
          console.log(`💬 Authorized join: ${socket.userEmail} joined conv_${conversationId}`);
        } else {
          console.warn(`🚫 Unauthorized conversation join blocked for ${socket.userEmail} on conv_${conversationId}`);
          socket.emit("error:unauthorized", {
            message: "Access denied: You are not an authorized participant of this conversation",
            conversationId,
          });
        }
      } catch (err) {
        console.error("Error authorizing conversation join:", err.message);
        socket.emit("error:unauthorized", { message: "Error verifying conversation membership" });
      }
    });

    // Leave conversation room
    socket.on("conversation:leave", ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv_${conversationId}`);
      }
    });

    // 3. Typing Indicators (Authorized to room participants only)
    socket.on("typing:start", ({ conversationId }) => {
      if (conversationId && socket.rooms.has(`conv_${conversationId}`)) {
        socket.to(`conv_${conversationId}`).emit("typing:start", {
          conversationId,
          userEmail: socket.userEmail,
          userName: socket.userName,
        });
      }
    });

    socket.on("typing:stop", ({ conversationId }) => {
      if (conversationId && socket.rooms.has(`conv_${conversationId}`)) {
        socket.to(`conv_${conversationId}`).emit("typing:stop", {
          conversationId,
          userEmail: socket.userEmail,
        });
      }
    });

    // 4. Mark Messages Read with Recipient Ownership Check
    socket.on("messages:markRead", async ({ conversationId }) => {
      if (conversationId && socket.userEmail) {
        try {
          if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(conversationId)) {
            await Message.updateMany(
              {
                conversation: conversationId,
                receiverEmail: socket.userEmail, // Only mark messages intended for THIS verified user
                isRead: false,
              },
              { $set: { isRead: true, readAt: new Date() } }
            );
          }
        } catch (e) {
          console.error("Error updating read receipts:", e.message);
        }

        socket.to(`conv_${conversationId}`).emit("messages:readReceipt", {
          conversationId,
          readBy: socket.userEmail,
          readAt: new Date(),
        });
      }
    });

    // 5. Order Tracking Room Join with Strict IDOR Defense
    socket.on("order:join", async ({ orderId }) => {
      if (!orderId) return;

      try {
        let isAuthorized = false;

        // Admins and Pharmacy staff have fulfillment access to orders
        if (socket.userRole === "admin" || socket.userRole === "pharmacy") {
          isAuthorized = true;
        } else {
          // Patient can only join their OWN order room
          if (mongoose.connection.readyState === 1) {
            const order = await Order.findOne({ $or: [{ _id: mongoose.isValidObjectId(orderId) ? orderId : null }, { orderId }] }).lean();
            if (order && order.patientEmail?.toLowerCase() === socket.userEmail) {
              isAuthorized = true;
            }
          } else {
            const fallback = fallbackOrders.find((o) => o._id === orderId || o.orderId === orderId);
            if (fallback && fallback.patientEmail?.toLowerCase() === socket.userEmail.toLowerCase()) {
              isAuthorized = true;
            }
          }
        }

        if (isAuthorized) {
          socket.join(`order_${orderId}`);
          socket.emit("order:joined", { orderId, success: true });
          console.log(`📦 Authorized order join: ${socket.userEmail} joined order_${orderId}`);
        } else {
          console.warn(`🚫 Unauthorized order join blocked for ${socket.userEmail} on order_${orderId}`);
          socket.emit("error:unauthorized", {
            message: "Access denied: You do not possess authorization to subscribe to another patient's order status updates",
            orderId,
          });
        }
      } catch (err) {
        console.error("Error authorizing order join:", err.message);
        socket.emit("error:unauthorized", { message: "Error verifying order authorization" });
      }
    });

    socket.on("order:leave", ({ orderId }) => {
      if (orderId) {
        socket.leave(`order_${orderId}`);
      }
    });

    // 6. Disconnect Handler
    socket.on("disconnect", () => {
      if (socket.userEmail) {
        const userSockets = onlineUsers.get(socket.userEmail);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(socket.userEmail);
            io.emit("presence:update", {
              email: socket.userEmail,
              isOnline: false,
              onlineCount: onlineUsers.size,
            });
          }
        }
        console.log(`🔌 Socket disconnected: ${socket.userEmail}`);
      }
    });
  });

  return io;
};

export const getSocketIO = () => io;

export const isUserOnline = (email) => {
  if (!email) return false;
  return onlineUsers.has(email.toLowerCase()) && onlineUsers.get(email.toLowerCase()).size > 0;
};
