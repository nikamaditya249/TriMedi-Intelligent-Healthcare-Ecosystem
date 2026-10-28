import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { getMessages, sendMessage, draftDoctorQuestionWithAI } from "../../api";

const ChatWindow = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [aiDraftPrompt, setAiDraftPrompt] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const userEmail = (user?.email || "patient@trimedi.com").toLowerCase();
  const partnerEmail =
    conversation?.patientEmail?.toLowerCase() === userEmail
      ? conversation?.doctorEmail?.toLowerCase()
      : conversation?.patientEmail?.toLowerCase();

  const partnerName =
    conversation?.patientEmail?.toLowerCase() === userEmail
      ? conversation?.doctorName || "Dr. Sarah Jenkins"
      : conversation?.patientName || "Aditya Nikam";

  const isPartnerOnline = partnerEmail ? onlineUsers.has(partnerEmail) : false;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversation messages
  const fetchMessages = async () => {
    if (!conversation?._id) return;
    try {
      setLoading(true);
      const data = await getMessages(conversation._id, userEmail);
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Fetch messages error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket Room & Real-time Listeners
  useEffect(() => {
    if (!socket || !conversation?._id) return;

    // Join room
    socket.emit("conversation:join", { conversationId: conversation._id });

    // Incoming Message Listener
    const handleIncomingMessage = (newMsg) => {
      if (
        newMsg.conversation === conversation._id ||
        newMsg.conversationIdString === conversation._id ||
        newMsg.conversation?._id === conversation._id
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        // Send read receipt if received from partner
        if (newMsg.receiverEmail?.toLowerCase() === userEmail) {
          socket.emit("messages:markRead", { conversationId: conversation._id });
        }
      }
    };

    // Typing Listeners
    const handleTypingStart = (data) => {
      if (data.conversationId === conversation._id && data.userEmail !== userEmail) {
        setPartnerTyping(true);
      }
    };

    const handleTypingStop = (data) => {
      if (data.conversationId === conversation._id) {
        setPartnerTyping(false);
      }
    };

    socket.on("message:received", handleIncomingMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.emit("conversation:leave", { conversationId: conversation._id });
      socket.off("message:received", handleIncomingMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket, conversation?._id, userEmail]);

  // Handle Typing Input
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !conversation?._id) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing:start", { conversationId: conversation._id, receiverEmail: partnerEmail });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing:stop", { conversationId: conversation._id });
    }, 1500);
  };

  // Send Message
  const handleSendMessage = async (customContent = null, messageType = "text") => {
    const textToSend = customContent || inputText.trim();
    if (!textToSend || !conversation?._id) return;

    try {
      const payload = {
        conversationId: conversation._id,
        senderEmail: userEmail,
        senderRole: user?.role || "patient",
        senderName: user?.name || (user?.role === "doctor" ? "Doctor" : "Patient"),
        receiverEmail: partnerEmail,
        messageType,
        content: textToSend,
      };

      const data = await sendMessage(payload);
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        if (!customContent) setInputText("");
      }
    } catch (e) {
      console.error("Send message error:", e);
    }
  };

  // AI Assistance: Draft question / reply
  const handleGenerateAiDraft = async () => {
    try {
      setAiDrafting(true);
      const data = await draftDoctorQuestionWithAI({
        symptomTopic: aiDraftPrompt || "medication timing and potential mild dizziness",
        currentMedication: "Atorvastatin 20mg",
        duration: "the last 3 days",
      });
      if (data.success && data.draftedQuestion) {
        setInputText(data.draftedQuestion);
        setShowAiDraft(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiDrafting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-subtle overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200/90 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1 text-slate-500 hover:text-slate-900"
            >
              ←
            </button>
          )}
          <div className="relative">
            <Avatar name={partnerName} size="md" />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isPartnerOnline ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{partnerName}</h3>
              <Badge variant={user?.role === "doctor" ? "primary" : "neutral"} size="sm">
                {user?.role === "doctor" ? "Verified Patient" : "Attending Physician"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              {isPartnerOnline ? (
                <span className="text-emerald-600 font-semibold">● Active in Consultation</span>
              ) : (
                "Encrypted Consultation Channel"
              )}
            </p>
          </div>
        </div>

        {/* Clinical Context & AI Tool Shortcuts */}
        <div className="flex items-center gap-2">
          {user?.role === "patient" && (
            <button
              onClick={() => setShowAiDraft(!showAiDraft)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition flex items-center gap-1.5"
            >
              <span>✨</span>
              <span className="hidden sm:inline">AI Question Assistant</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Assistance Drawer */}
      {showAiDraft && (
        <div className="p-3.5 bg-teal-50/70 border-b border-teal-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1">
              <span>✨</span> AI Question Formulator (Assistive Only)
            </h4>
            <button
              onClick={() => setShowAiDraft(false)}
              className="text-xs text-teal-700 hover:underline font-semibold"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-[11px] text-teal-800 mb-2">
            Describe what you want to ask in plain language; AI will draft a concise clinical query for your doctor:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., I feel mild dizziness 30 mins after taking morning pills..."
              value={aiDraftPrompt}
              onChange={(e) => setAiDraftPrompt(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-teal-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
            <Button variant="primary" size="sm" onClick={handleGenerateAiDraft} disabled={aiDrafting}>
              {aiDrafting ? "Drafting..." : "Draft Query"}
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area - Very light neutral background */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-xs text-slate-400">
            Loading secure consultation history...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center text-xl mb-2">
              💬
            </div>
            <p className="text-xs font-semibold text-slate-700">
              No previous messages in this consultation
            </p>
            <p className="text-[11px] text-slate-400">Send a message to begin clinical communication.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderEmail?.toLowerCase() === userEmail;
            const isPatientMessage = (msg.senderRole || "").toLowerCase() === "patient" || (!msg.senderRole && isMe && user?.role === "patient");

            return (
              <div
                key={msg._id || idx}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {isMe ? "You" : msg.senderName || "Doctor"}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isPatientMessage
                      ? "bg-teal-50 border border-teal-200/90 text-teal-950 font-medium " + (isMe ? "rounded-tr-xs" : "rounded-tl-xs")
                      : "bg-white border border-slate-200/90 text-slate-800 font-medium " + (isMe ? "rounded-tr-xs" : "rounded-tl-xs")
                  }`}
                >
                  {msg.messageType === "prescription" && (
                    <div className="mb-1 pb-1 border-b border-teal-200/50 text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                      <span>📋</span> Prescription Reference
                    </div>
                  )}
                  {msg.messageType === "appointment" && (
                    <div className="mb-1 pb-1 border-b border-slate-200/60 text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <span>📅</span> Consultation Follow-up
                    </div>
                  )}
                  {msg.content}
                </div>
                {isMe && msg.isRead && (
                  <span className="text-[9px] text-teal-700 font-semibold mt-0.5 px-1">✓ Read</span>
                )}
              </div>
            );
          })
        )}
        {partnerTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic px-2 py-1">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            {partnerName} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-200/90 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Message ${partnerName}...`}
          className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white"
        />
        <Button
          variant="primary"
          size="md"
          type="submit"
          disabled={!inputText.trim()}
          className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
        >
          Send ➔
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;
