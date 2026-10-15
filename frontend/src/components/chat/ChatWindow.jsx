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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              ←
            </button>
          )}
          <div className="relative">
            <Avatar name={partnerName} size="md" />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                isPartnerOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{partnerName}</h3>
              <Badge variant={user?.role === "doctor" ? "primary" : "neutral"} size="sm">
                {user?.role === "doctor" ? "Verified Patient" : "Cardiologist"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isPartnerOnline ? (
                <span className="text-emerald-500 font-medium">● Online now</span>
              ) : (
                "Offline • Messages saved securely"
              )}
            </p>
          </div>
        </div>

        {/* Clinical Context & AI Tool Shortcuts */}
        <div className="flex items-center gap-2">
          {user?.role === "patient" && (
            <button
              onClick={() => setShowAiDraft(!showAiDraft)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition flex items-center gap-1.5"
            >
              <span>✨</span>
              <span className="hidden sm:inline">AI Question Helper</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Assistance Drawer */}
      {showAiDraft && (
        <div className="p-3 bg-teal-50/80 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900/50">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1">
              <span>✨</span> AI Question Formulator (Assistive Only)
            </h4>
            <button
              onClick={() => setShowAiDraft(false)}
              className="text-xs text-teal-700 dark:text-teal-400 hover:underline"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-[11px] text-teal-800 dark:text-teal-400 mb-2">
            Describe what you want to ask in simple words; AI will draft a concise message for your doctor:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., I feel dizzy 30 mins after taking morning pills..."
              value={aiDraftPrompt}
              onChange={(e) => setAiDraftPrompt(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <Button variant="primary" size="sm" onClick={handleGenerateAiDraft} disabled={aiDrafting}>
              {aiDrafting ? "Drafting..." : "Draft Query"}
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-slate-900/30">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-xs text-slate-400">
            Loading secure conversation history...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center text-xl mb-2">
              💬
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No previous messages in this consultation
            </p>
            <p className="text-[11px] text-slate-400">Send a greeting to begin communication.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderEmail?.toLowerCase() === userEmail;
            return (
              <div
                key={msg._id || idx}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[10px] font-semibold text-slate-400">
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
                  className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? "bg-teal-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-tl-none"
                  }`}
                >
                  {msg.messageType === "prescription" && (
                    <div className="mb-1 pb-1 border-b border-white/20 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>📋</span> Prescription Reference
                    </div>
                  )}
                  {msg.messageType === "appointment" && (
                    <div className="mb-1 pb-1 border-b border-white/20 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>📅</span> Consultation Follow-up
                    </div>
                  )}
                  {msg.content}
                </div>
                {isMe && msg.isRead && (
                  <span className="text-[9px] text-teal-600 dark:text-teal-400 mt-0.5 px-1">✓ Read</span>
                )}
              </div>
            );
          })
        )}
        {partnerTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic px-2 py-1">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
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
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Message ${partnerName}...`}
          className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <Button variant="primary" size="md" type="submit" disabled={!inputText.trim()}>
          Send ➔
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;
