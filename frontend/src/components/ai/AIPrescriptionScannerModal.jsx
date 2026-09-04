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
} from "react-icons/fi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import { extractPrescriptionWithAI, createPrescription } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function AIPrescriptionScannerModal({ isOpen, onClose, onPrescriptionConfirmed }) {
  const { user, activeRole } = useAuth();

  const [stage, setStage] = useState("upload"); // upload | analyzing | review | success
  const [inputText, setInputText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const handleItemChange = (index, field, value) => {
    const updated = { ...extractedData };
    updated.medicines[index][field] = value;
    if (field === "durationDays") {
      updated.medicines[index]["quantity"] = Number(value) || 30;
    }
    setExtractedData(updated);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setError("");

    try {
      const payload = {
        patientName: user?.name || "Aditya Nikam",
        patientEmail: user?.email || "aditya@trimedi.health",
        doctorName: extractedData.doctorName || "Dr. Sarah Jenkins, MD",
        doctorSpecialty: extractedData.doctorSpecialty || "Internal Medicine",
        diagnosis: extractedData.diagnosis || "Extracted Clinical Review",
        notes: extractedData.notes || "Verified via AI extraction with user review.",
        aiExtracted: true,
        originalDocumentName: selectedFileName || "Scanned_Prescription.png",
        items: extractedData.medicines.map((m) => ({
          medicineName: m.medicineName || m.name,
          dosage: m.dosage || "1 Tab",
          frequency: m.frequency || "Once daily",
          durationDays: Number(m.durationDays) || 30,
          quantityPrescribed: Number(m.quantity) || Number(m.durationDays) || 30,
          instructions: m.instructions || "",
        })),
      };

      const res = await createPrescription(payload);
      if (res.prescription) {
        setStage("success");
        setTimeout(() => {
          onPrescriptionConfirmed && onPrescriptionConfirmed(res.prescription);
          onClose();
          setStage("upload");
        }, 1200);
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
      maxWidth="max-w-2xl"
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
              Supports PNG, JPG, PDF scans. TriMedi AI extracts structured medicines, dosages, and refill cycles.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <p className="text-teal-700">{s.title}</p>
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
            Extracting medicine names, dosages, treatment durations, and dosing frequencies into structured clinical items.
          </p>
        </div>
      )}

      {/* 3. REVIEW & EDIT STAGE */}
      {stage === "review" && extractedData && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <FiShield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Human Verification Required</p>
              <p className="text-amber-700 mt-0.5">
                AI extraction is an assistant. Please review and verify all extracted items, durations, and instructions below before confirming.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Diagnosis"
              value={extractedData.diagnosis}
              onChange={(e) => setExtractedData({ ...extractedData, diagnosis: e.target.value })}
            />
            <Input
              label="Prescribing Doctor"
              value={extractedData.doctorName}
              onChange={(e) => setExtractedData({ ...extractedData, doctorName: e.target.value })}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 uppercase mb-2">
              Extracted Medicines ({extractedData.medicines?.length || 0}):
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {extractedData.medicines?.map((med, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      label="Medicine Name"
                      value={med.medicineName}
                      onChange={(e) => handleItemChange(idx, "medicineName", e.target.value)}
                    />
                    <Input
                      label="Dosage"
                      value={med.dosage}
                      onChange={(e) => handleItemChange(idx, "dosage", e.target.value)}
                    />
                    <Input
                      label="Frequency"
                      value={med.frequency}
                      onChange={(e) => handleItemChange(idx, "frequency", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      label="Duration (Days)"
                      type="number"
                      value={med.durationDays}
                      onChange={(e) => handleItemChange(idx, "durationDays", e.target.value)}
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      value={med.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    />
                    <Input
                      label="Instructions"
                      value={med.instructions}
                      onChange={(e) => handleItemChange(idx, "instructions", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between">
            <Button variant="secondary" size="md" onClick={() => setStage("upload")}>
              ← Re-scan
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={saving}
              onClick={handleConfirmSave}
              icon={FiCheckCircle}
            >
              Confirm & Save Digital Prescription
            </Button>
          </div>
        </div>
      )}

      {/* 4. SUCCESS STAGE */}
      {stage === "success" && (
        <div className="py-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">Prescription Verified & Saved!</h4>
          <p className="text-xs text-slate-500">
            Digital prescription is now active and ready for one-click medicine ordering and refill tracking.
          </p>
        </div>
      )}
    </Modal>
  );
}

export default AIPrescriptionScannerModal;
