import React, { useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const NotificationCenterModal = ({ isOpen, onClose }) => {
  const { notifications, unreadNotifCount, markAsRead, markAllAsRead } = useSocket();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("notifications"); // 'notifications' or 'preferences'
  const [preferences, setPreferences] = useState({
    appointment: true,
    prescription: true,
    order: true,
    medication: true,
    refill: true,
    chat: true,
  });

  const categories = [
    { id: "all", label: "All" },
    { id: "appointment", label: "Appointments" },
    { id: "prescription", label: "Prescriptions" },
    { id: "order", label: "Orders" },
    { id: "refill", label: "Refills" },
    { id: "medication", label: "Medication" },
    { id: "chat", label: "Chat" },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategory === "all") return true;
    return n.category === selectedCategory;
  });

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "appointment":
        return "📅";
      case "prescription":
        return "📋";
      case "order":
        return "📦";
      case "refill":
        return "🔄";
      case "medication":
        return "💊";
      case "chat":
        return "💬";
      default:
        return "🔔";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      case "high":
        return <Badge variant="warning" size="sm">High</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Normal</Badge>;
    }
  };

  const handleTogglePref = (cat) => {
    setPreferences((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Healthcare Notifications & Alerts" maxWidth="max-w-2xl">
      <div className="flex flex-col h-[520px]">
        {/* Top Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "notifications"
                  ? "bg-teal-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Activity Feed ({unreadNotifCount} unread)
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "preferences"
                  ? "bg-teal-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              ⚙️ Preferences
            </button>
          </div>

          {activeTab === "notifications" && unreadNotifCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {activeTab === "notifications" ? (
          <>
            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl mb-2">
                    📭
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    No notifications in this category
                  </p>
                  <p className="text-xs text-slate-400">You're all caught up with your healthcare updates.</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex gap-3 ${
                      notif.isRead
                        ? "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-80"
                        : "bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/50 shadow-sm"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-lg flex-shrink-0">
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {getPriorityBadge(notif.priority)}
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Preferences Tab */
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose which real-time healthcare notifications you want to receive on your device:
            </p>

            <div className="space-y-2">
              {[
                { id: "appointment", label: "Appointment Reminders", desc: "24-hour and 1-hour consultation alerts" },
                { id: "prescription", label: "Prescription Alerts", desc: "Digital prescriptions issued by doctors" },
                { id: "order", label: "Order & Delivery Updates", desc: "Status changes from pharmacy to delivery" },
                { id: "refill", label: "Medication Refill Alerts", desc: "Smart shortage detection and Order Again alerts" },
                { id: "medication", label: "Daily Medication Reminders", desc: "Prescription adherence routine prompts" },
                { id: "chat", label: "Doctor & Patient Messages", desc: "Real-time communication pings" },
              ].map((pref) => (
                <div
                  key={pref.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{pref.label}</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{pref.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[pref.id]}
                      onChange={() => handleTogglePref(pref.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              ))}
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
              ⚠️ <strong>Mandatory Security Notifications:</strong> Account verification and crucial transaction alerts cannot be turned off.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-2 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationCenterModal;
