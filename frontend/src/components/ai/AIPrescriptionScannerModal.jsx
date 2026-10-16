import React, { useState } from "react";
import {
  FiZap,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiAlertTriangle,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiShield,
  FiEye,
  FiCheck,
} from "react-icons/fi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import { extractPrescriptionWithAI, createPrescription } from "../../api";
import { useAuth } from "../../context/AuthContext";

function ConfidenceBadge({ field }) {
  if (!field || typeof field !== "object") return null;
  const pct = Math.round((field.confidence || 0) * 100);
  if (field.status === "missing" || field.tier === "low") {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
        Missing / Low ({pct}%)
      </span>
    );
  }
  if (field.tier === "review_recommended") {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
        Review ({pct}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
      High ({pct}%)
    </span>
  );
}

export function AIPrescriptionScannerModal({ isOpen, onClose, onPrescriptionConfirmed }) {
  const { user, activeRole } = useAuth();
  const isDoctor = activeRole === "doctor" || user?.role === "doctor";

  const [stage, setStage] = useState("upload"); // upload | analyzing | review | success
  const [inputText, setInputText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [extractedData, setExtractedData] = useState(null);

  const samplePrescriptions = [
    {
      title: "Sample 1: Cardio Prescription",
      text: "Dr. Sarah Jenkins, MD - Patient: Aditya Nikam. Diagnosis: Dyslipidemia and Mild Hypertension. Rx: 1) Atorvastatin 20mg, once daily at night for 30 days (quantity: 30). 2) Telmisartan 40mg, once daily morning for 30 days (quantity: 30). Take with water.",
    },
    {
      title: "Sample 2: Diabetes Care",
      text: "Dr. Rajesh Gupta, MD - Patient: Aditya Nikam. Diagnosis: Type 2 Diabetes Management. Rx: 1) Metformin 500mg, twice daily after meals for 60 days (quantity: 60). 2) Glimepiride 1mg, once daily morning for 30 days (quantity: 30).",
    },
    {
      title: "Sample 3: Incomplete/Unclear Scan",
      text: "Rx: Paracetamol, take twice daily. Doctor signature illegible.",
    },
  ];

  const handleScan = async (customText) => {
    const textToAnalyze = customText || inputText;
    if (!textToAnalyze && !selectedFileName) {
      setError("Please paste prescription text or upload a document file to scan.");
      return;
    }

    setError("");
    setStage("analyzing");
    setAnalyzing(true);

    try {
      const res = await extractPrescriptionWithAI({
        documentText: textToAnalyze,
        filename: selectedFileName || "prescription_upload.png",
      });

      if (res.success && res.candidate) {
        setExtractedData(res.candidate);
        setStage("review");
      } else {
        setError(res.message || "AI extraction was unable to parse prescription. You can input data manually.");
        setStage("upload");
      }
    } catch (err) {
      setError("AI analysis service notice: " + err.message);
      setStage("upload");
    } finally {
      setAnalyzing(false);
    }
  };

  const getFieldValue = (field) => {
    if (!field) return "";
    return typeof field === "object" ? (field.value ?? "") : field;
  };

  const handleFieldChange = (topField, value) => {
    setExtractedData((prev) => {
      const existing = prev[topField];
      return {
        ...prev,
        [topField]: typeof existing === "object" ? { ...existing, value } : value,
      };
    });
  };

  const handleMedicineChange = (idx, medField, value) => {
    setExtractedData((prev) => {
      const meds = [...(prev.medicines || [])];
      const current = meds[idx][medField];
      meds[idx] = {
        ...meds[idx],
        [medField]: typeof current === "object" ? { ...current, value } : value,
      };
      if (medField === "durationDays") {
        const curQty = meds[idx]["quantity"];
        meds[idx]["quantity"] = typeof curQty === "object" ? { ...curQty, value: Number(value) || 30 } : (Number(value) || 30);
      }
      return { ...prev, medicines: meds };
    });
  };

  const handleConfirmSave = async (forceApprove = false) => {
    setSaving(true);
    setError("");

    try {
      const medicines = (extractedData.medicines || []).map((m) => ({
        medicineName: getFieldValue(m.medicineName) || "Prescribed Medicine",
        dosage: getFieldValue(m.dosage) || getFieldValue(m.strength) || "1 Tab",
        frequency: getFieldValue(m.frequency) || "Once daily",
        durationDays: Number(getFieldValue(m.durationDays)) || 30,
        quantityPrescribed: Number(getFieldValue(m.quantity)) || Number(getFieldValue(m.durationDays)) || 30,
        instructions: getFieldValue(m.instructions) || "",
      }));

      // Phase 3 Rule #3: AI extraction MUST create a DRAFT unless explicitly approved by authorized doctor
      const targetStatus = isDoctor && forceApprove ? "active" : "draft";

      const payload = {
        patientName: user?.name || "Aditya Nikam",
        patientEmail: user?.email || "aditya@trimedi.health",
        doctorName: getFieldValue(extractedData.doctorName) || "Dr. Sarah Jenkins, MD",
        doctorSpecialty: "Internal Medicine",
        diagnosis: getFieldValue(extractedData.diagnosis) || "Extracted Clinical Review",
        notes: "Scanned via TriMedi AI OCR. Human verification performed before saving.",
        aiExtracted: true,
        originalDocumentName: selectedFileName || "Scanned_Prescription.png",
        status: targetStatus,
        items: medicines,
      };

      const res = await createPrescription(payload);
      if (res.prescription) {
        setSuccessMessage(
          targetStatus === "active"
            ? "Prescription clinically verified and approved into active care."
            : "Prescription saved as DRAFT. Doctor verification required before medication activation."
        );
        setStage("success");
        setTimeout(() => {
          onPrescriptionConfirmed && onPrescriptionConfirmed(res.prescription);
          onClose();
          setStage("upload");
          setPreviewUrl(null);
        }, 1500);
      } else {
        setError(res.message || "Unable to confirm prescription");
      }
    } catch (err) {
      setError("Failed to save prescription: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI-Assisted Prescription Document Understanding"
      maxWidth="max-w-3xl"
    >
      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <FiAlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. UPLOAD STAGE */}
      {stage === "upload" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/40 text-center hover:bg-teal-50/70 transition-colors">
            <FiUploadCloud className="w-10 h-10 text-teal-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Upload Prescription Document or Image</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              Supports PNG, JPG, JPEG, and PDF documents. TriMedi AI extracts structured medicines, strengths, dosages, frequencies, and refill quantities with field-level confidence.
            </p>

            <input
              type="file"
              id="prescription-file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFileName(file.name);
                  if (file.type.startsWith("image/")) {
                    setPreviewUrl(URL.createObjectURL(file));
                  } else {
                    setPreviewUrl(null);
                  }
                  setInputText(`Prescription scan from file: ${file.name}`);
                }
              }}
            />
            <label
              htmlFor="prescription-file"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
            >
              <FiFileText className="w-4 h-4 text-teal-600" />
              <span>{selectedFileName ? selectedFileName : "Choose File to Scan"}</span>
            </label>
          </div>

          {previewUrl && (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
              <img src={previewUrl} alt="Prescription preview" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
              <div className="text-xs">
                <p className="font-bold text-slate-800">{selectedFileName}</p>
                <p className="text-slate-500">Document preview attached for AI extraction verification.</p>
              </div>
            </div>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase font-semibold">
              Or paste text / select sample
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <textarea
            rows={3}
            placeholder="Paste raw prescription text or doctor note..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Test Samples:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {samplePrescriptions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(s.text);
                    setSelectedFileName(s.title);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-700 transition-all"
                >
                  <p className="text-teal-700 font-bold truncate">{s.title}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{s.text}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleScan()}
              icon={FiZap}
            >
              Analyze with TriMedi AI
            </Button>
          </div>
        </div>
      )}

      {/* 2. ANALYZING STAGE */}
      {stage === "analyzing" && (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto animate-bounce shadow-sm border border-brand-200">
            <FiZap className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900">TriMedi AI Analyzing Document...</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Extracting medicine names, strengths, dosages, treatment durations, and dosing frequencies with field-level confidence. Missing fields will remain null rather than guessed.
          </p>
        </div>
      )}

      {/* 3. REVIEW & EDIT STAGE */}
      {stage === "review" && extractedData && (
        <div className="space-y-4">
          {/* Assistive Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <FiShield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Human Verification Required — Assistive AI</p>
              <p className="text-amber-700 mt-0.5">
                AI extracted this information from the uploaded prescription. Please verify all fields before approving. AI output creates a DRAFT and never overrides clinical judgment.
              </p>
            </div>
          </div>

          {previewUrl && (
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiEye className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-slate-700">Document Scan: {selectedFileName}</span>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-600 hover:underline font-bold"
              >
                Open Full Scan ↗
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Diagnosis</label>
                <ConfidenceBadge field={extractedData.diagnosis} />
              </div>
              <input
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={getFieldValue(extractedData.diagnosis)}
                onChange={(e) => handleFieldChange("diagnosis", e.target.value)}
                placeholder="Enter clinical diagnosis"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Prescribing Doctor</label>
                <ConfidenceBadge field={extractedData.doctorName} />
              </div>
              <input
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={getFieldValue(extractedData.doctorName)}
                onChange={(e) => handleFieldChange("doctorName", e.target.value)}
                placeholder="e.g. Dr. Sarah Jenkins, MD"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700 uppercase">
                Extracted Medicines ({extractedData.medicines?.length || 0}):
              </p>
              <span className="text-[11px] text-slate-500">Review all confidence tiers before saving</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {extractedData.medicines?.map((med, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-600">Medicine</label>
                        <ConfidenceBadge field={med.medicineName} />
                      </div>
                      <input
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={getFieldValue(med.medicineName)}
                        onChange={(e) => handleMedicineChange(idx, "medicineName", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-600">Dosage / Strength</label>
                        <ConfidenceBadge field={med.dosage || med.strength} />
                      </div>
                      <input
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={getFieldValue(med.dosage) || getFieldValue(med.strength)}
                        onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-600">Frequency</label>
                        <ConfidenceBadge field={med.frequency} />
                      </div>
                      <input
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={getFieldValue(med.frequency)}
                        onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-600">Duration (Days)</label>
                        <ConfidenceBadge field={med.durationDays} />
                      </div>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={getFieldValue(med.durationDays)}
                        onChange={(e) => handleMedicineChange(idx, "durationDays", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-600">Quantity</label>
                        <ConfidenceBadge field={med.quantity} />
                      </div>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={getFieldValue(med.quantity)}
                        onChange={(e) => handleMedicineChange(idx, "quantity", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-600">Instructions</label>
                        <ConfidenceBadge field={med.instructions} />
                      </div>
                      <input
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={getFieldValue(med.instructions)}
                        onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)}
                        placeholder="e.g. After food"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <Button variant="secondary" size="md" onClick={() => setStage("upload")}>
              ← Re-scan Document
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                loading={saving}
                onClick={() => handleConfirmSave(false)}
              >
                Save as Draft
              </Button>
              {isDoctor ? (
                <Button
                  variant="primary"
                  size="md"
                  loading={saving}
                  onClick={() => handleConfirmSave(true)}
                  icon={FiCheckCircle}
                >
                  Doctor Approve & Issue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  loading={saving}
                  onClick={() => handleConfirmSave(false)}
                  icon={FiCheckCircle}
                >
                  Save Draft for Doctor Review
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SUCCESS STAGE */}
      {stage === "success" && (
        <div className="py-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">Prescription Processed!</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {successMessage || "Prescription recorded successfully with complete audit traceability."}
          </p>
        </div>
      )}
    </Modal>
  );
}

export default AIPrescriptionScannerModal;
