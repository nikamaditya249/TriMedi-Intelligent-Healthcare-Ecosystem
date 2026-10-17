import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiFileText,
  FiPackage,
  FiClock,
  FiRefreshCw,
  FiCalendar,
  FiArrowRight,
  FiZap,
  FiMessageSquare,
  FiAlertTriangle,
  FiUserCheck,
  FiCheckCircle,
  FiEye,
  FiShield,
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
  getOrders,
  getRefillStatus,
} from "../../api";
import AIPrescriptionScannerModal from "../../components/ai/AIPrescriptionScannerModal";
import BookAppointmentModal from "../../components/appointments/BookAppointmentModal";
import OrderAgainModal from "../../components/refill/OrderAgainModal";
import AIAssistantModal from "../../components/ai/AIAssistantModal";
import MedicalRecordTimeline from "../../components/medical-records/MedicalRecordTimeline";
import TodayMedicationSchedule from "../../components/medications/TodayMedicationSchedule";
import MedicationTimelineView from "../../components/medications/MedicationTimelineView";
import PrivacyTrustModal from "../../components/privacy/PrivacyTrustModal";

export function PatientDashboard() {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "medical_record"
  const [data, setData] = useState(null);
  const [medicationSupplies, setMedicationSupplies] = useState([]);
  const [livePrescriptions, setLivePrescriptions] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [orderAgainModalOpen, setOrderAgainModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [selectedRefillItem, setSelectedRefillItem] = useState(null);

  const userEmail = (user?.email || "patient@trimedi.com").toLowerCase();
  const isDoctorOnline = onlineUsers.has("doctor@trimedi.com") || onlineUsers.has("doctor@trimedi.health");

  const loadAllData = async () => {
    try {
      const [statsRes, refillRes, rxRes, apptRes, ordRes] = await Promise.all([
        getDashboardStats("patient"),
        getRefillStatus(userEmail).catch(() => ({ success: false })),
        getPrescriptions({ role: "patient", patientEmail: userEmail }),
        getAppointments({ role: "patient", patientEmail: userEmail }),
        getOrders({ role: "patient", patientEmail: userEmail }),
      ]);

      setData(statsRes);
      if (refillRes && refillRes.success) {
        setMedicationSupplies(refillRes.medicationSupplies || []);
      }
      setLivePrescriptions(Array.isArray(rxRes) ? rxRes : []);
      setUpcomingAppointments(Array.isArray(apptRes) ? apptRes : []);
      setRecentOrders(Array.isArray(ordRes) ? ordRes : []);
    } catch (err) {
      console.error("Error loading patient dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [userEmail]);

  // Realtime updates for clinic queue, appointment status, and issued prescriptions
  useEffect(() => {
    if (!socket) return;
    const handleSync = () => {
      loadAllData();
    };

    socket.on("appointment:updated", handleSync);
    socket.on("appointment:checked_in", handleSync);
    socket.on("consultation:started", handleSync);
    socket.on("consultation:completed", handleSync);
    socket.on("prescription:issued", handleSync);
    socket.on("queue:updated", handleSync);
    socket.on("medication:adherence_updated", handleSync);
    socket.on("notification:new", handleSync);

    return () => {
      socket.off("appointment:updated", handleSync);
      socket.off("appointment:checked_in", handleSync);
      socket.off("consultation:started", handleSync);
      socket.off("consultation:completed", handleSync);
      socket.off("prescription:issued", handleSync);
      socket.off("queue:updated", handleSync);
      socket.off("medication:adherence_updated", handleSync);
      socket.off("notification:new", handleSync);
    };
  }, [socket]);

  const activeClinicVisit = upcomingAppointments.find((a) =>
    ["checked_in", "waiting", "in_consultation"].includes(a.status)
  );

  const handleOpenOrderAgain = (med, rxId) => {
    setSelectedRefillItem({
      prescriptionId: rxId || "demo_rx_atorvastatin",
      medicineName: med.medicineName || med.name,
    });
    setOrderAgainModalOpen(true);
  };

  if (loading) {
    return (
      <LoadingState
        message="Loading patient care telemetry and medication timelines..."
        rows={4}
      />
    );
  }

  // Flatten active medications
  const allActiveMeds = [];
  medicationSupplies.forEach((rx) => {
    rx.medicines?.forEach((m) => {
      allActiveMeds.push({ ...m, prescriptionId: rx.prescriptionId, doctorName: rx.doctorName });
    });
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Patient Care Hub
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-400"}`}></span>
              <span>{isConnected ? "Real-Time Telemetry Active" : "Connecting"}</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || "Aditya Nikam"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Track your ongoing therapy durations, deterministic refill timelines, and connect with certified doctors.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiModalOpen(true)}
            icon={FiFileText}
          >
            Scan Prescription
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/app/chat")}
            icon={FiMessageSquare}
          >
            Consultation Chat
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
            variant="outline"
            size="sm"
            onClick={() => setPrivacyModalOpen(true)}
            icon={FiShield}
          >
            Privacy & Trust
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBookModalOpen(true)}
            icon={FiCalendar}
          >
            Book Visit
          </Button>
        </div>
      </div>

      {/* Real-time Clinic Waiting Room Status (When Patient is Checked In) */}
      {activeClinicVisit && (
        <div className="p-5 rounded-xl border border-teal-300 bg-teal-50/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FiUserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded">
                  Queue Token #{activeClinicVisit.queueNumber || "Q-1"}
                </span>
                <StatusBadge type="appointment" status={activeClinicVisit.status} size="sm" />
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-900 bg-teal-200/70 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Checked In at Clinic
                </span>
              </div>
              <h3 className="text-base font-bold text-teal-950 mt-1">
                Consultation with {activeClinicVisit.doctorName || "Dr. Sarah Jenkins"}
              </h3>
              <p className="text-xs text-teal-800 mt-0.5">
                Estimated wait: ~{activeClinicVisit.estimatedWaitMinutes || 10} minutes. Please remain seated in the reception waiting lounge. The doctor will call your token number shortly.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("medical_record")}
              icon={FiEye}
            >
              View Clinical History
            </Button>
          </div>
        </div>
      )}

      {/* Workflow Tabs: Overview vs My Medications vs Longitudinal Medical Record */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold flex-wrap">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-brand-700 text-brand-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FiActivity className="w-4 h-4" />
          Care Overview & Prescriptions
        </button>
        <button
          onClick={() => setActiveTab("medications")}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "medications"
              ? "border-brand-700 text-brand-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FiPackage className="w-4 h-4" />
          My Medications & Adherence
        </button>
        <button
          onClick={() => setActiveTab("medical_record")}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "medical_record"
              ? "border-brand-700 text-brand-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FiFileText className="w-4 h-4" />
          Longitudinal Medical Record
        </button>
      </div>

      {activeTab === "medical_record" ? (
        <MedicalRecordTimeline patientEmail={userEmail} />
      ) : activeTab === "medications" ? (
        <div className="space-y-6">
          <TodayMedicationSchedule
            onDoseUpdated={loadAllData}
            onOrderAgain={(med) => handleOpenOrderAgain(med, med.prescriptionId)}
          />
          <MedicationTimelineView patientEmail={userEmail} />
        </div>
      ) : (
        <>
      {/* 2. Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Prescriptions"
          value={livePrescriptions.length || 2}
          subtitle="Authorized e-prescriptions"
          icon={FiFileText}
        />
        <StatCard
          title="Ongoing Medications"
          value={allActiveMeds.length || 2}
          subtitle="Active daily therapy courses"
          icon={FiPackage}
        />
        <StatCard
          title="Supply Remaining"
          value="12 Days"
          subtitle="Estimated across fulfilled orders"
          icon={FiClock}
        />
        <StatCard
          title="Refill Status"
          value="Refill Due"
          subtitle="1 medication in refill window"
          icon={FiRefreshCw}
        />
      </div>

      {/* Today's Medication Schedule & Adherence */}
      <TodayMedicationSchedule
        onDoseUpdated={loadAllData}
        onOrderAgain={(med) => handleOpenOrderAgain(med, med.prescriptionId)}
      />

      {/* 3. Proactive Refill Alert Box */}
      <div className="p-4 sm:p-5 rounded-xl border border-amber-200/90 bg-amber-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
            <FiAlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-950">
                Proactive Medication Refill Recommendation
              </h3>
              <Badge variant="warning" size="sm">
                Supply Notice
              </Badge>
            </div>
            <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
              Your prescription for <strong>Atorvastatin 20mg</strong> covers 30 days, while your recent order provides 15 days of supply. Estimated supply remaining: ~12 days.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleOpenOrderAgain({ name: "Atorvastatin 20mg" }, "demo_rx_atorvastatin")}
          icon={FiRefreshCw}
          className="shrink-0"
        >
          Order Again
        </Button>
      </div>

      {/* 4. Medication Supply & Gap Tracker */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Medication Supply Intelligence
              </h2>
              <Badge variant="brand" size="sm">
                Deterministic Engine
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Backend calculation compares prescribed therapy duration with purchased supply to prevent treatment gaps.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
          >
            <span>Medicine Catalog</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 space-y-3.5">
          {allActiveMeds.map((med, idx) => {
            const isLow = med.daysRemaining <= 5 || med.isRefillRecommended;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-brand-700 flex items-center justify-center shrink-0">
                      <FiPackage className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">
                          {med.medicineName}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {med.dosage}
                        </span>
                        <span className="text-xs text-slate-500">• {med.frequency}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Prescribed by <span className="font-medium text-slate-700">{med.doctorName || "Dr. Sarah Jenkins"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    <Badge variant={isLow ? "warning" : "success"} dot size="sm">
                      {med.daysRemaining || 12} Days Left
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenOrderAgain(med, med.prescriptionId)}
                      icon={FiRefreshCw}
                    >
                      Order Again
                    </Button>
                  </div>
                </div>

                {/* Progress bar and details */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between text-slate-500 gap-1">
                    <span>
                      Prescribed: <strong className="text-slate-800">{med.prescribedDuration || 30} Days</strong>
                    </span>
                    <span>
                      Purchased Supply: <strong className="text-slate-800">{med.purchasedSupplyDays || 15} Days</strong>
                    </span>
                    <span className="text-amber-800 font-semibold">
                      Shortage Gap: {med.supplyGapDays || 15} Days
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLow ? "bg-amber-600" : "bg-brand-700"
                      }`}
                      style={{ width: `${Math.max(15, med.supplyPercentage || 75)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 5. Two Column Grid: Upcoming Appointments & Consultation Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
                <FiCalendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upcoming Appointments</h3>
                <p className="text-xs text-slate-500">Doctor consultations & visits</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBookModalOpen(true)}
            >
              + Book Visit
            </Button>
          </div>

          <div className="space-y-2.5">
            {upcomingAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No upcoming appointments scheduled.</p>
            ) : (
              upcomingAppointments.slice(0, 3).map((appt) => (
                <div
                  key={appt._id}
                  className="p-3.5 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">
                        {appt.doctorName || "Dr. Sarah Jenkins"}
                      </span>
                      <StatusBadge type="appointment" status={appt.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500">
                      {appt.appointmentDate || appt.date} at {appt.timeSlot || appt.time} ({appt.type || "In-Person"})
                    </p>
                    <p className="text-[11px] text-brand-700 mt-0.5">{appt.reason || "General Consultation"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/app/chat")}
                  >
                    Chat
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Doctor Consultation Quick Chat */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
                <FiMessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Direct Consultation</h3>
                <p className="text-xs text-slate-500">Authenticated doctor messaging</p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-600">
              {isDoctorOnline ? "● Doctor Online" : "● Offline"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-700 text-white font-bold flex items-center justify-center text-xs">
                SJ
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Dr. Sarah Jenkins, MD</h4>
                <p className="text-[11px] text-slate-500">Cardiology & Internal Medicine</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
              "Please take Atorvastatin daily after dinner and reach out if you have any questions."
            </p>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => navigate("/app/chat")}
            >
              Open Consultation Chat
            </Button>
          </div>
        </Card>
      </div>
      </>
      )}

      {/* Modals */}
      <AIPrescriptionScannerModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onPrescriptionConfirmed={() => loadAllData()}
      />
      <BookAppointmentModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onBooked={() => loadAllData()}
      />
      <OrderAgainModal
        isOpen={orderAgainModalOpen}
        onClose={() => setOrderAgainModalOpen(false)}
        refillItem={selectedRefillItem}
      />
      <AIAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
      />
      <PrivacyTrustModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </div>
  );
}

export default PatientDashboard;
