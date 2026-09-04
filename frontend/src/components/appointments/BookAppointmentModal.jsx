import React, { useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiUserCheck,
  FiVideo,
  FiHome,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input, { Select } from "../ui/Input";
import Badge from "../ui/Badge";
import { bookAppointment } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function BookAppointmentModal({ isOpen, onClose, onBooked, initialDoctor }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doctorsList = [
    {
      name: "Dr. Sarah Jenkins, MD",
      specialty: "Cardiology & Internal Medicine",
      hospital: "Metro Health Center",
      email: "doctor@trimedi.health",
    },
    {
      name: "Dr. Rajesh Gupta, MD",
      specialty: "Endocrinology & Diabetology",
      hospital: "City Care Clinic",
      email: "gupta@trimedi.health",
    },
    {
      name: "Dr. Emily Chen, MBBS",
      specialty: "General Physician & Family Medicine",
      hospital: "Sunrise Polyclinic",
      email: "chen@trimedi.health",
    },
  ];

  const [selectedDoctorIndex, setSelectedDoctorIndex] = useState(
    initialDoctor ? Math.max(0, doctorsList.findIndex((d) => d.name === initialDoctor.name)) : 0
  );

  const [formData, setFormData] = useState({
    patientName: user?.name || "Aditya Nikam",
    patientEmail: user?.email || "aditya@trimedi.health",
    patientPhone: user?.phone || "+91 98765 43210",
    appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    timeSlot: "10:30 AM",
    type: "video",
    reason: "Cardio Lipid Panel Review & Prescription Renewal",
    notes: "",
  });

  const timeSlots = ["09:30 AM", "10:30 AM", "11:15 AM", "02:00 PM", "03:30 PM", "04:30 PM"];

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const chosenDoc = doctorsList[selectedDoctorIndex] || doctorsList[0];

    try {
      const payload = {
        ...formData,
        doctorName: chosenDoc.name,
        doctorEmail: chosenDoc.email,
        doctorSpecialty: chosenDoc.specialty,
        hospital: chosenDoc.hospital,
      };

      const res = await bookAppointment(payload);
      if (res.appointment) {
        onBooked && onBooked(res.appointment);
        onClose();
      } else {
        setError(res.message || "Unable to book appointment");
      }
    } catch (err) {
      setError(err.message || "Failed to connect to appointment booking service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Doctor Consultation"
      maxWidth="max-w-xl"
    >
      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleBook} className="space-y-4">
        {/* Doctor Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Medical Specialist
          </label>
          <div className="space-y-2">
            {doctorsList.map((doc, idx) => {
              const isSelected = selectedDoctorIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDoctorIndex(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      MD
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                      <p className="text-[11px] text-teal-700 font-medium">{doc.specialty}</p>
                      <p className="text-[10px] text-slate-400">{doc.hospital}</p>
                    </div>
                  </div>
                  {isSelected && <FiCheckCircle className="w-5 h-5 text-teal-600" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Date & Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Consultation Date"
            type="date"
            required
            value={formData.appointmentDate}
            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Available Time Slot
            </label>
            <select
              value={formData.timeSlot}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Consultation Mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Consultation Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "video", label: "Video Visit", icon: FiVideo },
              { id: "in-person", label: "In-Person", icon: FiHome },
              { id: "follow-up", label: "Rx Review", icon: FiCalendar },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = formData.type === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: m.id })}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? "border-teal-600 bg-teal-50 text-teal-900 font-bold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px]">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Reason for Consultation"
          required
          placeholder="e.g., Blood pressure checkup, lab test evaluation"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="doctor"
            size="md"
            loading={loading}
            icon={FiCheckCircle}
          >
            Confirm Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BookAppointmentModal;
