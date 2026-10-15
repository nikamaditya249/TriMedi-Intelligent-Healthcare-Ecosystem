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

  const handleAddMedicine = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicineName: "",
        dosage: "500mg",
        frequency: "Twice daily after meals",
        durationDays: 30,
        instructions: "Take with food",
      },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
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

  const handleCompleteConsultation = async () => {
    if (!diagnosis) {
      setErrorMessage("Please record a clinical assessment or diagnosis before concluding.");
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
    dob: "1994-06-15",
    gender: "Male",
    bloodGroup: "O+",
    allergies: ["Penicillin"],
    existingConditions: ["Dyslipidemia", "Mild Hypertension"],
    currentMedications: ["Atorvastatin 20mg", "Telmisartan 40mg"],
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Clinical Consultation Workspace: ${patientQueueItem.patientName}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* 1. Patient Header & Vitals Ribbon */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-700 text-white font-bold text-lg flex items-center justify-center shadow-subtle border border-brand-800">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{patient.name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  Queue #{patientQueueItem.queueNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {patient.gender} • DOB: {patient.dob}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Blood Group: <strong className="text-slate-700">{patient.bloodGroup}</strong> • Phone: {patientQueueItem.patientPhone || "+91 98765 43210"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {patient.allergies?.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                <FiAlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Allergy: {patient.allergies.join(", ")}
              </div>
            )}
            <Badge variant="brand" size="sm">
              MD Authorized Encounter
            </Badge>
          </div>
        </div>

        {/* 2. Workspace Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveTab("encounter")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "encounter"
                ? "bg-white text-brand-800 shadow-subtle"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1. Clinical Notes & Assessment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-white text-brand-800 shadow-subtle"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            2. Medical History & Longitudinal Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("prescription")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "prescription"
                ? "bg-white text-brand-800 shadow-subtle"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            3. Digital Prescription & Follow-Up ({prescriptionItems.length})
          </button>
        </div>

        {/* Feedback alerts */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600" />
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-rose-600" />
            {errorMessage}
          </div>
        )}

        {/* 3. TAB 1: CLINICAL ENCOUNTER NOTES & VITALS */}
        {activeTab === "encounter" && (
          <div className="space-y-4">
            {/* Vitals Input Row */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-bold text-slate-800 block mb-2">Patient Vitals at Encounter</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
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

            {/* Chief Complaint & Reason */}
            <Input
              label="Chief Complaint / Reason for Visit"
              required
              placeholder="e.g. Follow-up for dyslipidemia and morning lightheadedness"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
            />

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

        {/* 4. TAB 2: LONGITUDINAL MEDICAL HISTORY & CLINICAL SUMMARY */}
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

        {/* 5. TAB 3: DIGITAL PRESCRIPTION BUILDER & FOLLOW-UP */}
        {activeTab === "prescription" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Prescription Medicines & Dosing Schedule</h4>
                <p className="text-[11px] text-slate-500">
                  Doctor-verified prescription items to be generated and digitally authorized
                </p>
              </div>
              <Button variant="outline" size="sm" icon={FiPlus} onClick={handleAddMedicine}>
                Add Medicine
              </Button>
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
                  Completing will digitally sign and issue this prescription directly into the patient's TriMedi Vault.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. Footer Actions */}
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
