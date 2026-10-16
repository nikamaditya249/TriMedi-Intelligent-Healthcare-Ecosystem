import React, { useState, useEffect } from "react";
import {
  FiActivity,
  FiUser,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiShield,
  FiCalendar,
  FiZap,
  FiHelpCircle,
  FiCheck,
} from "react-icons/fi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import { Tabs } from "../ui/Tabs";
import {
  initConsultation,
  saveConsultationNotes,
  completeConsultationEncounter,
  getPatientMedicalRecord,
  checkMedicationSafety,
  summarizeConsultationWithAI,
  getDoctorQuestionsWithAI,
} from "../../api";

export function ConsultationWorkspaceModal({
  isOpen,
  onClose,
  patientQueueItem,
  onConsultationCompleted,
}) {
  const [activeTab, setActiveTab] = useState("encounter");
  const [loading, setLoading] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [consultationId, setConsultationId] = useState(null);

  // Patient Clinical Summary
  const [medicalRecord, setMedicalRecord] = useState(null);

  // Encounter form states
  const [vitals, setVitals] = useState({
    bloodPressure: "124/80 mmHg",
    heartRate: "72 bpm",
    temperature: "98.6 °F",
    weightKg: 70,
    spO2: "99%",
  });
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState([
    {
      medicineName: "Atorvastatin",
      dosage: "20mg",
      frequency: "Once daily (Night)",
      durationDays: 30,
      instructions: "Take 1 tablet after dinner with water",
    },
  ]);

  // Phase 3: AI & Medication Safety States
  const [safetyAlerts, setSafetyAlerts] = useState([]);
  const [safetyChecking, setSafetyChecking] = useState(false);
  const [alertsAcknowledged, setAlertsAcknowledged] = useState(false);
  const [aiDraftSummary, setAiDraftSummary] = useState("");
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [doctorQuestions, setDoctorQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Success/error states
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen || !patientQueueItem) return;

    const initializeEncounter = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. Initialize Consultation in backend
        const res = await initConsultation({
          appointmentId: patientQueueItem.appointmentId,
          patientEmail: patientQueueItem.patientEmail,
          patientName: patientQueueItem.patientName,
          doctorEmail: patientQueueItem.doctorEmail,
          doctorName: patientQueueItem.doctorName,
          chiefComplaint: patientQueueItem.notes || "Clinical Consultation Encounter",
        });

        if (res.success && res.consultation) {
          setConsultationId(res.consultation._id);
          if (res.consultation.vitals) setVitals(res.consultation.vitals);
          setChiefComplaint(res.consultation.chiefComplaint || patientQueueItem.notes || "");
          setClinicalNotes(res.consultation.clinicalNotes || "");
          setDiagnosis(res.consultation.diagnosis || "Cardiovascular & Metabolic Evaluation");
          setTreatmentPlan(res.consultation.treatmentPlan || "");
          setFollowUpDate(res.consultation.followUpDate || "");
        }

        // 2. Load Longitudinal Medical Record for Clinical Summary
        const medRes = await getPatientMedicalRecord(patientQueueItem.patientEmail);
        if (medRes.success) {
          setMedicalRecord(medRes);
        }
      } catch (err) {
        console.error("Error initializing consultation workspace:", err);
        setErrorMessage("Notice: Initializing clinical encounter with in-memory record.");
      } finally {
        setLoading(false);
      }
    };

    initializeEncounter();
  }, [isOpen, patientQueueItem]);

  // Auto-run Medication Safety Check whenever prescription items change
  const runSafetyCheck = async (items = prescriptionItems) => {
    const validItems = items.filter((it) => it.medicineName?.trim().length > 0);
    if (validItems.length === 0) {
      setSafetyAlerts([]);
      return;
    }

    setSafetyChecking(true);
    try {
      const patientAllergies = medicalRecord?.patient?.allergies || ["Penicillin"];
      const res = await checkMedicationSafety({
        medications: validItems,
        patientAllergies,
      });

      if (res && res.success) {
        setSafetyAlerts(res.alerts || []);
        setAlertsAcknowledged(false);
      }
    } catch (err) {
      console.warn("Medication safety check warning:", err.message);
    } finally {
      setSafetyChecking(false);
    }
  };

  const handleAddMedicine = () => {
    const updated = [
      ...prescriptionItems,
      {
        medicineName: "",
        dosage: "500mg",
        frequency: "Twice daily after meals",
        durationDays: 30,
        instructions: "Take with food",
      },
    ];
    setPrescriptionItems(updated);
  };

  const handleRemoveMedicine = (index) => {
    const updated = prescriptionItems.filter((_, i) => i !== index);
    setPrescriptionItems(updated);
    runSafetyCheck(updated);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...prescriptionItems];
    updated[index][field] = value;
    setPrescriptionItems(updated);
  };

  const handleSaveProgress = async () => {
    if (!consultationId) return;
    try {
      setSavingNotes(true);
      await saveConsultationNotes(consultationId, {
        vitals,
        chiefComplaint,
        clinicalNotes,
        diagnosis,
        treatmentPlan,
        followUpDate,
      });
      setStatusMessage("Progress saved to clinical record");
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  // Generate AI Draft Summary (Section 13)
  const handleGenerateAISummary = async () => {
    setSummaryGenerating(true);
    try {
      const res = await summarizeConsultationWithAI({
        doctorName: patientQueueItem?.doctorName || "Dr. Sarah Jenkins, MD",
        chiefComplaint,
        clinicalNotes,
        diagnosis,
        vitals,
        patientName: patientQueueItem?.patientName || "Aditya Nikam",
      });

      if (res.success && res.summaryDraft) {
        setAiDraftSummary(res.summaryDraft);
      }
    } catch (err) {
      console.error("AI summary error:", err);
    } finally {
      setSummaryGenerating(false);
    }
  };

  // Generate Doctor Suggested Questions (Section 14)
  const handleGenerateQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const res = await getDoctorQuestionsWithAI({
        chiefComplaint,
        diagnosis,
        existingConditions: medicalRecord?.patient?.existingConditions || [],
      });
      if (res.success && res.suggestedQuestions) {
        setDoctorQuestions(res.suggestedQuestions);
      }
    } catch (err) {
      console.error("Doctor questions error:", err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleApplyAISummary = () => {
    if (aiDraftSummary) {
      setClinicalNotes((prev) => (prev ? `${prev}\n\n[AI Draft Summary - Reviewed by Attending Physician]:\n${aiDraftSummary}` : aiDraftSummary));
      setAiDraftSummary("");
    }
  };

  const handleCompleteConsultation = async () => {
    if (!diagnosis) {
      setErrorMessage("Please record a clinical assessment or diagnosis before concluding.");
      return;
    }

    // Safety Alert Check: Doctor must acknowledge if high alerts exist
    if (safetyAlerts.length > 0 && !alertsAcknowledged) {
      setErrorMessage("Please review and acknowledge the potential medication interactions before issuing prescription.");
      return;
    }

    try {
      setCompleting(true);
      setErrorMessage("");

      const validItems = prescriptionItems.filter((it) => it.medicineName.trim().length > 0);
      const prescriptionData =
        validItems.length > 0
          ? {
              items: validItems,
              notes: treatmentPlan,
            }
          : null;

      const res = await completeConsultationEncounter(
        consultationId || "temp_consultation",
        prescriptionData,
        patientQueueItem._id
      );

      if (res.success) {
        setStatusMessage("Consultation completed! Digital prescription approved & issued.");
        setTimeout(() => {
          if (onConsultationCompleted) onConsultationCompleted(res);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || "Could not finalize consultation.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Error finalizing consultation encounter.");
    } finally {
      setCompleting(false);
    }
  };

  if (!patientQueueItem) return null;

  const patient = medicalRecord?.patient || {
    name: patientQueueItem.patientName,
    email: patientQueueItem.patientEmail,
    bloodGroup: "O+",
    allergies: ["Penicillin"],
    existingConditions: ["Dyslipidemia", "Mild Hypertension"],
    currentMedications: ["Atorvastatin 20mg", "Telmisartan 40mg"],
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Clinical Consultation — ${patientQueueItem.patientName}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Patient Clinical Header Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {patient.name?.charAt(0) || "P"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{patient.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                  {patient.bloodGroup || "O+"}
                </span>
              </div>
              <p className="text-xs text-slate-500">{patient.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-1">
              <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Allergies: {patient.allergies?.join(", ") || "None Recorded"}</span>
            </div>
            <Badge variant="brand" size="sm">
              Token #{patientQueueItem.queueNumber || "Q-1"}
            </Badge>
          </div>
        </div>

        {/* Status / Error feedback */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab("encounter")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "encounter" ? "border-brand-700 text-brand-800" : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FiActivity className="w-4 h-4" />
            Clinical Notes & Diagnosis
          </button>
          <button
            onClick={() => {
              setActiveTab("prescription");
              runSafetyCheck();
            }}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "prescription" ? "border-brand-700 text-brand-800" : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FiFileText className="w-4 h-4" />
            Digital Prescription & Safety
            {safetyAlerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "history" ? "border-brand-700 text-brand-800" : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FiClock className="w-4 h-4" />
            Longitudinal History
          </button>
        </div>

        {/* TAB 1: CLINICAL NOTES & DIAGNOSIS */}
        {activeTab === "encounter" && (
          <div className="space-y-4">
            {/* Vitals Ribbon */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-bold text-slate-700 block mb-2">Recorded Patient Vitals</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Blood Pressure</label>
                  <input
                    type="text"
                    value={vitals.bloodPressure}
                    onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate</label>
                  <input
                    type="text"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Temperature</label>
                  <input
                    type="text"
                    value={vitals.temperature}
                    onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
                  <input
                    type="number"
                    value={vitals.weightKg}
                    onChange={(e) => setVitals({ ...vitals, weightKg: Number(e.target.value) })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">SpO2 Oxygen</label>
                  <input
                    type="text"
                    value={vitals.spO2}
                    onChange={(e) => setVitals({ ...vitals, spO2: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-700 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaint */}
            <Input
              label="Chief Complaint / Reason for Visit"
              required
              placeholder="e.g. Follow-up for dyslipidemia and morning lightheadedness"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
            />

            {/* AI Clinical Assistant Toolbar */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-teal-50 border border-teal-200 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-teal-800 font-bold">
                <FiZap className="w-4 h-4 text-teal-600" />
                <span>AI Clinical Assistant</span>
                <span className="text-[10px] font-normal text-teal-600">(Doctor Review Required)</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  loading={questionsLoading}
                  onClick={handleGenerateQuestions}
                  icon={FiHelpCircle}
                >
                  Suggest Clinical Questions
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={summaryGenerating}
                  onClick={handleGenerateAISummary}
                  icon={FiZap}
                >
                  Draft Encounter Summary
                </Button>
              </div>
            </div>

            {/* Suggested Doctor Questions Assistant */}
            {doctorQuestions.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  AI Suggested Clarifying Questions:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  {doctorQuestions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Draft Summary Preview Box */}
            {aiDraftSummary && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                  <span>AI-Generated Draft Summary (Review & Edit):</span>
                  <button
                    type="button"
                    onClick={handleApplyAISummary}
                    className="px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold transition-colors"
                  >
                    Insert into Clinical Notes ↓
                  </button>
                </div>
                <p className="text-xs text-amber-800 font-mono whitespace-pre-wrap leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-200/70">
                  {aiDraftSummary}
                </p>
                <p className="text-[10px] text-amber-700">
                  * Clinical disclaimer: The attending physician remains the final clinical authority. Verify before committing.
                </p>
              </div>
            )}

            {/* Clinical Examination Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Objective Clinical Findings & Examination Notes
              </label>
              <textarea
                rows={3}
                placeholder="Record cardiovascular auscultation, respiratory examination, hydration status, neurological signs..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>

            {/* Assessment & Formal Diagnosis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Clinical Assessment / Diagnosis"
                required
                placeholder="e.g. Dyslipidemia (ICD-10 E78.5) & Benign Orthostatic Hypotension"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
              <Input
                label="Clinical Treatment Plan & Recommendations"
                placeholder="e.g. Maintain hydration, take statin post-cibus nocte, repeat lipid profile in 4w"
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL PRESCRIPTION BUILDER & SAFETY */}
        {activeTab === "prescription" && (
          <div className="space-y-4">
            {/* Medication Safety Alerts Banner (Section 15, 16) */}
            {safetyAlerts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Potential Medication Safety Alert ({safetyAlerts.length} detected)
                      </h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Assistive clinical check based on TriMedi Medication Safety Provider. Please review before issuing.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertsAcknowledged(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      alertsAcknowledged
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
                    }`}
                  >
                    {alertsAcknowledged ? "✓ Clinically Acknowledged" : "Acknowledge Alerts"}
                  </button>
                </div>
                <div className="space-y-1.5 pt-1">
                  {safetyAlerts.map((alt, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-white/80 border border-amber-200/80 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          {alt.type}
                        </span>
                        <span>{alt.medicine}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{alt.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Prescription Medicines & Dosing Schedule</h4>
                <p className="text-[11px] text-slate-500">
                  Doctor-verified prescription items. Normalized medications and schedules will automatically generate upon issue.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  loading={safetyChecking}
                  onClick={() => runSafetyCheck()}
                  icon={FiShield}
                >
                  Run Safety Check
                </Button>
                <Button variant="primary" size="sm" icon={FiPlus} onClick={handleAddMedicine}>
                  Add Medicine
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {prescriptionItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Atorvastatin"
                      value={item.medicineName}
                      onChange={(e) => handleMedicineChange(idx, "medicineName", e.target.value)}
                      onBlur={() => runSafetyCheck()}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-700 font-bold text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dosage</label>
                    <input
                      type="text"
                      placeholder="20mg"
                      value={item.dosage}
                      onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none font-semibold text-slate-700"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Frequency</label>
                    <input
                      type="text"
                      placeholder="Once daily (Night)"
                      value={item.frequency}
                      onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none text-slate-700"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Days</label>
                    <input
                      type="number"
                      value={item.durationDays}
                      onChange={(e) => handleMedicineChange(idx, "durationDays", Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none text-slate-700"
                    />
                  </div>
                  <div className="sm:col-span-1 text-right pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove medicine"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <Input
                label="Recommended Follow-Up Date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <div className="flex flex-col justify-end">
                <p className="text-[11px] text-slate-500">
                  Completing will digitally sign and issue this prescription directly into the patient's TriMedi Vault and activate medication adherence telemetry.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LONGITUDINAL MEDICAL HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-bold text-slate-800 block mb-1.5">Existing Medical Conditions</span>
                <div className="flex flex-wrap gap-1.5">
                  {patient.existingConditions?.map((c, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-bold text-slate-800 block mb-1.5">Current Active Medications</span>
                <div className="flex flex-wrap gap-1.5">
                  {patient.currentMedications?.map((m, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 font-semibold border border-brand-100">
                      💊 {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Historical Care Timeline */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-bold text-slate-800 block mb-2">Longitudinal Encounter History</span>
              {medicalRecord?.timeline?.length > 0 ? (
                <div className="space-y-2.5">
                  {medicalRecord.timeline.slice(0, 4).map((event) => (
                    <div key={event.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">{event.title}</strong>
                        <span className="text-[10px] text-slate-400">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      {event.details?.diagnosis && (
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Diagnosis: <span className="font-semibold">{event.details.diagnosis}</span>
                        </p>
                      )}
                      {event.details?.medicines && (
                        <p className="text-[10px] text-brand-700 mt-0.5">
                          Rx: {event.details.medicines.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No previous recorded consultations on file.</p>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProgress}
              loading={savingNotes}
            >
              Save Progress
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCompleteConsultation}
            loading={completing}
            icon={FiCheckCircle}
          >
            Complete Consultation & Issue Rx
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConsultationWorkspaceModal;
