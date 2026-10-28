import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiUserCheck,
  FiCalendar,
  FiShoppingBag,
  FiLayers,
  FiSettings,
  FiPlus,
  FiCheck,
  FiShield,
  FiZap,
  FiUsers,
  FiClock,
  FiActivity,
  FiMessageSquare,
  FiPlay,
  FiTrash2,
  FiAlertCircle,
  FiEye,
  FiDownload,
  FiX,
  FiRefreshCw,
  FiHeart,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCheckCircle,
  FiAlertTriangle,
  FiUser,
  FiSearch,
} from "react-icons/fi";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  getPrescriptions,
  getAppointments,
  updateAppointmentStatus,
  scheduleFollowupAppointment,
  revokePrescription,
  approvePrescription,
  getOrders,
  updateOrderStatus,
  getProducts,
  updateProductStock,
  cancelOrder,
  verifyDoctorCredential,
} from "../../api";
import CreatePrescriptionModal from "../../components/prescriptions/CreatePrescriptionModal";
import AIPrescriptionScannerModal from "../../components/ai/AIPrescriptionScannerModal";
import BookAppointmentModal from "../../components/appointments/BookAppointmentModal";
import ConsultationWorkspaceModal from "../../components/consultation/ConsultationWorkspaceModal";

// ==========================================
// MODAL: DOCTOR-INITIATED CLINICAL FOLLOW-UP
// ==========================================
function ScheduleFollowupModal({ isOpen, onClose, onScheduled, initialPatient }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    patientName: initialPatient?.name || "Aditya Nikam",
    patientEmail: initialPatient?.email || "aditya@trimedi.health",
    patientPhone: initialPatient?.phone || "+91 98765 43210",
    appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    timeSlot: "10:30 AM",
    type: "follow-up",
    reason: "Cardio Lipid Panel Review & Blood Pressure check",
    notes: "Clinical follow-up scheduled by attending physician",
  });

  useEffect(() => {
    if (initialPatient) {
      setFormData((prev) => ({
        ...prev,
        patientName: initialPatient.name || initialPatient.patientName || prev.patientName,
        patientEmail: initialPatient.email || initialPatient.patientEmail || prev.patientEmail,
        patientPhone: initialPatient.phone || prev.patientPhone,
        reason: initialPatient.diagnosis ? `Follow-up: ${initialPatient.diagnosis}` : prev.reason,
      }));
    }
  }, [initialPatient, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await scheduleFollowupAppointment({
        ...formData,
        doctorName: user?.name || "Dr. Sarah Jenkins, MD",
        doctorEmail: user?.email || "doctor@trimedi.health",
      });
      if (res.success || res.appointment) {
        onScheduled && onScheduled(res.appointment);
        onClose();
      } else {
        setError(res.message || "Failed to schedule follow-up consultation.");
      }
    } catch (err) {
      setError(err.message || "Could not connect to appointment scheduling service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Follow-up: ${formData.patientName}`}
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <p><strong>Patient:</strong> {formData.patientName} ({formData.patientEmail})</p>
          <p><strong>Attending Physician:</strong> {user?.name || "Dr. Sarah Jenkins, MD"}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Follow-up Date"
            type="date"
            required
            value={formData.appointmentDate}
            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Time Slot
            </label>
            <select
              value={formData.timeSlot}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              {["09:00 AM", "10:30 AM", "11:15 AM", "02:00 PM", "03:30 PM", "04:30 PM"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Consultation Mode
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-700"
          >
            <option value="follow-up">Follow-up Review (Clinical)</option>
            <option value="video">Telemedicine Video Encounter</option>
            <option value="in-person">In-Clinic Comprehensive Exam</option>
          </select>
        </div>

        <Input
          label="Clinical Indication / Reason"
          required
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="e.g. Cardio Lipid Panel Review & Prescription Renewal"
        />

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading} icon={FiCalendar}>
            Confirm Follow-up
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// 1. MY DOCTORS VIEW (Patient Care Team)
// ==========================================
export function MyDoctorsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCareTeam() {
      try {
        const userEmail = (user?.email || "aditya@trimedi.health").toLowerCase();
        const [appts, rxs] = await Promise.all([
          getAppointments({ role: "patient", patientEmail: userEmail }),
          getPrescriptions({ role: "patient", patientEmail: userEmail }),
        ]);

        const docMap = new Map();

        if (Array.isArray(appts)) {
          appts.forEach((apt) => {
            if (apt.doctorName) {
              const emailKey = (apt.doctorEmail || apt.doctorName).toLowerCase();
              if (!docMap.has(emailKey)) {
                docMap.set(emailKey, {
                  id: apt.doctorEmail || apt._id,
                  name: apt.doctorName,
                  specialty: apt.doctorSpecialty || "Cardiology & Internal Medicine",
                  hospital: apt.hospital || "Metro Health Center",
                  experience: "14 yrs experience",
                  rating: "4.9 ★ (Verified Specialist)",
                  email: apt.doctorEmail || "doctor@trimedi.health",
                  lastConsult: apt.appointmentDate || "Recent Consultation",
                });
              }
            }
          });
        }

        if (Array.isArray(rxs)) {
          rxs.forEach((rx) => {
            if (rx.doctorName) {
              const emailKey = (rx.doctorEmail || rx.doctorName).toLowerCase();
              if (!docMap.has(emailKey)) {
                docMap.set(emailKey, {
                  id: rx.doctorEmail || rx._id,
                  name: rx.doctorName,
                  specialty: rx.doctorSpecialty || "Cardiology & Internal Medicine",
                  hospital: "Metro Health Center",
                  experience: "14 yrs experience",
                  rating: "4.9 ★ (Verified Specialist)",
                  email: rx.doctorEmail || "doctor@trimedi.health",
                  lastConsult: rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "Recent",
                });
              }
            }
          });
        }

        if (docMap.size === 0) {
          docMap.set("doctor@trimedi.health", {
            id: "doc-1",
            name: "Dr. Sarah Jenkins, MD",
            specialty: "Cardiology & Internal Medicine",
            hospital: "Metro Health Center",
            experience: "14 yrs experience",
            rating: "4.9 ★ (Verified Platform Specialist)",
            email: "doctor@trimedi.health",
            lastConsult: "Available for Booking",
          });
        }

        setDoctors(Array.from(docMap.values()));
      } catch (err) {
        console.error("Failed to load care team doctors:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCareTeam();
  }, [user]);

  const handleOpenBook = (doc) => {
    setSelectedDoc(doc || doctors[0]);
    setBookModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Specialists & Care Team</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Certified doctors overseeing your diagnostic reviews, prescriptions, and refills.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={FiCalendar} onClick={() => handleOpenBook(doctors[0])}>
          Book New Consultation
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading your verified specialists and care team..." rows={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <Card key={doc.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base border border-brand-100">
                    <FiUserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                    <p className="text-xs text-brand-700 font-semibold">{doc.specialty}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500 py-2.5 border-y border-slate-100">
                  <p>📍 {doc.hospital}</p>
                  <p>⏳ {doc.experience} • {doc.rating}</p>
                  <p>
                    🗓️ Last Consultation: <span className="font-semibold text-slate-700">{doc.lastConsult}</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleOpenBook(doc)}
                >
                  Book Visit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => navigate("/app/chat")}
                  icon={FiMessageSquare}
                >
                  Message
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BookAppointmentModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        initialDoctor={selectedDoc}
        onBooked={() => {}}
      />
    </div>
  );
}

// ==========================================
// 2. MY PATIENTS VIEW (Doctor Clinical Registry)
// ==========================================
export function MyPatientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [workspaceEncounter, setWorkspaceEncounter] = useState(null);
  const [createRxPatient, setCreateRxPatient] = useState(null);
  const [scheduleFollowupPatient, setScheduleFollowupPatient] = useState(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const doctorEmail = (user?.email || "doctor@trimedi.health").toLowerCase();
      const [appts, rxs] = await Promise.all([
        getAppointments({ role: "doctor", doctorEmail }),
        getPrescriptions({ role: "doctor", doctorEmail }),
      ]);

      const patientMap = new Map();

      // Seed core clinical patients
      const defaultPatients = [
        {
          id: "pat-1",
          name: "Aditya Nikam",
          email: "aditya@trimedi.health",
          phone: "+91 98765 43210",
          bloodGroup: "O+",
          ageGender: "32 Yrs • Male",
          allergies: ["Penicillin"],
          diagnosis: "Dyslipidemia & Mild Hypertension",
          activeMedications: ["Atorvastatin 20mg", "Telmisartan 40mg"],
          adherencePercentage: 95,
          lastEncounter: "30 Oct 2026",
          nextEncounter: "10 Nov 2026",
        },
        {
          id: "pat-2",
          name: "Meera Sharma",
          email: "meera@gmail.com",
          phone: "+91 98111 55667",
          bloodGroup: "B+",
          ageGender: "28 Yrs • Female",
          allergies: ["None Recorded"],
          diagnosis: "Recurrent Migraine & Aura Examination",
          activeMedications: ["Propranolol 40mg"],
          adherencePercentage: 88,
          lastEncounter: "12 Sep 2026",
          nextEncounter: "Pending Roster",
        },
        {
          id: "pat-3",
          name: "Robert Vance",
          email: "vance@refrigeration.com",
          phone: "+91 98222 33445",
          bloodGroup: "A+",
          ageGender: "58 Yrs • Male",
          allergies: ["Sulfa Drugs"],
          diagnosis: "Prescription Renewal & Routine Checkup",
          activeMedications: ["Metformin 500mg"],
          adherencePercentage: 72,
          lastEncounter: "13 Sep 2026",
          nextEncounter: "Pending Renewal",
        },
      ];

      defaultPatients.forEach((p) => patientMap.set(p.email.toLowerCase(), p));

      if (Array.isArray(appts)) {
        appts.forEach((a) => {
          if (a.patientEmail && !patientMap.has(a.patientEmail.toLowerCase())) {
            patientMap.set(a.patientEmail.toLowerCase(), {
              id: a._id || a.patientEmail,
              name: a.patientName || "Patient",
              email: a.patientEmail,
              phone: a.patientPhone || "+91 98765 43210",
              bloodGroup: "O+",
              ageGender: "Adult",
              allergies: ["None Recorded"],
              diagnosis: a.reason || "General Consultation",
              activeMedications: [],
              adherencePercentage: 90,
              lastEncounter: a.appointmentDate || "Recent",
              nextEncounter: a.status === "scheduled" ? `${a.appointmentDate} (${a.timeSlot})` : "None Scheduled",
            });
          }
        });
      }

      setPatients(Array.from(patientMap.values()));
    } catch (err) {
      console.error("Failed to load doctor's patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Patients & Clinical Registry</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assigned patient population under your active diagnostic review, e-prescriptions, and adherence tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search patient or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading assigned patient registry..." rows={3} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title="No Patients Found"
          description="No patients match your search criteria. Check-in or newly scheduled patients will appear here automatically."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((patient) => {
            const isHighAdherence = (patient.adherencePercentage || 90) >= 80;

            return (
              <Card key={patient.id} className="flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-sm border border-teal-200">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{patient.name}</h3>
                        <p className="text-[11px] text-slate-500 font-mono">{patient.email}</p>
                      </div>
                    </div>
                    <Badge variant="brand" size="sm">
                      {patient.bloodGroup || "O+"}
                    </Badge>
                  </div>

                  <div className="py-2.5 space-y-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Primary Indication
                      </span>
                      <p className="font-semibold text-slate-800">{patient.diagnosis}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Active Medications
                      </span>
                      <p className="text-slate-700">
                        {patient.activeMedications?.length > 0
                          ? patient.activeMedications.join(", ")
                          : "None on file"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">Adherence Score:</span>
                      <Badge variant={isHighAdherence ? "success" : "warning"} size="sm">
                        {patient.adherencePercentage}% Adherent
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Last: {patient.lastEncounter}</span>
                      <span className="font-medium text-brand-800">Next: {patient.nextEncounter}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs"
                      icon={FiPlay}
                      onClick={() =>
                        setWorkspaceEncounter({
                          appointmentId: `apt_${patient.id}`,
                          patientName: patient.name,
                          patientEmail: patient.email,
                          doctorName: user?.name,
                          doctorEmail: user?.email,
                          notes: patient.diagnosis,
                        })
                      }
                    >
                      Encounter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      icon={FiFileText}
                      onClick={() => setCreateRxPatient(patient)}
                    >
                      Prescribe
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      icon={FiCalendar}
                      onClick={() => setScheduleFollowupPatient(patient)}
                    >
                      Follow-up
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-brand-700"
                      icon={FiMessageSquare}
                      onClick={() => navigate("/app/chat")}
                    >
                      Message
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals for Clinical Actions */}
      {workspaceEncounter && (
        <ConsultationWorkspaceModal
          isOpen={!!workspaceEncounter}
          patientQueueItem={workspaceEncounter}
          onClose={() => setWorkspaceEncounter(null)}
          onConsultationCompleted={() => {
            setWorkspaceEncounter(null);
            fetchPatients();
          }}
        />
      )}

      {createRxPatient && (
        <CreatePrescriptionModal
          isOpen={!!createRxPatient}
          initialPatient={createRxPatient}
          onClose={() => setCreateRxPatient(null)}
          onCreated={() => {
            setCreateRxPatient(null);
            fetchPatients();
          }}
        />
      )}

      {scheduleFollowupPatient && (
        <ScheduleFollowupModal
          isOpen={!!scheduleFollowupPatient}
          initialPatient={scheduleFollowupPatient}
          onClose={() => setScheduleFollowupPatient(null)}
          onScheduled={() => {
            setScheduleFollowupPatient(null);
            fetchPatients();
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// 3. APPOINTMENTS VIEW (Role-Segregated)
// ==========================================
export function AppointmentsPage() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all");

  // Modals
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [workspaceEncounter, setWorkspaceEncounter] = useState(null);
  const [scheduleFollowupOpen, setScheduleFollowupOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointments({
        role: activeRole,
        patientEmail: user?.email,
        doctorEmail: user?.email,
      });
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Appointments fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeRole, user]);

  const handleStatusUpdate = async (id, status, reason = "") => {
    try {
      await updateAppointmentStatus(id, status, reason);
      await fetchAppointments();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleCancelAppointment = async (id) => {
    const reason = prompt("Please provide a cancellation reason:", "Rescheduling needed");
    if (!reason) return;
    await handleStatusUpdate(id, "cancelled", reason);
  };

  const filtered = appointments.filter((apt) => {
    const s = (apt.status || "scheduled").toLowerCase();
    if (filterTab === "scheduled") return s === "scheduled";
    if (filterTab === "confirmed") return s === "confirmed";
    if (filterTab === "completed") return s === "completed";
    if (filterTab === "cancelled") return s === "cancelled";
    return true;
  });

  // -------------------------------------------------------------
  // DOCTOR APPOINTMENTS WORKFLOW (Section 4 Compliance)
  // -------------------------------------------------------------
  if (activeRole === "doctor") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clinical Consultations & Appointments</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your schedule, consultations, patient visits and follow-ups.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              icon={FiClock}
              onClick={() => alert("Doctor availability management: Your consultation calendar slots are active (Mon-Sat, 09:00 AM - 05:00 PM).")}
            >
              Manage Availability
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FiCalendar}
              onClick={() => setFilterTab("all")}
            >
              View Calendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleFollowupOpen(true)}
            >
              Schedule Follow-up
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={FiRefreshCw}
              onClick={fetchAppointments}
            >
              Sync
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "All Appointments" },
            { id: "confirmed", label: "Confirmed Consultations" },
            { id: "scheduled", label: "Scheduled (Pending Confirmation)" },
            { id: "completed", label: "Completed Encounters" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                filterTab === tab.id
                  ? "bg-brand-700 text-white shadow-subtle"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState message="Loading doctor practice calendar..." rows={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No Appointments Found"
            description="There are no consultations matching the selected filter."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((apt) => {
              const status = (apt.status || "scheduled").toLowerCase();
              const isConfirmed = status === "confirmed";
              const isScheduled = status === "scheduled";
              const isCompleted = status === "completed";
              const isCancelled = status === "cancelled";
              const isInConsultation = status === "in_consultation" || status === "checked_in";

              return (
                <Card key={apt._id} className="flex flex-col justify-between space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="brand" size="sm" className="uppercase font-mono">
                        {(apt.type || "VIDEO").toUpperCase()}
                      </Badge>
                      <StatusBadge type="appointment" status={apt.status} size="sm" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{apt.patientEmail || "patient@trimedi.health"}</p>

                    <div className="p-3 my-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <p>
                        🗓️ <strong>Date:</strong> {apt.appointmentDate || apt.date || "Scheduled"}
                      </p>
                      <p>
                        ⏰ <strong>Time:</strong> <span className="font-bold text-slate-900">{apt.timeSlot || apt.time || "10:30 AM"}</span>
                      </p>
                      <p className="text-slate-600 pt-1 border-t border-slate-200/60">
                        <strong>Reason:</strong> {apt.reason || "Clinical Consultation & Diagnostic Review"}
                      </p>
                    </div>

                    {isCancelled && apt.notes && (
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                        <strong>Cancellation Note:</strong> {apt.notes}
                      </div>
                    )}
                  </div>

                  {/* Doctor State-Dependent Action Controls (Sections 4 & 5 Compliance) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate("/app/doctor/patients")}
                      icon={FiUser}
                    >
                      Open Patient
                    </Button>

                    {isScheduled && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleStatusUpdate(apt._id, "confirmed")}
                        >
                          Confirm Slot
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => navigate("/app/chat")}
                          icon={FiMessageSquare}
                        >
                          Message
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-rose-600 hover:bg-rose-50"
                          onClick={() => handleCancelAppointment(apt._id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {(isConfirmed || isInConsultation) && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 text-xs"
                          icon={FiPlay}
                          onClick={() =>
                            setWorkspaceEncounter({
                              appointmentId: apt._id,
                              patientName: apt.patientName,
                              patientEmail: apt.patientEmail,
                              doctorName: user?.name,
                              doctorEmail: user?.email,
                              notes: apt.reason,
                            })
                          }
                        >
                          {isInConsultation ? "Resume Encounter" : "Start Consultation"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => navigate("/app/chat")}
                          icon={FiMessageSquare}
                        >
                          Message
                        </Button>
                      </>
                    )}

                    {isCompleted && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => navigate("/app/doctor/prescriptions")}
                          icon={FiFileText}
                        >
                          View Prescription
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-brand-700"
                          onClick={() => navigate("/app/chat")}
                          icon={FiMessageSquare}
                        >
                          Message
                        </Button>
                      </>
                    )}

                    {isCancelled && (
                      <span className="text-xs text-slate-400 italic self-center">
                        Encounter Cancelled
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Doctor Consultation Workspace Modal */}
        {workspaceEncounter && (
          <ConsultationWorkspaceModal
            isOpen={!!workspaceEncounter}
            patientQueueItem={workspaceEncounter}
            onClose={() => setWorkspaceEncounter(null)}
            onConsultationCompleted={() => {
              setWorkspaceEncounter(null);
              fetchAppointments();
            }}
          />
        )}

        {scheduleFollowupOpen && (
          <ScheduleFollowupModal
            isOpen={scheduleFollowupOpen}
            onClose={() => setScheduleFollowupOpen(false)}
            onScheduled={() => fetchAppointments()}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // PATIENT APPOINTMENTS WORKFLOW (Section 5 Compliance)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Consultations & Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Book visits with certified specialists, join telemedicine video consultations, and track care history.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setBookModalOpen(true)}>
          Book Consultation
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading your consultation roster..." rows={3} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={FiCalendar}
          title="No Scheduled Consultations"
          description="You have no consultations on file. Book a visit with one of our certified medical practitioners."
          actionLabel="Book Consultation"
          onAction={() => setBookModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((apt) => {
            const status = (apt.status || "scheduled").toLowerCase();
            const isConfirmed = status === "confirmed";
            const isScheduled = status === "scheduled";
            const isCompleted = status === "completed";
            const isCancelled = status === "cancelled";

            return (
              <Card key={apt._id} className="flex flex-col justify-between space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="brand" size="sm" className="uppercase font-mono">
                      {(apt.type || "VIDEO").toUpperCase()}
                    </Badge>
                    <StatusBadge type="appointment" status={apt.status} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{apt.doctorName}</h3>
                  <p className="text-xs text-brand-700 font-semibold">{apt.doctorSpecialty || "Internal Medicine"}</p>
                  <p className="text-[11px] text-slate-400">{apt.hospital || "Metro Health Center"}</p>

                  <div className="p-3 my-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <p>
                      🗓️ <strong>Date:</strong> {apt.appointmentDate || apt.date}
                    </p>
                    <p>
                      ⏰ <strong>Slot:</strong> <span className="font-bold text-slate-900">{apt.timeSlot || apt.time}</span>
                    </p>
                    <p className="text-slate-500 text-[11px]">Reason: {apt.reason}</p>
                  </div>
                </div>

                {/* Patient State-Dependent Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {isConfirmed && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs"
                        icon={FiPlay}
                        onClick={() => navigate("/app/chat")}
                      >
                        Join Video Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => navigate("/app/chat")}
                        icon={FiMessageSquare}
                      >
                        Message
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => handleCancelAppointment(apt._id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}

                  {isScheduled && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => navigate("/app/chat")}
                        icon={FiMessageSquare}
                      >
                        Message Doctor
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => handleCancelAppointment(apt._id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}

                  {isCompleted && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => navigate("/app/patient/prescriptions")}
                        icon={FiFileText}
                      >
                        Prescriptions
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs"
                        onClick={() => setBookModalOpen(true)}
                        icon={FiCalendar}
                      >
                        Book Follow-up
                      </Button>
                    </>
                  )}

                  {isCancelled && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setBookModalOpen(true)}
                    >
                      Book Again
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BookAppointmentModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onBooked={() => fetchAppointments()}
      />
    </div>
  );
}

// ==========================================
// 4. PRESCRIPTIONS VIEW (Role-Segregated)
// ==========================================
export function PrescriptionsPage() {
  const { user, activeRole } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [orderedRxId, setOrderedRxId] = useState(null);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await getPrescriptions({
        role: activeRole,
        patientEmail: user?.email,
        doctorEmail: user?.email,
      });
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Prescriptions load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [activeRole, user]);

  // Doctor Action: Revoke Prescription
  const handleRevokePrescription = async (rxId) => {
    const reason = prompt("Enter clinical reason for revoking this prescription:", "Therapy modified or discontinued by physician");
    if (!reason) return;
    try {
      await revokePrescription(rxId, reason);
      await fetchPrescriptions();
    } catch (err) {
      alert("Failed to revoke prescription: " + err.message);
    }
  };

  // Doctor Action: Sign/Approve Draft Prescription
  const handleApproveDraft = async (rxId) => {
    try {
      await approvePrescription(rxId, "Clinically approved by attending physician");
      await fetchPrescriptions();
    } catch (err) {
      alert("Failed to approve prescription: " + err.message);
    }
  };

  // Patient Action: Prescription-to-Order Cart Transfer
  const handleOrderFromPrescription = (rx) => {
    (rx.items || []).forEach((item) => {
      addToCart({
        _id: item.medicineId || "med_" + Math.random(),
        name: item.medicineName,
        price: item.dosage?.includes("20mg") ? 180 : item.dosage?.includes("500mg") ? 120 : 60,
        qty: item.quantityPrescribed ? Math.max(1, Math.round(item.quantityPrescribed / 30)) : 1,
        supplyDays: item.durationDays || 15,
        prescriptionRef: rx._id,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
      });
    });

    setOrderedRxId(rx._id);
    setTimeout(() => {
      setOrderedRxId(null);
      navigate("/cart");
    }, 500);
  };

  // -------------------------------------------------------------
  // DOCTOR PRESCRIPTIONS WORKFLOW (Section 6 Compliance)
  // -------------------------------------------------------------
  if (activeRole === "doctor") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Digital Clinical Prescriptions</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Authored and signed e-prescriptions with diagnostic rationale, medication dosages, and clinical audit history.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={FiZap}
              onClick={() => setAiModalOpen(true)}
            >
              AI Prescription Scanner
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FiPlus}
              onClick={() => setCreateModalOpen(true)}
            >
              Issue Prescription
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading authenticated prescription registry..." rows={3} />
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="No Prescriptions on File"
            description="You have not issued any digital prescriptions yet. Author an e-prescription or scan documents using TriMedi AI."
            actionLabel="Issue First Prescription"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => {
              const status = (rx.status || "active").toLowerCase();
              const isDraft = status === "draft";
              const isActive = status === "active" || status === "issued";
              const isRevoked = status === "revoked";

              return (
                <Card key={rx._id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">{rx._id}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs font-semibold text-brand-800">{rx.diagnosis}</span>
                      <StatusBadge type="prescription" status={rx.status || "active"} size="sm" />
                      {rx.aiExtracted && (
                        <Badge variant="brand" size="sm">
                          AI Extracted
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Valid Until: <span className="font-semibold text-slate-700">{new Date(rx.validUntil || Date.now()).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p><strong>Patient:</strong> {rx.patientName} ({rx.patientEmail || "patient@trimedi.health"})</p>
                      <p><strong>Attending Physician:</strong> {rx.doctorName || user?.name} ({rx.doctorSpecialty || "Cardiology"})</p>
                      {rx.approvedBy && (
                        <p className="text-[11px] text-slate-500">
                          ✓ Clinically signed by: <span className="font-mono">{rx.approvedBy}</span>
                        </p>
                      )}
                      {rx.notes && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200/70">
                          <span className="font-bold block text-slate-700">Clinical Advice:</span>
                          {rx.notes}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prescribed Medication Regimen:</p>
                      <div className="space-y-2">
                        {rx.items?.map((it, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{it.medicineName}</span>
                              <span className="ml-2 font-semibold text-slate-600">{it.dosage}</span>
                              <p className="text-slate-500 text-[11px]">{it.frequency} • {it.instructions}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="brand" size="sm">
                                {it.durationDays} Days
                              </Badge>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{it.quantityPrescribed} Units</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Doctor Clinical Actions Bar (NO Commerce Actions) */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tamper-evident audit ID: {rx._id}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => window.print()}>
                        Print Rx
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => navigate("/app/chat")}
                        icon={FiMessageSquare}
                      >
                        Message Patient
                      </Button>
                      {isDraft && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs font-bold"
                          onClick={() => handleApproveDraft(rx._id)}
                          icon={FiCheckCircle}
                        >
                          Sign & Authorize
                        </Button>
                      )}
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                          onClick={() => handleRevokePrescription(rx._id)}
                        >
                          Revoke Prescription
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <CreatePrescriptionModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => fetchPrescriptions()}
        />
        <AIPrescriptionScannerModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onPrescriptionConfirmed={() => fetchPrescriptions()}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // PATIENT PRESCRIPTIONS WORKFLOW (Section 7 Compliance)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Digital Prescriptions</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Doctor-signed digital prescriptions directly linked to verified medicine refill ordering.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={FiZap}
            onClick={() => setAiModalOpen(true)}
          >
            Scan Document with AI
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading authenticated prescriptions..." rows={3} />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={FiFileText}
          title="No Prescriptions Found"
          description="There are no prescriptions on file. Consult with a doctor or upload an existing paper prescription."
          actionLabel="Scan Document with AI"
          onAction={() => setAiModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => {
            const isOrdered = orderedRxId === rx._id;

            return (
              <Card key={rx._id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">{rx._id}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-semibold text-brand-800">{rx.diagnosis}</span>
                    <StatusBadge type="prescription" status={rx.status || "active"} size="sm" />
                    {rx.aiExtracted && (
                      <Badge variant="brand" size="sm">
                        AI Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Valid Until: <span className="font-semibold text-slate-700">{new Date(rx.validUntil || Date.now()).toLocaleDateString()}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p><strong>Doctor:</strong> {rx.doctorName} ({rx.doctorSpecialty || "Internal Medicine"})</p>
                    <p><strong>Patient:</strong> {rx.patientName}</p>
                    {rx.notes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200/70">
                        <span className="font-bold block text-slate-700">Clinical Advice:</span>
                        {rx.notes}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prescribed Medication Schedule:</p>
                    <div className="space-y-2">
                      {rx.items?.map((it, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{it.medicineName}</span>
                            <span className="ml-2 font-semibold text-slate-600">{it.dosage}</span>
                            <p className="text-slate-500 text-[11px]">{it.frequency} • {it.instructions}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="brand" size="sm">
                              {it.durationDays} Days
                            </Badge>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{it.quantityPrescribed} Units</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Patient Prescription-to-Order Action Bar */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Digital Prescription ID: {rx._id}
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => window.print()}>
                      Print Rx
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs font-bold w-full sm:w-auto"
                      onClick={() => handleOrderFromPrescription(rx)}
                      icon={isOrdered ? FiCheck : FiShoppingBag}
                    >
                      {isOrdered ? "Added to Cart!" : "Order Prescribed Medicines"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AIPrescriptionScannerModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onPrescriptionConfirmed={() => fetchPrescriptions()}
      />
    </div>
  );
}

// ==========================================
// ADMIN WORKSPACES (Section 9 Compliance)
// ==========================================
export function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([
    {
      id: "doc_1",
      name: "Dr. Sarah Jenkins, MD",
      email: "doctor@trimedi.health",
      specialty: "Internal Medicine & Cardiology",
      hospital: "Metro Health Center",
      licenseNumber: "MED-88492-IN",
      verificationStatus: "verified",
      experienceYears: 14,
    },
    {
      id: "doc_2",
      name: "Dr. Rajesh Gupta, MD",
      email: "gupta@trimedi.health",
      specialty: "Endocrinology & Diabetology",
      hospital: "City Care Clinic",
      licenseNumber: "MED-91024-IN",
      verificationStatus: "verified",
      experienceYears: 18,
    },
    {
      id: "doc_3",
      name: "Dr. Emily Chen, MBBS",
      email: "chen@trimedi.health",
      specialty: "General Physician & Family Medicine",
      hospital: "Sunrise Polyclinic",
      licenseNumber: "MED-77401-IN",
      verificationStatus: "under_review",
      experienceYears: 7,
    },
  ]);

  const handleVerify = async (docId) => {
    try {
      await verifyDoctorCredential(docId, "verified", "Manually verified by platform admin");
      setDoctors((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, verificationStatus: "verified" } : d))
      );
    } catch (e) {
      alert("Verification update failed: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Medical Practitioner Governance</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review medical practitioner licenses, verification credentials, and clinical practice telemetry.
        </p>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Physician</TableHead>
            <TableHead>Specialty & Hospital</TableHead>
            <TableHead>License Reg #</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead className="text-right">Governance Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {doctors.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                <div className="font-bold text-slate-900">{d.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{d.email}</div>
              </TableCell>
              <TableCell>
                <div className="text-xs font-semibold text-slate-800">{d.specialty}</div>
                <div className="text-[11px] text-slate-500">{d.hospital}</div>
              </TableCell>
              <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
              <TableCell className="text-xs">{d.experienceYears} Yrs</TableCell>
              <TableCell>
                <Badge variant={d.verificationStatus === "verified" ? "success" : "warning"} size="sm">
                  {d.verificationStatus === "verified" ? "MD-Verified" : "Under Review"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {d.verificationStatus !== "verified" ? (
                  <Button size="sm" variant="primary" onClick={() => handleVerify(d.id)}>
                    Approve MD
                  </Button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700">✓ Audited</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminPatientsPage() {
  const [patients] = useState([
    {
      id: "pat_1",
      name: "Aditya Nikam",
      email: "aditya@trimedi.health",
      phone: "+91 98765 43210",
      bloodGroup: "O+",
      registeredDate: "2025-06-12",
      activePrescriptions: 2,
      consentStatus: "ACTIVE (Aadhaar & ABHA)",
    },
    {
      id: "pat_2",
      name: "Meera Sharma",
      email: "meera@gmail.com",
      phone: "+91 98111 55667",
      bloodGroup: "B+",
      registeredDate: "2025-08-20",
      activePrescriptions: 1,
      consentStatus: "ACTIVE",
    },
    {
      id: "pat_3",
      name: "Robert Vance",
      email: "vance@refrigeration.com",
      phone: "+91 98222 33445",
      bloodGroup: "A+",
      registeredDate: "2025-09-01",
      activePrescriptions: 1,
      consentStatus: "ACTIVE",
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Patient Population Registry & Consent</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Registered patient accounts, active e-prescriptions count, and consent verification status.
        </p>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Patient Name</TableHead>
            <TableHead>Contact & Phone</TableHead>
            <TableHead>Blood Group</TableHead>
            <TableHead>Registration Date</TableHead>
            <TableHead>Active Prescriptions</TableHead>
            <TableHead>Consent Status</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {patients.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-bold text-slate-900">{p.name}</TableCell>
              <TableCell>
                <div className="text-xs text-slate-800">{p.email}</div>
                <div className="text-[11px] text-slate-400 font-mono">{p.phone}</div>
              </TableCell>
              <TableCell>
                <Badge variant="brand" size="sm">
                  {p.bloodGroup}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-slate-600">{p.registeredDate}</TableCell>
              <TableCell className="text-xs font-semibold">{p.activePrescriptions} Prescriptions</TableCell>
              <TableCell>
                <Badge variant="success" size="sm">
                  {p.consentStatus}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PharmacyPatientsPage() {
  const [dispenseRecords] = useState([
    {
      orderId: "ORD-9912",
      patientName: "Aditya Nikam",
      patientEmail: "aditya@trimedi.health",
      phone: "+91 98765 43210",
      prescriptionRef: "RX-9041",
      medicines: "Atorvastatin 20mg (x1)",
      fulfillmentStatus: "DELIVERED",
      deliveryAddress: "Flat 402, Sunshine Heights, Mumbai 400001",
    },
    {
      orderId: "ORD-9915",
      patientName: "Meera Sharma",
      patientEmail: "meera@gmail.com",
      phone: "+91 98111 55667",
      prescriptionRef: "RX-8832",
      medicines: "Metformin 500mg (x2)",
      fulfillmentStatus: "PACKED",
      deliveryAddress: "12 Marine Drive, Mumbai 400020",
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Pharmacy Dispensing Patient Registry</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Patients receiving dispensed medications, prescription verifications, and delivery addresses.
        </p>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Order # & Patient</TableHead>
            <TableHead>Prescription Reference</TableHead>
            <TableHead>Dispensed Items</TableHead>
            <TableHead>Delivery Destination</TableHead>
            <TableHead>Status</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {dispenseRecords.map((r) => (
            <TableRow key={r.orderId}>
              <TableCell>
                <div className="font-bold text-slate-900">{r.patientName}</div>
                <div className="text-[11px] text-slate-400 font-mono">{r.orderId} • {r.phone}</div>
              </TableCell>
              <TableCell className="font-mono text-xs text-brand-800 font-bold">{r.prescriptionRef}</TableCell>
              <TableCell className="text-xs text-slate-700">{r.medicines}</TableCell>
              <TableCell className="text-xs text-slate-600">{r.deliveryAddress}</TableCell>
              <TableCell>
                <Badge variant={r.fulfillmentStatus === "DELIVERED" ? "success" : "brand"} size="sm">
                  {r.fulfillmentStatus}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ==========================================
// 4. INVENTORY VIEW
// ==========================================
export function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      setProducts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustUnits = async (id, currentStock, name) => {
    const qty = prompt(`Enter units to add to stock for "${name}" (Current Stock: ${currentStock}):`, "50");
    if (!qty || isNaN(qty)) return;

    try {
      await updateProductStock(id, { stockAdjustment: Number(qty) });
      await fetchInventory();
    } catch (err) {
      alert("Failed to update stock: " + err.message);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory & SKU Stock Control</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time stock reservation, GST configurations, batch numbers, and replenishment thresholds.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search SKU or medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 text-xs"
          />
          <Button variant="primary" size="sm" icon={FiPlus} onClick={() => navigate("/products")}>
            Catalog
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading dispensary inventory records..." rows={4} />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>SKU & Medicine</TableHead>
              <TableHead>Category / Rx</TableHead>
              <TableHead>Selling Price & MRP</TableHead>
              <TableHead>GST Rate</TableHead>
              <TableHead>Stock (Total / Reserved)</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 20).map((p) => {
              const stock = p.stockQuantity !== undefined ? p.stockQuantity : 100;
              const reserved = p.reservedQuantity !== undefined ? p.reservedQuantity : 0;
              const available = p.availableQuantity !== undefined ? p.availableQuantity : stock - reserved;
              const isLow = available <= (p.lowStockThreshold || 15);

              return (
                <TableRow key={p._id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.sku || `SKU-${p._id.toString().slice(-6)}`} • Batch: {p.batchNumber || "B-2026"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600">{p.category || "Medicine"}</div>
                    {p.prescriptionRequired && (
                      <Badge variant="brand" size="sm" className="mt-0.5 text-[9px]">
                        Rx Required
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-800">₹{p.price}</div>
                    <div className="text-[10px] text-slate-400">MRP: ₹{p.mrp || Math.round(p.price * 1.15)}</div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {Math.round((p.taxRate || 0.12) * 100)}% GST
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    <span>{stock} units</span>
                    {reserved > 0 && (
                      <span className="text-[10px] text-amber-700 block">({reserved} reserved)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-bold ${isLow ? "text-amber-700" : "text-emerald-700"}`}>
                      {available} units
                    </span>
                    {isLow && (
                      <Badge variant="warning" size="sm" className="ml-1 text-[9px]">
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      className="text-brand-700 font-semibold hover:underline text-xs"
                      onClick={() => handleAdjustUnits(p._id, stock, p.name)}
                    >
                      + Adjust Stock
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ==========================================
// 5. ORDERS VIEW WITH MULTI-STAGE TRACKING
// ==========================================
export function OrdersPage() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await getOrders({
        role: activeRole,
        patientEmail: user?.email,
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeRole, user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      alert(err.message || "Status update failed");
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt("Please provide a reason for cancelling this order:", "Patient cancelled");
    if (!reason) return;

    try {
      await cancelOrder(orderId, reason);
      await fetchOrders();
    } catch (err) {
      alert("Cancellation failed: " + err.message);
    }
  };

  // 7-Stage Visual Fulfillment Progress Tracker
  const STAGES = ["NEW", "PRESCRIPTION_REVIEW", "ACCEPTED", "PREPARING", "PACKED", "DISPATCHED", "DELIVERED"];
  const getStageIndex = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "OUT_FOR_DELIVERY") return 5;
    if (s === "COMPLETED") return 6;
    const idx = STAGES.indexOf(s);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D9E2EC]">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Healthcare Orders & Fulfillment Tracking</h1>
          <p className="text-xs sm:text-sm text-[#52627A] mt-1">
            Prescription-linked orders, payment verifications, and real-time fulfillment progression.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={FiShoppingBag} onClick={() => navigate("/products")}>
          Order Medicines
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading order fulfillment records..." rows={3} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={FiShoppingBag}
          title="No Orders Placed Yet"
          description="You have no previous orders. Explore our verified pharmacy catalog or order directly from your prescriptions."
          actionLabel="Browse Medicine Catalog"
          onAction={() => navigate("/products")}
        />
      ) : (
        <div className="space-y-5">
          {orders.map((ord) => {
            const currentStatus = (ord.status || "NEW").toUpperCase();
            const stageIdx = getStageIndex(currentStatus);
            const canCancel = activeRole === "patient" && ["NEW", "PRESCRIPTION_REVIEW", "ACCEPTED", "PENDING"].includes(currentStatus);

            return (
              <Card key={ord._id || ord.orderId} className="space-y-4 border-[#D9E2EC] bg-white">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D9E2EC]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#172033]">{ord.orderId || ord._id}</span>
                    <span className="text-xs text-[#CBD5E1]">•</span>
                    <Badge
                      variant={
                        currentStatus === "DELIVERED" || currentStatus === "COMPLETED"
                          ? "success"
                          : currentStatus === "DISPATCHED" || currentStatus === "OUT_FOR_DELIVERY"
                          ? "warning"
                          : currentStatus === "ACCEPTED" || currentStatus === "PREPARING" || currentStatus === "PACKED"
                          ? "info"
                          : currentStatus === "CANCELLED" || currentStatus === "REJECTED"
                          ? "danger"
                          : "brand"
                      }
                      size="sm"
                    >
                      {currentStatus}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {ord.paymentMethod?.toUpperCase()} ({ord.paymentStatus || "PENDING"})
                    </Badge>
                    {ord.prescriptionRef && (
                      <Badge variant="brand" size="sm">
                        Linked: {ord.prescriptionRef}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#718096] font-medium">
                    Placed: {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                {/* Multi-Stage Visual Tracking Bar */}
                {currentStatus !== "CANCELLED" && currentStatus !== "REJECTED" && (
                  <div className="py-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#52627A] mb-1.5 flex-wrap gap-1">
                      {["Placed", "Reviewed", "Accepted", "Preparing", "Packed", "Dispatched", "Delivered"].map(
                        (label, idx) => (
                          <span
                            key={label}
                            className={idx <= stageIdx ? "text-[#06665D] font-bold" : "text-[#718096]"}
                          >
                            {label}
                          </span>
                        )
                      )}
                    </div>
                    <div className="w-full bg-[#F1F5F9] border border-[#D9E2EC] h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#087F73] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round(((stageIdx + 1) / 7) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Items & Fulfillment details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-bold text-[#172033] mb-1.5">Purchased Medicines:</p>
                    <ul className="space-y-1.5 text-[#52627A]">
                      {ord.items?.map((it, idx) => (
                        <li key={idx} className="flex justify-between bg-[#FFFFFF] p-2.5 rounded-lg border border-[#D9E2EC]">
                          <span className="font-medium text-[#172033]">
                            • {it.nameSnapshot || it.name} (x{it.quantity || it.qty || 1})
                          </span>
                          <span className="font-bold text-[#172033]">
                            ₹{(it.unitPrice || it.price || 0) * (it.quantity || it.qty || 1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-[#52627A] bg-[#F1F5F9] p-3.5 rounded-xl border border-[#D9E2EC]">
                    <p>
                      <strong className="text-[#172033]">Recipient:</strong> {ord.patientName} ({ord.patientPhone || "+91 98765 43210"})
                    </p>
                    <p>
                      <strong className="text-[#172033]">Delivery Destination:</strong> {ord.deliveryAddress?.street || "Address provided"}, {ord.deliveryAddress?.city || "Mumbai"} ({ord.deliveryAddress?.pincode || "400001"})
                    </p>
                    <p>
                      <strong className="text-[#172033]">Dispensing Pharmacy:</strong> {ord.pharmacyName || "MedPlus Prime Pharmacy"}
                    </p>
                    {ord.pricing && (
                      <div className="pt-2 border-t border-[#D9E2EC] text-[11px] text-[#52627A] flex justify-between">
                        <span>GST Breakup (CGST + SGST): <strong className="text-[#172033]">₹{ord.pricing.totalTax || 0}</strong></span>
                        <span>Delivery Fee: <strong className="text-[#172033]">{ord.pricing.deliveryFee === 0 ? "FREE" : `₹${ord.pricing.deliveryFee}`}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#D9E2EC] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-sm sm:text-base font-bold text-[#172033]">
                    Authoritative Total: <span className="text-[#087F73] font-extrabold text-base sm:text-lg">₹{ord.totalAmount}</span>
                  </span>

                  <div className="flex gap-2">
                    {/* Patient cancellation */}
                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#C53030] hover:bg-[#FFF0F0] font-semibold"
                        onClick={() => handleCancelOrder(ord.orderId || ord._id)}
                      >
                        Cancel Order
                      </Button>
                    )}

                    {activeRole === "patient" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-white border-[#D9E2EC] text-[#087F73] hover:bg-[#E8F7F4] hover:border-[#087F73] font-semibold"
                        onClick={() => navigate("/products")}
                      >
                        Order Again
                      </Button>
                    )}

                    {/* Pharmacy quick state actions */}
                    {activeRole === "pharmacy" && (
                      <>
                        {currentStatus === "NEW" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleUpdateStatus(ord.orderId || ord._id, "ACCEPTED")}
                          >
                            Accept Order
                          </Button>
                        )}
                        {currentStatus === "ACCEPTED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleUpdateStatus(ord.orderId || ord._id, "PREPARING")}
                          >
                            Mark Preparing
                          </Button>
                        )}
                        {currentStatus === "PREPARING" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleUpdateStatus(ord.orderId || ord._id, "PACKED")}
                          >
                            Mark Packed
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ==========================================
// 6. SYSTEM SETTINGS / ADMIN
// ==========================================
export function SystemManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Governance & Telemetry</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Database clusters, API telemetry, and platform security audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FiShield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Database & Resilient Fallback</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            MongoDB Atlas connected with automatic fallback store ensuring 100% uptime for authentication, prescriptions, and order fulfillment.
          </p>
          <Badge variant="success" size="sm">
            Status: Operational
          </Badge>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <FiLayers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Payment & AI Engine Status</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            PayPal Server-side Orders API, Gemini/NLP Medical Extraction Pipeline, and Deterministic Supply Gap Arithmetic are operational.
          </p>
          <Badge variant="brand" size="sm">
            Status: Active
          </Badge>
        </Card>
      </div>
    </div>
  );
}

export default {
  MyDoctorsPage,
  MyPatientsPage,
  PrescriptionsPage,
  AppointmentsPage,
  InventoryPage,
  OrdersPage,
  SystemManagementPage,
  AdminDoctorsPage,
  AdminPatientsPage,
  PharmacyPatientsPage,
};
