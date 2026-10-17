import React, { useState, useEffect } from "react";
import {
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiAlertTriangle,
  FiInfo,
  FiFileText,
  FiClock,
  FiCheck,
} from "react-icons/fi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { getConsents, revokeConsent, grantConsent, exportPatientData, requestAccountDeletion } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function PrivacyTrustModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);

  const loadConsents = async () => {
    try {
      setLoading(true);
      const res = await getConsents(user?.email);
      if (res && res.success) {
        setConsents(res.consents || []);
      }
    } catch (err) {
      console.warn("Consent load note:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConsents();
      setActionMessage("");
    }
  }, [isOpen]);

  const handleToggleConsent = async (consentType, currentlyGranted) => {
    try {
      if (currentlyGranted) {
        const res = await revokeConsent({ consentType });
        if (res.success) {
          setActionMessage(`Optional consent for ${consentType} revoked.`);
          loadConsents();
        } else if (res.error?.code === "MANDATORY_CONSENT_CANNOT_BE_REVOKED") {
          setActionMessage("Clinical treatment consent is mandatory for active care.");
        }
      } else {
        const res = await grantConsent({ consentType });
        if (res.success) {
          setActionMessage(`Consent granted for ${consentType}.`);
          loadConsents();
        }
      }
    } catch (err) {
      setActionMessage(err.message || "Unable to update consent.");
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const res = await exportPatientData({ patientEmail: user?.email });
      if (res && res.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.export, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `trimedi_health_records_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setActionMessage("Health records exported successfully as encrypted/standardized JSON.");
      }
    } catch (err) {
      setActionMessage(err.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to request account deletion? Your marketing preferences will be purged immediately, and clinical prescription records will be archived according to statutory healthcare retention rules."
    );
    if (!confirmed) return;

    try {
      const res = await requestAccountDeletion({ reason: "Patient requested deletion via Privacy Settings" });
      if (res && res.success) {
        setDeletionRequested(true);
        setActionMessage("Deletion request registered. Clinical records archived for statutory compliance.");
      }
    } catch (err) {
      setActionMessage(err.message || "Failed to submit deletion request.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy, Consent & Trust Hub" size="lg">
      <div className="space-y-6">
        {/* Banner */}
        <div className="rounded-lg bg-teal-50 border border-teal-200/80 p-4 flex items-start gap-3">
          <FiShield className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-900 leading-relaxed">
            <span className="font-bold">Patient-Controlled Privacy:</span> TriMedi adheres to data minimization,
            cryptographic isolation, and separate clinical vs. marketing consents. You retain sovereign control over your
            optional data sharing and export rights.
          </div>
        </div>

        {actionMessage && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* 1. Versioned Consent Management */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-teal-600" />
              Active Consents & Permissions (Policy v2026.1)
            </h3>
            <Badge variant="neutral">Versioned</Badge>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Clinical treatment consent is separated from optional assistive AI and notification preferences.
          </p>

          <div className="space-y-2.5">
            {[
              {
                type: "CONSULTATION_DATA",
                title: "Clinical Consultation Data Processing",
                desc: "Storage and access to clinical notes and vitals by authorized doctors.",
                mandatory: true,
              },
              {
                type: "PRESCRIPTION_PROCESSING",
                title: "Prescription Fulfillment Routing",
                desc: "Secure routing of doctor-approved prescriptions to licensed pharmacies.",
                mandatory: true,
              },
              {
                type: "AI_ASSISTANCE",
                title: "Assistive AI & OCR Processing",
                desc: "De-identified optical character recognition for prescription scans.",
                mandatory: false,
              },
              {
                type: "NOTIFICATION_SMS",
                title: "SMS & Automated Refill Telemetry",
                desc: "Proactive text messages and WhatsApp queue alerts.",
                mandatory: false,
              },
              {
                type: "MARKETING",
                title: "Wellness Tips & Platform Updates",
                desc: "Optional healthcare education newsletters.",
                mandatory: false,
              },
            ].map((c) => {
              const matched = consents.find((item) => item.consentType === c.type);
              const isGranted = matched ? matched.granted : c.mandatory;

              return (
                <div
                  key={c.type}
                  className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">{c.title}</span>
                      {c.mandatory ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Mandatory Care Baseline
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{c.desc}</p>
                  </div>

                  <div>
                    {c.mandatory ? (
                      <span className="text-xs text-slate-400 font-medium">Enforced</span>
                    ) : (
                      <button
                        onClick={() => handleToggleConsent(c.type, isGranted)}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                          isGranted
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                        }`}
                      >
                        {isGranted ? "Revoke" : "Grant"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Medical AI Disclaimer Disclosure */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <FiInfo className="w-4 h-4 text-teal-600" />
            Medical AI Transparency Disclosure
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            TriMedi AI is strictly an <strong>assistive technology</strong>. AI outputs are saved in draft status and must
            be clinically verified by a licensed physician. AI does not autonomously diagnose or prescribe.
          </p>
        </div>

        {/* 3. Patient Data Export & Retention Controls */}
        <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Sovereign Data Rights & Portability
          </h4>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              icon={FiDownload}
              onClick={handleExportData}
              disabled={exporting}
              className="flex-1"
            >
              {exporting ? "Generating Export..." : "Export My Health Data (JSON)"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={FiClock}
              onClick={handleRequestDeletion}
              disabled={deletionRequested}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              {deletionRequested ? "Deletion Pending" : "Request Account Closure"}
            </Button>
          </div>
          <p className="text-[11px] text-slate-400">
            Exports include your appointments, active prescriptions, and adherence telemetry. Data is stripped of internal
            database keys.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PrivacyTrustModal;
