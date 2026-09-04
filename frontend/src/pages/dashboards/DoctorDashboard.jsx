import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiFileText,
  FiCalendar,
  FiClock,
  FiPlus,
  FiCheckCircle,
  FiUserCheck,
  FiZap,
  FiMessageSquare,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import Card, { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import { getDashboardStats, getPrescriptions, getAppointments } from "../../api";
import CreatePrescriptionModal from "../../components/prescriptions/CreatePrescriptionModal";
import AIPrescriptionScannerModal from "../../components/ai/AIPrescriptionScannerModal";
import AIAssistantModal from "../../components/ai/AIAssistantModal";

export function DoctorDashboard() {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [livePrescriptions, setLivePrescriptions] = useState([]);
  const [liveAppointments, setLiveAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const doctorEmail = (user?.email || "doctor@trimedi.com").toLowerCase();

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, rxRes, aptRes] = await Promise.all([
        getDashboardStats("doctor"),
        getPrescriptions({ role: "doctor", doctorEmail }),
        getAppointments({ role: "doctor", doctorEmail }),
      ]);
      setData(statsRes);
      setLivePrescriptions(Array.isArray(rxRes) ? rxRes : []);
      setLiveAppointments(Array.isArray(aptRes) ? aptRes : []);
    } catch (err) {
      console.error("Error loading doctor stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [doctorEmail]);

  // Handle appointment confirmation (triggers real-time patient notification)
  const handleConfirmAppointment = async (aptId) => {
    try {
      await fetch(`http://localhost:5001/api/appointments/${aptId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <LoadingState message="Loading clinical practice and e-prescription telemetry..." rows={4} />;
  }

  const { stats, recentPatients = [] } = data || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-200 mb-3 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-teal-400 animate-pulse" : "bg-amber-400"}`}></span>
            Doctor Clinical Hub (MD Verified) • Real-Time Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Welcome, {user?.name || "Dr. Sarah Jenkins, MD"}
          </h1>
          <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
            {user?.specialty || "Internal Medicine & Cardiology"} • {user?.hospital || "Metro Health Center"}
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold"
              onClick={() => setCreateModalOpen(true)}
              icon={FiPlus}
            >
              Issue Digital Prescription
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20"
              onClick={() => navigate("/app/chat")}
              icon={FiMessageSquare}
            >
              Patient Chat
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/10"
              onClick={() => setAiAssistantOpen(true)}
              icon={FiZap}
            >
              AI Clinical Assistant
            </Button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <FiUserCheck className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 142}
          subtitle="Registered under care"
          icon={FiUsers}
          color="doctor"
        />
        <StatCard
          title="Prescriptions Issued"
          value={livePrescriptions.length || stats?.prescriptionsIssued || 389}
          subtitle="Signed e-prescriptions"
          icon={FiFileText}
          color="brand"
        />
        <StatCard
          title="Scheduled Consultations"
          value={liveAppointments.length || stats?.todayAppointments || 8}
          subtitle="Active appointments"
          icon={FiCalendar}
          color="patient"
        />
        <StatCard
          title="Pending Reviews"
          value={stats?.pendingReviews || 3}
          subtitle="Lab reports & follow-ups"
          icon={FiClock}
          color="amber"
        />
      </div>

      {/* Two Column Layout: Today's Schedule & Consultation Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Schedule */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 flex items-center justify-center">
                <FiCalendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Consultation Schedule</h3>
                <p className="text-xs text-slate-400">Manage patient booking status</p>
              </div>
            </div>
            <Link
              to="/app/doctor/appointments"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Full Calendar →
            </Link>
          </div>

          <div className="space-y-3">
            {liveAppointments.slice(0, 3).map((apt) => (
              <div
                key={apt._id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{apt.patientName}</span>
                    <Badge variant={apt.status === "confirmed" ? "success" : "neutral"} size="sm">
                      {apt.type}
                    </Badge>
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
                      className="text-xs bg-teal-600 hover:bg-teal-500"
                      onClick={() => handleConfirmAppointment(apt._id)}
                    >
                      Confirm Visit
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5" /> Confirmed
                    </span>
                  )}
                  <button
                    onClick={() => navigate("/app/chat")}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Patient Consultation Messages */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 flex items-center justify-center">
                <FiMessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Patient Inquiries</h3>
                <p className="text-xs text-slate-400">Doctor-Patient real-time communication</p>
              </div>
            </div>
            <Link
              to="/app/chat"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Open Inbox →
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                  AN
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Aditya Nikam</h4>
                  <p className="text-[10px] text-slate-400">Prescription RX-9041 • 35m ago</p>
                </div>
              </div>
              <Badge variant="warning" size="sm">
                Awaiting Reply
              </Badge>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              "Thank you Dr. Jenkins. Should I continue with the prescribed dosage if morning dizziness occurs?"
            </p>
            <Button
              variant="primary"
              size="sm"
              className="w-full bg-teal-600 hover:bg-teal-500"
              onClick={() => navigate("/app/chat")}
            >
              Reply Instantly via Real-Time Chat ➔
            </Button>
          </div>
        </Card>
      </div>

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
