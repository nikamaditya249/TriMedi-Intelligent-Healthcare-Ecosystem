import React, { useState, useEffect } from "react";
import {
  FiActivity,
  FiCalendar,
  FiFileText,
  FiUserCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiHeart,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import LoadingState from "../ui/LoadingState";
import EmptyState from "../ui/EmptyState";
import { getPatientMedicalRecord } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function MedicalRecordTimeline({ patientEmail = null }) {
  const { user } = useAuth();
  const targetEmail = patientEmail || user?.email || "patient@trimedi.com";

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecord = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPatientMedicalRecord(targetEmail);
      if (res.success) {
        setRecord(res);
      } else {
        setError(res.message || "Failed to load longitudinal medical record");
      }
    } catch (err) {
      setError(err.message || "Error communicating with medical records service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [targetEmail]);

  if (loading) {
    return <LoadingState message="Loading longitudinal patient medical record and care timeline..." rows={3} />;
  }

  if (error) {
    return (
      <Card className="p-6 text-center space-y-2">
        <FiAlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Medical Record Notice</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <Button variant="outline" size="sm" onClick={loadRecord} icon={FiRefreshCw}>
          Retry
        </Button>
      </Card>
    );
  }

  const { patient, timeline = [], counts } = record || {};

  const getEventIcon = (type) => {
    switch (type) {
      case "CONSULTATION":
        return <FiActivity className="w-4 h-4 text-brand-700" />;
      case "PRESCRIPTION":
        return <FiFileText className="w-4 h-4 text-emerald-700" />;
      case "APPOINTMENT":
        return <FiCalendar className="w-4 h-4 text-sky-700" />;
      case "REGISTRATION":
        return <FiCheckCircle className="w-4 h-4 text-purple-700" />;
      default:
        return <FiClock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEventBadge = (type) => {
    switch (type) {
      case "CONSULTATION":
        return <Badge variant="brand" size="sm">Consultation</Badge>;
      case "PRESCRIPTION":
        return <Badge variant="success" size="sm">Prescription</Badge>;
      case "APPOINTMENT":
        return <Badge variant="info" size="sm">Appointment</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Ecosystem Entry</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Clinical Summary */}
      <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Longitudinal Clinical Record
            </span>
            <span className="text-slate-300">•</span>
            <Badge variant="brand" size="sm">
              Append-Oriented Healthcare Ledger
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {patient?.name} (Medical History)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            DOB: {patient?.dob || "1994-06-15"} • Blood Group: <strong className="text-slate-700">{patient?.bloodGroup}</strong> • Gender: {patient?.gender}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 block">
              {counts?.consultations || 0} Consultations • {counts?.prescriptions || 0} Prescriptions
            </span>
            <span className="text-[10px] text-slate-400">Continuous Care Ledger</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadRecord} icon={FiRefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Known Allergies & Clinical Factors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiShield className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase">Verified Allergies</h4>
          </div>
          {patient?.allergies?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((all, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
                  ⚠️ {all}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No known drug allergies reported.</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiHeart className="w-4 h-4 text-brand-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase">Chronic Conditions & Baseline</h4>
          </div>
          {patient?.existingConditions?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {patient.existingConditions.map((cond, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 font-semibold border border-brand-100">
                  {cond}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No chronic medical conditions listed.</p>
          )}
        </Card>
      </div>

      {/* 3. Chronological Care Timeline */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Care Encounters & Treatment Timeline</span>
          <span className="text-xs font-normal text-slate-500">{timeline.length} events recorded</span>
        </h3>

        {timeline.length === 0 ? (
          <EmptyState
            title="No medical record events found"
            message="As appointments, doctor consultations, and prescriptions occur, they will append chronologically to this timeline."
            icon={FiClock}
          />
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {timeline.map((event) => (
              <div key={event.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-brand-700 flex items-center justify-center shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-700" />
                </div>

                {/* Event Card */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-slate-50 border border-slate-100">
                        {getEventIcon(event.type)}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{event.title}</h4>
                      {getEventBadge(event.type)}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {new Date(event.date).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Encounter Details */}
                  {event.details && (
                    <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100 mt-2">
                      {event.details.diagnosis && (
                        <p>
                          <strong className="text-slate-800">Diagnosis:</strong>{" "}
                          <span className="font-semibold text-slate-900">{event.details.diagnosis}</span>
                        </p>
                      )}
                      {event.details.treatmentPlan && (
                        <p>
                          <strong className="text-slate-800">Plan:</strong> {event.details.treatmentPlan}
                        </p>
                      )}
                      {event.details.medicines && event.details.medicines.length > 0 && (
                        <div>
                          <strong className="text-slate-800">Medications Prescribed:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {event.details.medicines.map((m, idx) => (
                              <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold">
                                💊 {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {event.details.vitals && (
                        <p className="text-[11px] text-slate-500">
                          <strong>Recorded Vitals:</strong> BP {event.details.vitals.bloodPressure || "120/80"} • Pulse {event.details.vitals.heartRate || "72"} bpm • Temp {event.details.vitals.temperature || "98.6"}
                        </p>
                      )}
                      {event.details.followUpDate && (
                        <p className="text-[11px] text-brand-700 font-semibold">
                          🗓️ Next Recommended Follow-Up: {event.details.followUpDate}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-slate-400">
                    Overseeing Clinical Actor: <span className="font-semibold text-slate-600">{event.actor || "TriMedi Clinical Staff"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default MedicalRecordTimeline;
