import React, { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiRefreshCw,
  FiZap,
} from "react-icons/fi";
import { useSocket } from "../../context/SocketContext";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import { getTodayDoseSchedule, recordDose, simplifyInstructionsWithAI } from "../../api";

export function TodayMedicationSchedule({ onDoseUpdated, onOrderAgain }) {
  const { socket } = useSocket();
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordingId, setRecordingId] = useState(null);

  // Simplified instructions modal
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainMed, setExplainMed] = useState(null);
  const [simplifiedText, setSimplifiedText] = useState("");
  const [simplifying, setSimplifying] = useState(false);

  const fetchSchedule = async () => {
    try {
      const res = await getTodayDoseSchedule();
      if (res && res.success) {
        setScheduleData(res);
      }
    } catch (err) {
      console.warn("Schedule fetch notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleRemoteDoseUpdate = () => {
      fetchSchedule();
    };

    socket.on("medication:dose:taken", handleRemoteDoseUpdate);
    socket.on("medication:dose:skipped", handleRemoteDoseUpdate);
    socket.on("medication:dose:missed", handleRemoteDoseUpdate);
    socket.on("medication:adherence_updated", handleRemoteDoseUpdate);
    socket.on("medication:adherence:updated", handleRemoteDoseUpdate);

    return () => {
      socket.off("medication:dose:taken", handleRemoteDoseUpdate);
      socket.off("medication:dose:skipped", handleRemoteDoseUpdate);
      socket.off("medication:dose:missed", handleRemoteDoseUpdate);
      socket.off("medication:adherence_updated", handleRemoteDoseUpdate);
      socket.off("medication:adherence:updated", handleRemoteDoseUpdate);
    };
  }, [socket]);

  const handleRecord = async (medicationId, item, status) => {
    const slotKey = item.slot || item.timeSlot || "morning";
    setRecordingId(`${medicationId}_${slotKey}`);
    try {
      const res = await recordDose(medicationId, {
        timeSlot: slotKey,
        slot: slotKey,
        date: scheduleData?.date || new Date().toISOString().split("T")[0],
        status,
      });
      if (res && res.success) {
        await fetchSchedule();
        onDoseUpdated && onDoseUpdated();
      } else {
        alert(res?.message || "Unable to record dose. Please try again.");
      }
    } catch (err) {
      console.error("Failed to record dose:", err);
    } finally {
      setRecordingId(null);
    }
  };

  const handleExplain = async (item) => {
    setExplainMed(item);
    setExplainModalOpen(true);
    setSimplifying(true);
    try {
      const res = await simplifyInstructionsWithAI({
        medicines: [
          {
            name: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            instructions: item.instructions || "Take as prescribed",
          },
        ],
      });
      const guide = res?.guidelines?.[0] || res?.simplifiedItems?.[0];
      if (res?.success && guide) {
        setSimplifiedText(
          guide.plainLanguage || `${guide.howToTake || ""} ${guide.timingGuidance || ""}`.trim()
        );
      } else {
        setSimplifiedText(
          `Take ${item.dose || item.dosage || "1 dose"} of ${item.medicationName} as prescribed by your doctor.`
        );
      }
    } catch (err) {
      setSimplifiedText("Please confirm this instruction directly with your doctor.");
    } finally {
      setSimplifying(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="py-6 text-center text-xs text-slate-400">
          Loading today's medication routine and dose schedule...
        </div>
      </Card>
    );
  }

  const items = scheduleData?.schedule || [];
  const adherence = scheduleData?.adherence || { adherencePercentage: 100, statement: "Medication adherence: 100% based on recorded doses." };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Today's Medication Schedule</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200">
              {scheduleData?.date || new Date().toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record each dose to maintain accurate adherence telemetry for your care team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={adherence.adherencePercentage >= 80 ? "success" : "warning"} size="sm">
            {adherence.adherencePercentage}% Adherence
          </Badge>
          <Button variant="ghost" size="sm" onClick={fetchSchedule} icon={FiRefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Neutral Adherence Statement (Section 7 Compliance) */}
      <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <FiInfo className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{adherence.statement}</span>
        </div>
        <span className="text-[11px] text-slate-400">Objective record</span>
      </div>

      {/* Schedule Items List */}
      <div className="space-y-3 mt-4">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active medication doses scheduled for today. New prescriptions will automatically appear here once approved.
          </div>
        ) : (
          items.map((item, idx) => {
            const isTaken = item.status === "TAKEN";
            const isMissed = item.status === "MISSED";
            const isSkipped = item.status === "SKIPPED";
            const slotKey = item.slot || item.timeSlot || "morning";
            const isBusy = recordingId === `${item.medicationId}_${slotKey}`;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isTaken
                    ? "bg-emerald-50/50 border-emerald-200"
                    : isMissed
                    ? "bg-rose-50/40 border-rose-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                      isTaken
                        ? "bg-emerald-100 text-emerald-700"
                        : isMissed
                        ? "bg-rose-100 text-rose-700"
                        : "bg-teal-50 text-teal-700 border border-teal-200"
                    }`}
                  >
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">{item.medicationName}</h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {item.dose || "1 Dose"}
                      </span>
                      <span className="text-xs text-slate-500 font-medium capitalize">
                        • {slotKey} ({item.scheduledTime || "Scheduled"})
                      </span>
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Instructions: <span className="text-slate-700">{item.instructions}</span>
                      </p>
                    )}
                    {item.refillDue && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold">
                        <FiAlertCircle className="w-3.5 h-3.5" />
                        <span>Supply running low. Refill available.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleExplain(item)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg"
                    title="Explain in patient-friendly terms"
                  >
                    <FiZap className="w-3 h-3 text-teal-600" />
                    <span>Explain</span>
                  </button>

                  {isTaken ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg shadow-xs">
                      <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>✓ Taken</span>
                    </span>
                  ) : isMissed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-lg shadow-xs">
                      <FiXCircle className="w-4 h-4 text-rose-600" />
                      <span>Missed</span>
                    </span>
                  ) : isSkipped ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg shadow-xs">
                      <span>Skipped</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={isBusy}
                        onClick={() => handleRecord(item.medicationId, item, "TAKEN")}
                        icon={FiCheckCircle}
                      >
                        Take
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleRecord(item.medicationId, item, "SKIPPED")}
                      >
                        Skip
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleRecord(item.medicationId, item, "MISSED")}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        Miss
                      </Button>
                    </div>
                  )}

                  {item.refillDue && onOrderAgain && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOrderAgain(item)}
                      icon={FiRefreshCw}
                    >
                      Order Again
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Explanation Modal */}
      <Modal
        isOpen={explainModalOpen}
        onClose={() => setExplainModalOpen(false)}
        title="Patient-Friendly Medication Instructions"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-2.5 text-xs text-teal-900">
            <FiZap className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Assistive Medication Guidance</p>
              <p className="text-teal-700 mt-0.5">
                AI translation converts complex clinical abbreviations into plain, friendly language. Always follow your prescribing doctor's direct advice.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800">{explainMed?.medicationName}</h4>
            <p className="text-xs text-slate-500">
              Dosage: {explainMed?.dose || explainMed?.dosage || "1 Dose"} • {explainMed?.frequency || "As prescribed"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              How to Take This Medication:
            </p>
            {simplifying ? (
              <p className="text-xs text-slate-400 animate-pulse">Simplifying instructions...</p>
            ) : (
              <p className="text-xs text-slate-800 leading-relaxed font-medium">{simplifiedText}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setExplainModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export default TodayMedicationSchedule;
