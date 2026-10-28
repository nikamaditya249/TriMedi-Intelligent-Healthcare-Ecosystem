import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import ChatWindow from "../../components/chat/ChatWindow";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getConversations } from "../../api";

const ChatPage = () => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const userEmail = (user?.email || "patient@trimedi.com").toLowerCase();

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations(userEmail, user?.role || "patient");
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !activeConv) {
          setActiveConv(data.conversations[0]);
        }
      }
    } catch (e) {
      console.error("Fetch conversations error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [userEmail]);

  const filteredConversations = conversations.filter((c) => {
    const partnerName = c.patientEmail === userEmail ? c.doctorName : c.patientName;
    return partnerName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] flex flex-col bg-[#F8FAFC]">
      {/* Top Banner */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>💬</span> TriMedi Doctor-Patient Consultation Chat
          </h1>
          <p className="text-xs text-slate-500">
            End-to-end authorized clinical communication and medication follow-ups
          </p>
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div
          className={`md:col-span-4 bg-white border border-slate-200/90 rounded-2xl shadow-subtle flex flex-col overflow-hidden ${
            activeConv ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-slate-100 bg-white">
            <input
              type="text"
              placeholder="Search consultations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading consultations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No conversations found</div>
            ) : (
              filteredConversations.map((c) => {
                const partnerEmail = c.patientEmail === userEmail ? c.doctorEmail : c.patientEmail;
                const partnerName = c.patientEmail === userEmail ? c.doctorName : c.patientName;
                const isSelected = activeConv?._id === c._id;
                const isOnline = partnerEmail ? onlineUsers.has(partnerEmail.toLowerCase()) : false;

                return (
                  <div
                    key={c._id}
                    onClick={() => setActiveConv(c)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-center gap-3 ${
                      isSelected
                        ? "bg-teal-50/80 border border-teal-200 text-teal-950 font-semibold shadow-xs"
                        : "hover:bg-slate-50 border border-transparent text-slate-700"
                    }`}
                  >
                    <div className="relative">
                      <Avatar name={partnerName} size="md" />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          isOnline ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {partnerName}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.lastMessageAt || Date.now()).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {c.lastMessage || "Start conversation"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window */}
        <div
          className={`md:col-span-8 flex flex-col h-full ${
            !activeConv ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConv ? (
            <ChatWindow conversation={activeConv} onBack={() => setActiveConv(null)} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200/90 rounded-2xl p-6 text-center shadow-subtle">
              <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center text-2xl mb-3">
                💬
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Select a consultation to view messages
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Communicate securely with your doctor regarding active prescriptions, dosage questions, or appointment updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
