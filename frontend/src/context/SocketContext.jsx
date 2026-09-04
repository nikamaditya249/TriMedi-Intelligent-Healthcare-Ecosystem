import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [latestToast, setLatestToast] = useState(null);

  const socketRef = useRef(null);

  // Initialize Socket connection when user logs in
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
    const authToken = localStorage.getItem("token") || (user?.role ? `demo_token_${user.role}` : "demo_token_patient");

    const newSocket = io(socketUrl, {
      auth: {
        token: authToken,
      },
      query: {
        token: authToken,
        userEmail: user.email || "patient@trimedi.com",
        role: user.role || "patient",
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🟢 Connected to TriMedi Real-Time Gateway via Socket.IO");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Disconnected from Real-Time Gateway");
      setIsConnected(false);
    });

    // Real-time Notification Listener
    newSocket.on("notification:new", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadNotifCount((prev) => prev + 1);

      // Trigger temporary in-app toast
      setLatestToast(newNotif);
      setTimeout(() => {
        setLatestToast((current) => (current?._id === newNotif._id ? null : current));
      }, 5000);
    });

    // Presence updates
    newSocket.on("presence:update", ({ email, isOnline }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (isOnline) updated.add(email.toLowerCase());
        else updated.delete(email.toLowerCase());
        return updated;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const email = user.email || "patient@trimedi.com";
      const res = await fetch(`http://localhost:5001/api/notifications?userEmail=${encodeURIComponent(email)}&role=${user.role || "patient"}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n) => !n.isRead).length;
        setUnreadNotifCount(unread);
      }
    } catch (e) {
      console.warn("Notification fetch warning:", e.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5001/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await fetch("http://localhost:5001/api/notifications/read-all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email, role: user.role }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        notifications,
        unreadNotifCount,
        latestToast,
        setLatestToast,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
      {/* Real-time In-App Toast Popup */}
      {latestToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 border border-teal-500/40 text-white rounded-2xl shadow-2xl p-4 transition-all duration-300 transform translate-y-0 animate-bounce-short">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 text-lg font-bold">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  {latestToast.category || "Notification"}
                </p>
                <button
                  onClick={() => setLatestToast(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-sm font-semibold text-white mt-0.5 truncate">{latestToast.title}</h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">{latestToast.message}</p>
            </div>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      notifications: [],
      unreadNotifCount: 0,
      latestToast: null,
      markAsRead: () => {},
      markAllAsRead: () => {},
      refreshNotifications: () => {},
    };
  }
  return context;
};
