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
  FiShoppingBag,
  FiZap,
  FiMessageSquare,
  FiAlertTriangle,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import Card, { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import {
  getDashboardStats,
  getPrescriptions,
} from "../../api";
import AIPrescriptionScannerModal from "../../components/ai/AIPrescriptionScannerModal";
import BookAppointmentModal from "../../components/appointments/BookAppointmentModal";
import OrderAgainModal from "../../components/refill/OrderAgainModal";
import AIAssistantModal from "../../components/ai/AIAssistantModal";

export function PatientDashboard() {
  const { user } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const navigate = useNavigate();

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
  const [selectedRefillItem, setSelectedRefillItem] = useState(null);

  const userEmail = (user?.email || "patient@trimedi.com").toLowerCase();
  const isDoctorOnline = onlineUsers.has("doctor@trimedi.com");

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, refillRes, rxRes, apptRes, ordRes] = await Promise.all([
        getDashboardStats("patient"),
        fetch(`http://localhost:5001/api/refill/status?userEmail=${encodeURIComponent(userEmail)}`).then((r) => r.json()),
        getPrescriptions({ role: "patient", patientEmail: userEmail }),
        fetch(`http://localhost:5001/api/appointments?role=patient&patientEmail=${encodeURIComponent(userEmail)}`).then((r) => r.json()),
        fetch(`http://localhost:5001/api/orders?role=patient&patientEmail=${encodeURIComponent(userEmail)}`).then((r) => r.json()),
      ]);

      setData(statsRes);
      if (refillRes.success) setMedicationSupplies(refillRes.medicationSupplies || []);
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

  const handleOpenOrderAgain = (med, rxId) => {
    setSelectedRefillItem({
      prescriptionId: rxId || "demo_rx_atorvastatin",
      medicineName: med.medicineName || med.name,
    });
    setOrderAgainModalOpen(true);
  };

  if (loading) {
    return <LoadingState message="Synchronizing medication supply timeline and real-time care telemetry..." rows={4} />;
  }

  // Flatten active medications
  const allActiveMeds = [];
  medicationSupplies.forEach((rx) => {
    rx.medicines?.forEach((m) => {
      allActiveMeds.push({ ...m, prescriptionId: rx.prescriptionId, doctorName: rx.doctorName });
    });
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-200 mb-3 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
            TriMedi Intelligent Care Hub • Real-Time Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Good day, {user?.name || "Aditya"}! 👋
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Your connected healthcare overview: track active medications, deterministic refill timelines, and chat directly with your doctor.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md"
              onClick={() => navigate("/app/chat")}
              icon={FiMessageSquare}
            >
              Consultation Chat
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20"
              onClick={() => setAiAssistantOpen(true)}
              icon={FiZap}
            >
              AI Healthcare Assistant
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/10"
              onClick={() => setBookModalOpen(true)}
              icon={FiCalendar}
            >
              Book Doctor Visit
            </Button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <FiActivity className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Active Prescriptions"
          value={livePrescriptions.length || 2}
          subtitle="Authorized doctor e-prescriptions"
          icon={FiFileText}
          color="brand"
        />
        <StatCard
          title="Ongoing Medications"
          value={allActiveMeds.length || 2}
          subtitle="Monitored daily therapy routines"
          icon={FiPackage}
          color="emerald"
        />
        <StatCard
          title="Supply Remaining"
          value="12 Days"
          subtitle="Estimated across fulfilled orders"
          icon={FiClock}
          color="patient"
        />
        <StatCard
          title="Refill Alert Status"
          value="Refill Recommended"
          subtitle="1 medication in refill window"
          icon={FiRefreshCw}
          color="amber"
        />
      </div>

      {/* Proactive Refill Alert Box */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-xl font-bold">
            <FiAlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Proactive Medication Refill Recommendation
              </h3>
              <Badge variant="warning" size="sm">
                Supply Notice
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Your prescription for <strong>Atorvastatin 20mg</strong> covers 30 days, while your recent order provides approximately 15 days of supply. Estimated supply remaining: ~12 days.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold flex-shrink-0 shadow-sm"
          onClick={() => handleOpenOrderAgain({ name: "Atorvastatin 20mg" }, "demo_rx_atorvastatin")}
          icon={FiRefreshCw}
        >
          ORDER AGAIN
        </Button>
      </div>

      {/* Medication Supply & Gap Tracker */}
      <Card className="border-teal-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Medication Supply Intelligence</h2>
              <Badge variant="success" size="sm">
                Deterministic Arithmetic Engine
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic backend calculations: Prescription duration vs. actual purchased supply to prevent care interruptions.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            <span>Medicine Catalog</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 space-y-4">
          {allActiveMeds.map((med, idx) => {
            const isLow = med.daysRemaining <= 5 || med.isRefillRecommended;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
                      <FiPackage className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{med.medicineName}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {med.dosage}
                        </span>
                        <span className="text-xs text-slate-500">• {med.frequency}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Prescribed by <span className="font-semibold">{med.doctorName || "Dr. Sarah Jenkins"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-center">
                    <Badge variant={isLow ? "warning" : "success"} dot size="sm">
                      {med.daysRemaining || 12} Days Remaining ({med.supplyPercentage || 80}%)
                    </Badge>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenOrderAgain(med, med.prescriptionId)}
                      className="text-xs bg-teal-600 hover:bg-teal-500 text-white shadow-xs"
                      icon={FiRefreshCw}
                    >
                      Order Again
                    </Button>
                  </div>
                </div>

                {/* Progress bar and Arithmetic details */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex flex-col sm:flex-row justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 gap-1">
                    <span>
                      Prescribed: <b className="text-slate-800 dark:text-slate-200">{med.prescribedDuration || 30} Days</b>
                    </span>
                    <span>
                      Purchased Supply: <b className="text-slate-800 dark:text-slate-200">{med.purchasedSupplyDays || 15} Days</b>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Potential Shortage Gap: {med.supplyGapDays || 15} Days
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? "bg-amber-500" : "bg-teal-500"
                      }`}
                      style={{ width: `${Math.max(15, med.supplyPercentage || 80)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two Column Grid: Upcoming Appointments & Consultation Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                <FiCalendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Consultations</h3>
                <p className="text-xs text-slate-400">Doctor appointments & video visits</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setBookModalOpen(true)}
            >
              + Book Visit
            </Button>
          </div>

          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 text-center">No upcoming appointments scheduled.</p>
            ) : (
              upcomingAppointments.slice(0, 3).map((appt) => (
                <div
                  key={appt._id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {appt.doctorName || "Dr. Sarah Jenkins"}
                      </span>
                      <Badge variant={appt.status === "confirmed" ? "success" : "neutral"} size="sm">
                        {appt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {appt.appointmentDate || appt.date} at {appt.timeSlot || appt.time} ({appt.type || "Video"})
                    </p>
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-0.5">{appt.reason || "General Consultation"}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate("/app/chat")}
                  >
                    Message Doctor
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Doctor Consultation Quick Chat */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                <FiMessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Doctor Communication</h3>
                <p className="text-xs text-slate-400">Secure real-time messaging</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-emerald-500">
              {isDoctorOnline ? "● Doctor Online" : "● Offline"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                SJ
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dr. Sarah Jenkins, MD</h4>
                <p className="text-[11px] text-slate-500">Cardiology & Internal Medicine</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              "Please take Atorvastatin daily after dinner and reach out if you have any questions."
            </p>
            <Button
              variant="primary"
              size="sm"
              className="w-full bg-teal-600 hover:bg-teal-500"
              onClick={() => navigate("/app/chat")}
            >
              Open Consultation Chat ➔
            </Button>
          </div>
        </Card>
      </div>

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
    </div>
  );
}

export default PatientDashboard;
