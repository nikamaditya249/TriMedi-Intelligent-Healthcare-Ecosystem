import React, { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { getNotificationPreferences, updateNotificationPreferences } from "../../api";

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

  const userEmail = (user?.email || "patient@trimedi.com").toLowerCase();

  // Load preferences from backend when modal opens
  useEffect(() => {
    if (!isOpen) return;
    async function loadPrefs() {
      try {
        const res = await getNotificationPreferences(userEmail);
        if (res && res.success && res.preferences) {
          setPreferences((prev) => ({ ...prev, ...res.preferences }));
        }
      } catch (err) {
        console.warn("Failed to load notification preferences:", err.message);
      }
    }
    loadPrefs();
  }, [isOpen, userEmail]);

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
        return <Badge variant="default" size="sm">Normal</Badge>;
    }
  };

  const handleTogglePref = async (cat) => {
    const updated = { ...preferences, [cat]: !preferences[cat] };
    setPreferences(updated);
    try {
      await updateNotificationPreferences({ userEmail, preferences: updated });
    } catch (err) {
      console.warn("Failed to persist notification preferences:", err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Healthcare Notifications & Alerts" maxWidth="max-w-2xl">
      <div className="flex flex-col h-[520px]">
        {/* Top Tabs: Activity Feed vs Preferences */}
        <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3 mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                activeTab === "notifications"
                  ? "bg-[#087F73] text-white shadow-xs"
                  : "bg-[#F1F5F9] text-[#52627A] hover:bg-[#E8F7F4] hover:text-[#06665D]"
              }`}
            >
              Activity Feed ({unreadNotifCount} unread)
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                activeTab === "preferences"
                  ? "bg-[#087F73] text-white shadow-xs"
                  : "bg-[#F1F5F9] text-[#52627A] hover:bg-[#E8F7F4] hover:text-[#06665D]"
              }`}
            >
              ⚙️ Preferences
            </button>
          </div>

          {activeTab === "notifications" && unreadNotifCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-[#087F73] hover:text-[#06665D] hover:underline font-semibold"
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
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    selectedCategory === cat.id
                      ? "bg-[#087F73] text-white shadow-xs"
                      : "bg-[#F1F5F9] text-[#52627A] hover:bg-[#E8F7F4] hover:text-[#06665D]"
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
                  <div className="w-12 h-12 rounded-xl bg-[#E8F7F4] text-[#087F73] flex items-center justify-center text-xl mb-3 border border-[#9AD9D1]/60">
                    📭
                  </div>
                  <p className="text-sm font-semibold text-[#52627A]">
                    No notifications in this category
                  </p>
                  <p className="text-xs text-[#718096] mt-1">
                    You're all caught up with your healthcare updates.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isUnread = !notif.isRead;
                  return (
                    <div
                      key={notif._id}
                      onClick={() => isUnread && markAsRead(notif._id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                        isUnread
                          ? "bg-[#F3FBF9] border-[#9AD9D1] shadow-xs"
                          : "bg-white border-[#D9E2EC] hover:border-[#C5D1DE]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                          isUnread
                            ? "bg-[#E8F7F4] text-[#087F73] border border-[#9AD9D1]"
                            : "bg-[#F1F5F9] text-[#52627A] border border-[#D9E2EC]"
                        }`}
                      >
                        {getCategoryIcon(notif.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <h4 className="text-xs font-semibold text-[#172033] truncate">
                              {notif.title}
                            </h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#087F73] inline-block flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {getPriorityBadge(notif.priority)}
                            <span className="text-[10px] text-[#718096] font-medium">
                              {new Date(notif.createdAt || Date.now()).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-[#52627A] mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Preferences Tab */
          <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
            <p className="text-xs text-[#52627A] font-medium">
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
              ].map((pref) => {
                const isChecked = Boolean(preferences[pref.id]);
                return (
                  <div
                    key={pref.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[#D9E2EC] bg-white hover:border-[#C5D1DE] transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-semibold text-[#172033]">{pref.label}</h5>
                      <p className="text-[11px] text-[#718096] mt-0.5">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePref(pref.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          isChecked ? "bg-[#087F73]" : "bg-[#CBD5E1]"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full shadow-xs absolute top-0.5 transition-transform duration-200 ${
                            isChecked ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="p-3 bg-[#FFF7E6] border border-[#FDE68A] rounded-xl text-[11px] text-[#B7791F]">
              ⚠️ <strong>Mandatory Security Notifications:</strong> Account verification and crucial transaction alerts cannot be turned off.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#D9E2EC] pt-3 mt-2 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationCenterModal;
