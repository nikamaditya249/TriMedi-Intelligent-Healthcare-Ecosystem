import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiFileText,
  FiCalendar,
  FiClock,
  FiPlus,
  FiCheckCircle,
  FiZap,
  FiMessageSquare,
  FiActivity,
  FiUserCheck,
  FiPlay,
  FiBell,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import Card, { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import {
  getDashboardStats,
  getPrescriptions,
  getAppointments,
  updateAppointmentStatus,
  getClinicQueue,
  callPatientInQueue,
  startConsultation,
} from "../../api";
import CreatePrescriptionModal from "../../components/prescriptions/CreatePrescriptionModal";
import AIPrescriptionScannerModal from "../../components/ai/AIPrescriptionScannerModal";
import AIAssistantModal from "../../components/ai/AIAssistantModal";
import ConsultationWorkspaceModal from "../../components/consultation/ConsultationWorkspaceModal";

export function DoctorDashboard() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [livePrescriptions, setLivePrescriptions] = useState([]);
  const [liveAppointments, setLiveAppointments] = useState([]);
  const [liveQueue, setLiveQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [consultationWorkspaceAppointment, setConsultationWorkspaceAppointment] = useState(null);

  const doctorEmail = (user?.email || "doctor@trimedi.com").toLowerCase();

  const loadData = useCallback(async () => {
    try {
      const [statsRes, rxRes, aptRes, queueRes] = await Promise.all([
        getDashboardStats("doctor"),
        getPrescriptions({ role: "doctor", doctorEmail }),
        getAppointments({ role: "doctor", doctorEmail }),
        getClinicQueue().catch(() => ({ queue: [] })),
      ]);
      setData(statsRes);
      setLivePrescriptions(Array.isArray(rxRes) ? rxRes : []);
      setLiveAppointments(Array.isArray(aptRes) ? aptRes : []);
      setLiveQueue(Array.isArray(queueRes?.queue) ? queueRes.queue : []);
    } catch (err) {
      console.error("Error loading doctor stats:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization for Queue & Appointments
  useEffect(() => {
    if (!socket) return;
    const handleQueueChange = () => {
      loadData();
    };
    socket.on("queue:updated", handleQueueChange);
    socket.on("queue:patient_added", handleQueueChange);
    socket.on("appointment:checked_in", handleQueueChange);
    socket.on("consultation:completed", handleQueueChange);

    return () => {
      socket.off("queue:updated", handleQueueChange);
      socket.off("queue:patient_added", handleQueueChange);
      socket.off("appointment:checked_in", handleQueueChange);
      socket.off("consultation:completed", handleQueueChange);
    };
  }, [socket, loadData]);

  // Handle appointment confirmation (triggers real-time patient notification via EventBus)
  const handleConfirmAppointment = async (aptId) => {
    try {
      await updateAppointmentStatus(aptId, "confirmed");
      loadData();
    } catch (e) {
      console.error("Error confirming appointment:", e);
    }
  };

  // Call patient to consultation room
  const handleCallPatient = async (queueId) => {
    try {
      setCallingId(queueId);
      await callPatientInQueue(queueId);
      await loadData();
    } catch (err) {
      console.error("Failed to call patient:", err);
    } finally {
      setCallingId(null);
    }
  };

  // Launch Doctor Consultation Workspace
  const handleStartConsultationFromQueue = async (queueItem) => {
    try {
      // Find matching appointment object or construct one
      const appointmentObj = liveAppointments.find(
        (a) => a._id === queueItem.appointmentId || a.id === queueItem.appointmentId
      ) || {
        _id: queueItem.appointmentId,
        id: queueItem.appointmentId,
        patientName: queueItem.patientName,
        patientEmail: queueItem.patientEmail,
        doctorName: queueItem.doctorName || user?.name,
        doctorEmail: queueItem.doctorEmail || user?.email,
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "Now",
        reason: queueItem.notes || "Clinical Consultation",
      };

      // Mark queue item as in_consultation
      if (queueItem.status !== "in_consultation") {
        await startConsultation(queueItem._id);
      }

      setConsultationWorkspaceAppointment(appointmentObj);
      loadData();
    } catch (err) {
      console.error("Error starting consultation:", err);
    }
  };

  const handleLaunchConsultationFromAppointment = (apt) => {
    setConsultationWorkspaceAppointment(apt);
  };

  if (loading) {
    return (
      <LoadingState
        message="Loading clinical practice and e-prescription telemetry..."
        rows={4}
      />
    );
  }

  const { stats } = data || {};

  return (
    <div className="space-y-6">
      {/* 1. Clinical Header */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Doctor Clinical Portal
            </span>
            <span className="text-slate-300">•</span>
            {user?.verificationStatus === "verified" || !user?.verificationStatus ? (
              <Badge variant="brand" size="sm">
                <FiShield className="w-3 h-3 mr-1 inline" /> MD-Verified Specialist
              </Badge>
            ) : user?.verificationStatus === "under_review" ? (
              <Badge variant="warning" size="sm">
                <FiClock className="w-3 h-3 mr-1 inline" /> Credential Under Review
              </Badge>
            ) : (
              <Badge variant="outline" size="sm">
                <FiClock className="w-3 h-3 mr-1 inline" /> Verification Pending
              </Badge>
            )}
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name || "Dr. Sarah Jenkins, MD"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {user?.specialty || "Internal Medicine & Cardiology"} • {user?.hospital || "Metro Health Center"}
            <span className="text-slate-300 mx-1.5">•</span>
            <span className="font-mono text-slate-600">Reg #{user?.licenseNumber || "MED-89241"}</span>
            <span className="text-slate-300 mx-1.5">•</span>
            <span>{user?.qualifications || "MBBS, MD"}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            icon={FiPlus}
          >
            Issue Prescription
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/chat")}
            icon={FiMessageSquare}
          >
            Patient Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiAssistantOpen(true)}
            icon={FiZap}
          >
            AI Assistant
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            icon={FiRefreshCw}
            aria-label="Refresh Queue"
          >
            Sync
          </Button>
        </div>
      </div>

      {/* 2. Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patients in Queue"
          value={liveQueue.filter((q) => q.status === "waiting" || q.status === "called").length}
          subtitle="Waiting for consultation"
          icon={FiUsers}
        />
        <StatCard
          title="In Consultation"
          value={liveQueue.filter((q) => q.status === "in_consultation").length}
          subtitle="Active encounter"
          icon={FiActivity}
        />
        <StatCard
          title="Today's Appointments"
          value={liveAppointments.length || stats?.todayAppointments || 0}
          subtitle="Scheduled roster"
          icon={FiCalendar}
        />
        <StatCard
          title="Prescriptions Issued"
          value={livePrescriptions.length || stats?.prescriptionsIssued || 0}
          subtitle="Signed e-prescriptions"
          icon={FiFileText}
        />
      </div>

      {/* 3. Live Clinic Waiting Queue & Clinical Encounters (Phase 2 Core Workflow) */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center">
              <FiActivity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Clinic Waiting Room & Triage Queue</h3>
              <p className="text-xs text-slate-500">
                Patients checked in by reception awaiting examination
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {liveQueue.filter((q) => q.status !== "completed").length} Active in Clinic
          </span>
        </div>

        {liveQueue.filter((q) => q.status !== "completed").length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FiUserCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Patients Currently Waiting</p>
            <p className="text-xs text-slate-400 mt-1">
              Checked-in patients from reception desk will immediately appear here via real-time sync.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Token #</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Check-In</th>
                  <th className="py-2.5 px-3">Est. Wait</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {liveQueue
                  .filter((q) => q.status !== "completed")
                  .map((item) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.status === "in_consultation" ? "bg-teal-50/40" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-brand-800 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                          #{item.queueNumber || "Q-1"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.patientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.patientEmail}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        ~{item.estimatedWaitMinutes || 10} mins
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge type="queue" status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        {item.status === "waiting" && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={FiBell}
                            disabled={callingId === item._id}
                            onClick={() => handleCallPatient(item._id)}
                          >
                            {callingId === item._id ? "Calling..." : "Call"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="primary"
                          icon={FiPlay}
                          onClick={() => handleStartConsultationFromQueue(item)}
                        >
                          {item.status === "in_consultation" ? "Resume Exam" : "Start Encounter"}
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. Two Column Layout: Today's Schedule & Consultation Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Schedule */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
                <FiCalendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Consultation Schedule</h3>
                <p className="text-xs text-slate-500">Upcoming patient appointments</p>
              </div>
            </div>
            <Link
              to="/app/doctor/appointments"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              Full Calendar →
            </Link>
          </div>

          <div className="space-y-2.5">
            {liveAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No appointments scheduled for today.</p>
            ) : (
              liveAppointments.slice(0, 4).map((apt) => (
                <div
                  key={apt._id}
                  className="p-3.5 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{apt.patientName}</span>
                      <StatusBadge type="appointment" status={apt.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500">{apt.reason || "General Consultation"}</p>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {apt.appointmentDate || apt.date} • {apt.timeSlot || apt.time}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {apt.status === "scheduled" ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleConfirmAppointment(apt._id)}
                      >
                        Confirm
                      </Button>
                    ) : apt.status === "checked_in" || apt.status === "waiting" || apt.status === "in_consultation" ? (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={FiPlay}
                        onClick={() => handleLaunchConsultationFromAppointment(apt)}
                      >
                        Workspace
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <FiCheckCircle className="w-3.5 h-3.5" /> Confirmed
                      </span>
                    )}
                    <button
                      onClick={() => navigate("/app/chat")}
                      className="text-[11px] text-brand-700 hover:text-brand-800 font-medium transition-colors"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Patient Consultation Messages */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
                <FiMessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Patient Inquiries</h3>
                <p className="text-xs text-slate-500">Real-time doctor-patient messages</p>
              </div>
            </div>
            <Link
              to="/app/chat"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              Open Inbox →
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-brand-700 text-white font-bold flex items-center justify-center text-xs">
                  AN
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Aditya Nikam</h4>
                  <p className="text-[11px] text-slate-400">Prescription RX-9041 • 35m ago</p>
                </div>
              </div>
              <Badge variant="warning" size="sm">
                Awaiting Reply
              </Badge>
            </div>
            <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
              "Thank you Dr. Jenkins. Should I continue with the prescribed dosage if morning dizziness occurs?"
            </p>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => navigate("/app/chat")}
            >
              Reply Instantly via Real-Time Chat
            </Button>
          </div>
        </Card>
      </div>

      {/* Phase 2: Doctor Consultation Workspace Modal */}
      {consultationWorkspaceAppointment && (
        <ConsultationWorkspaceModal
          isOpen={!!consultationWorkspaceAppointment}
          appointment={consultationWorkspaceAppointment}
          onClose={() => setConsultationWorkspaceAppointment(null)}
          onCompleted={() => {
            setConsultationWorkspaceAppointment(null);
            loadData();
          }}
        />
      )}

      {/* Modals */}
      <CreatePrescriptionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => loadData()}
      />
      <AIPrescriptionScannerModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onPrescriptionConfirmed={() => loadData()}
      />
      <AIAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
      />
    </div>
  );
}

export default DoctorDashboard;
