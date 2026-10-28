import React, { useState, useEffect } from "react";
import {
  FiFileText,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiActivity,
  FiClock,
  FiShield,
} from "react-icons/fi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input, { Select } from "../ui/Input";
import Badge from "../ui/Badge";
import { createPrescription } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function CreatePrescriptionModal({ isOpen, onClose, onCreated, initialPatient = null }) {
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1: Patient/Diagnosis, 2: Medicines, 3: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    patientName: "Aditya Nikam",
    patientEmail: "aditya@trimedi.health",
    diagnosis: "Dyslipidemia & Hypertension Management",
    doctorName: user?.name || "Dr. Sarah Jenkins, MD",
    doctorEmail: user?.email || "doctor@trimedi.health",
    doctorSpecialty: user?.specialty || "Internal Medicine & Cardiology",
    validUntil: "2026-11-30",
    notes: "Follow low-sodium diet and repeat lipid test in 4 weeks.",
    items: [
      {
        medicineName: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily (Night)",
        durationDays: 30,
        quantityPrescribed: 30,
        instructions: "Take 1 tablet after dinner",
      },
    ],
  });

  useEffect(() => {
    if (initialPatient) {
      setFormData((prev) => ({
        ...prev,
        patientName: initialPatient.name || initialPatient.patientName || prev.patientName,
        patientEmail: initialPatient.email || initialPatient.patientEmail || prev.patientEmail,
        diagnosis: initialPatient.diagnosis || prev.diagnosis,
      }));
    }
  }, [initialPatient, isOpen]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          medicineName: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily after meals",
          durationDays: 30,
          quantityPrescribed: 30,
          instructions: "Take with meals",
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    if (field === "durationDays") {
      updated[index]["quantityPrescribed"] = Number(value) || 30;
    }
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await createPrescription(formData);
      if (res.prescription) {
        onCreated && onCreated(res.prescription);
        onClose();
        setStep(1);
      } else {
        setError(res.message || "Unable to save prescription");
      }
    } catch (err) {
      setError(err.message || "Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Issue Digital Prescription (Step ${step} of 3)`}
      maxWidth="max-w-2xl"
    >
      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Tabs */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 text-xs font-semibold">
        <span className={`px-3 py-1 rounded-lg ${step === 1 ? "bg-teal-50 text-teal-700 font-bold" : "text-slate-400"}`}>
          1. Patient & Diagnosis
        </span>
        <span className={`px-3 py-1 rounded-lg ${step === 2 ? "bg-teal-50 text-teal-700 font-bold" : "text-slate-400"}`}>
          2. Prescribed Medicines
        </span>
        <span className={`px-3 py-1 rounded-lg ${step === 3 ? "bg-teal-50 text-teal-700 font-bold" : "text-slate-400"}`}>
          3. Clinical Review & Sign
        </span>
      </div>

      {/* STEP 1: PATIENT & DIAGNOSIS */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Patient Full Name"
              required
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            />
            <Input
              label="Patient Email / TriMedi ID"
              required
              value={formData.patientEmail}
              onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
            />
          </div>

          <Input
            label="Primary Diagnosis / Clinical Indication"
            required
            placeholder="e.g., Acute Bronchitis, Type 2 Diabetes"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prescription Validity Date"
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
            <Input
              label="Doctor Specialty"
              value={formData.doctorSpecialty}
              onChange={(e) => setFormData({ ...formData, doctorSpecialty: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="doctor" size="md" onClick={() => setStep(2)}>
              Next: Add Medicines →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: MEDICATION ITEMS BUILDER */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase">Medication Items ({formData.items.length})</p>
            <Button variant="brandOutline" size="sm" icon={FiPlus} onClick={handleAddItem}>
              Add Another Medicine
            </Button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {formData.items.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Medicine #{idx + 1}</span>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Input
                    label="Medicine Name"
                    required
                    placeholder="e.g., Atorvastatin"
                    value={item.medicineName}
                    onChange={(e) => handleItemChange(idx, "medicineName", e.target.value)}
                  />
                  <Input
                    label="Dosage"
                    placeholder="e.g., 20mg, 500mg"
                    value={item.dosage}
                    onChange={(e) => handleItemChange(idx, "dosage", e.target.value)}
                  />
                  <Input
                    label="Frequency"
                    placeholder="e.g., Once daily (Night)"
                    value={item.frequency}
                    onChange={(e) => handleItemChange(idx, "frequency", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Input
                    label="Duration (Days)"
                    type="number"
                    value={item.durationDays}
                    onChange={(e) => handleItemChange(idx, "durationDays", e.target.value)}
                  />
                  <Input
                    label="Quantity Prescribed"
                    type="number"
                    value={item.quantityPrescribed}
                    onChange={(e) => handleItemChange(idx, "quantityPrescribed", e.target.value)}
                  />
                  <Input
                    label="Specific Instructions"
                    placeholder="e.g., After dinner"
                    value={item.instructions}
                    onChange={(e) => handleItemChange(idx, "instructions", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <Button variant="secondary" size="md" onClick={() => setStep(1)}>
              ← Back to Details
            </Button>
            <Button variant="doctor" size="md" onClick={() => setStep(3)}>
              Review & Sign Prescription →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & CONFIRMATION */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Review Clinical Prescription</p>
                <h4 className="text-sm font-bold text-slate-900">{formData.diagnosis}</h4>
              </div>
              <Badge variant="doctor" size="sm">
                Doctor Signed Draft
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-teal-100">
              <p><b>Patient:</b> {formData.patientName} ({formData.patientEmail})</p>
              <p><b>Prescribing Doctor:</b> {formData.doctorName}</p>
              <p><b>Valid Until:</b> {formData.validUntil}</p>
              <p><b>Total Items:</b> {formData.items.length} Medicines</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700 uppercase">Medication Schedule:</p>
            {formData.items.map((it, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{it.medicineName} ({it.dosage})</span>
                  <p className="text-slate-500">{it.frequency} • {it.instructions}</p>
                </div>
                <div className="text-right">
                  <Badge variant="brand" size="sm">
                    {it.durationDays} Days Duration
                  </Badge>
                  <p className="text-[10px] text-slate-400 mt-0.5">{it.quantityPrescribed} Units</p>
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Doctor Clinical Notes (Optional)"
            placeholder="Additional advice, dietary restrictions or follow-up instructions"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <Button variant="secondary" size="md" onClick={() => setStep(2)}>
              ← Edit Items
            </Button>
            <Button
              variant="doctor"
              size="md"
              loading={loading}
              onClick={handleSubmit}
              icon={FiCheckCircle}
            >
              Sign & Issue Digital Prescription
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default CreatePrescriptionModal;
