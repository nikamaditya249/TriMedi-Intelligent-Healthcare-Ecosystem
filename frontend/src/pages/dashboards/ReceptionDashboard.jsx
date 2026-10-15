import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiUserPlus,
  FiAlertCircle,
  FiSearch,
  FiRefreshCw,
  FiCheck,
  FiXCircle,
  FiEye,
} from "react-icons/fi";
import Card, { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
  getReceptionTodayAppointments,
  getClinicQueue,
  checkInAppointment,
  registerReceptionPatient,
  updateReceptionAppointmentStatus,
  updateQueueStatus,
} from "../../api";

export function ReceptionDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Registration modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    bloodGroup: "O+",
    dob: "1995-05-12",
    gender: "Male",
    emergencyContact: "",
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState("");
  const [regError, setRegError] = useState("");

  const loadAll = async () => {
    try {
      setLoading(true);
      const [apptRes, queueRes] = await Promise.all([
        getReceptionTodayAppointments(),
        getClinicQueue("", user?.clinicName || "Metro Health Center"),
      ]);

      if (apptRes && apptRes.appointments) {
        setAppointments(apptRes.appointments);
      }
      if (queueRes && queueRes.queue) {
        setQueue(queueRes.queue);
      }
    } catch (err) {
      console.error("Error loading reception data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Listen for real-time queue updates from Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdated = () => {
      loadAll();
    };

    socket.on("queue:updated", handleQueueUpdated);
    socket.on("appointment:checked_in", handleQueueUpdated);

    return () => {
      socket.off("queue:updated", handleQueueUpdated);
      socket.off("appointment:checked_in", handleQueueUpdated);
    };
  }, [socket]);

  // Handle patient check-in
  const handleCheckIn = async (aptId) => {
    try {
      const res = await checkInAppointment(aptId, "normal", "Arrived at clinic desk");
      if (res && res.success) {
        await loadAll();
      }
    } catch (err) {
      console.error("Check-in error:", err);
    }
  };

  // Handle appointment status update
  const handleUpdateStatus = async (aptId, newStatus) => {
    try {
      await updateReceptionAppointmentStatus(aptId, newStatus, `Reception set status to ${newStatus}`);
      await loadAll();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Handle quick register patient
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      setRegLoading(true);
      setRegError("");
      setRegSuccess("");

      const res = await registerReceptionPatient(regForm);
      if (res.success) {
        setRegSuccess(`Patient ${res.patient.name} registered successfully!`);
        setTimeout(() => {
          setRegisterModalOpen(false);
          setRegForm({
            name: "",
            email: "",
            phone: "",
            bloodGroup: "O+",
            dob: "1995-05-12",
            gender: "Male",
            emergencyContact: "",
          });
          setRegSuccess("");
          loadAll();
        }, 1200);
      } else {
        setRegError(res.message || "Failed to register patient");
      }
    } catch (err) {
      setRegError(err.message || "Network error registering patient");
    } finally {
      setRegLoading(false);
    }
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientPhone?.includes(searchQuery) ||
      apt.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live stats
  const waitingCount = queue.filter((q) => q.status === "waiting" || q.status === "called").length;
  const inConsultCount = queue.filter((q) => q.status === "in_consultation").length;
  const completedToday = appointments.filter((a) => a.status === "completed").length;

  if (loading) {
    return <LoadingState message="Loading clinic operational telemetry and live queue..." rows={4} />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Reception Operations Header */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Clinic Operations & Reception
            </span>
            <span className="text-slate-300">•</span>
            <Badge variant="brand" size="sm">
              Live Front Desk Hub
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user?.clinicName || "Metro Health Center"} Front Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{user?.name || "Meena Ramanathan"}</span> ({user?.shift || "General Day Shift"})
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAll}
            icon={FiRefreshCw}
          >
            Refresh Desk
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRegisterModalOpen(true)}
            icon={FiUserPlus}
          >
            Register Walk-In Patient
          </Button>
        </div>
      </div>

      {/* 2. Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Appointments"
          value={appointments.length}
          subtext="Total scheduled visits"
          icon={FiCalendar}
          variant="brand"
        />
        <StatCard
          label="Waiting in Queue"
          value={waitingCount}
          subtext="Patients present in clinic"
          icon={FiClock}
          variant="warning"
        />
        <StatCard
          label="In Consultation"
          value={inConsultCount}
          subtext="Currently with doctors"
          icon={FiUsers}
          variant="info"
        />
        <StatCard
          label="Completed Today"
          value={completedToday}
          subtext="Encounters concluded"
          icon={FiCheckCircle}
          variant="success"
        />
      </div>

      {/* 3. Live Clinic Queue Section */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Clinic Waiting Room Queue
            </h2>
            <p className="text-xs text-slate-500">
              Patients currently checked in and waiting for consultation rooms
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {queue.length} Active in Queue
          </span>
        </div>

        {queue.length === 0 ? (
          <EmptyState
            title="Waiting room is currently clear"
            message="No patients are actively waiting in the queue. Checked-in patients will appear here with assigned queue numbers."
            icon={FiClock}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue #</TableHead>
                <TableHead>Patient Details</TableHead>
                <TableHead>Assigned Doctor</TableHead>
                <TableHead>Check-In Time</TableHead>
                <TableHead>Est. Wait</TableHead>
                <TableHead>Queue Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((q) => (
                <TableRow key={q._id}>
                  <TableCell>
                    <div className="w-9 h-9 rounded-xl bg-brand-700 text-white font-extrabold flex items-center justify-center text-sm shadow-subtle">
                      #{q.queueNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">{q.patientName}</p>
                    <p className="text-[11px] text-slate-500">{q.patientPhone || q.patientEmail}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-800 text-xs">{q.doctorName}</p>
                    <p className="text-[11px] text-brand-700">{q.clinicName}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {new Date(q.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">
                    ~{q.estimatedWaitMinutes || 15} mins
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        q.status === "in_consultation"
                          ? "bg-sky-100 text-sky-800"
                          : q.status === "called"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {q.status === "in_consultation"
                        ? "In Consultation"
                        : q.status === "called"
                        ? "Called to Room"
                        : "Waiting in Hall"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => updateQueueStatus(q._id, "no_show", "Patient did not respond to call")}
                    >
                      No-Show
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* 4. Today's Appointments & Operational Desk */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Scheduled Appointments</h2>
            <p className="text-xs text-slate-500">
              Verify arrivals, initiate 1-click check-in, and manage appointment operational statuses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient or doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
              <FiSearch className="absolute left-2.5 top-2.5 text-slate-400 w-3.5 h-3.5" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
              <option value="no_show">No-Show</option>
            </select>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <EmptyState
            title="No appointments match your filters"
            message="Try clearing your search query or selecting another status filter."
            icon={FiCalendar}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Slot</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor & Clinic</TableHead>
                <TableHead>Visit Type</TableHead>
                <TableHead>Operational Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((apt) => (
                <TableRow key={apt._id}>
                  <TableCell>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{apt.timeSlot}</span>
                    <p className="text-[10px] text-slate-400">{apt.appointmentDate}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">{apt.patientName}</p>
                    <p className="text-[11px] text-slate-500">{apt.patientPhone}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-800 text-xs">{apt.doctorName}</p>
                    <p className="text-[11px] text-brand-700">{apt.doctorSpecialty}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {apt.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={apt.status} />
                    {apt.queueNumber && (
                      <span className="ml-1 text-[11px] font-bold text-brand-700">
                        (Queue #{apt.queueNumber})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {["scheduled", "confirmed"].includes(apt.status) && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs py-1"
                          onClick={() => handleCheckIn(apt._id)}
                        >
                          Check In
                        </Button>
                      )}
                      {apt.status === "scheduled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs py-1"
                          onClick={() => handleUpdateStatus(apt._id, "confirmed")}
                        >
                          Confirm
                        </Button>
                      )}
                      {apt.status !== "completed" && apt.status !== "no_show" && apt.status !== "cancelled" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs py-1 text-slate-500 hover:text-rose-600"
                          onClick={() => handleUpdateStatus(apt._id, "no_show")}
                        >
                          No-Show
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* 5. Quick Register Walk-In Patient Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Quick Register Walk-In Patient"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          <p className="text-xs text-slate-500">
            Rapid front-desk registration for walk-in arrivals. Generates verified patient credentials instantly.
          </p>

          {regSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              ✓ {regSuccess}
            </div>
          )}
          {regError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              ⚠️ {regError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Legal Name"
              required
              placeholder="e.g. Ramesh Kulkarni"
              value={regForm.name}
              onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
            />
            <Input
              label="Email Address"
              required
              type="email"
              placeholder="ramesh@gmail.com"
              value={regForm.email}
              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
            />
            <Input
              label="Mobile Phone"
              placeholder="+91 98000 12345"
              value={regForm.phone}
              onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={regForm.dob}
              onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
            />
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
                value={regForm.gender}
                onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
                value={regForm.bloodGroup}
                onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
              >
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <Input
            label="Emergency Contact Phone"
            placeholder="+91 98111 22233"
            value={regForm.emergencyContact}
            onChange={(e) => setRegForm({ ...regForm, emergencyContact: e.target.value })}
          />

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={regLoading}>
              Register Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ReceptionDashboard;
