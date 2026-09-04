import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiCalendar,
  FiPackage,
  FiArrowRight,
} from "react-icons/fi";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export function MedicationTimeline({ medication, onReorder }) {
  const navigate = useNavigate();

  if (!medication) return null;

  const {
    name = "Atorvastatin",
    dosage = "20mg",
    prescribedDuration = 30,
    purchasedSupply = 15,
    remainingDays = 4,
    prescribedBy = "Dr. Sarah Jenkins, MD",
    timeline = [],
  } = medication;

  const supplyGap = Math.max(0, prescribedDuration - purchasedSupply);
  const supplyPercent = Math.min(100, Math.round((remainingDays / prescribedDuration) * 100));
  const isLow = remainingDays <= 5;

  return (
    <Card className="border-teal-100 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{name}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {dosage}
            </span>
            <Badge variant={isLow ? "warning" : "success"} dot size="sm">
              {isLow ? `Low Supply (~${remainingDays} Days Left)` : `Adequate (~${remainingDays} Days Left)`}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescribed by <span className="font-semibold text-slate-700">{prescribedBy}</span>
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="text-xs"
          onClick={() => {
            if (onReorder) onReorder(medication);
            else navigate("/products");
          }}
          icon={FiRefreshCw}
        >
          Order Refill Now
        </Button>
      </div>

      {/* Deterministic Supply Arithmetic Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
        <div>
          <span className="text-slate-400 uppercase font-semibold text-[10px] block">Prescription Duration</span>
          <span className="text-sm font-bold text-slate-900">{prescribedDuration} Days</span>
        </div>
        <div>
          <span className="text-slate-400 uppercase font-semibold text-[10px] block">Purchased Supply</span>
          <span className="text-sm font-bold text-slate-900">{purchasedSupply} Days (~{remainingDays} left)</span>
        </div>
        <div>
          <span className="text-slate-400 uppercase font-semibold text-[10px] block">Estimated Supply Gap</span>
          <span className={`text-sm font-bold ${supplyGap > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {supplyGap > 0 ? `${supplyGap} Days Gap (Refill Needed)` : "No Gap (Full Supply)"}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-5">
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isLow ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.max(12, supplyPercent)}%` }}
          />
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="space-y-3 pt-2">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Connected Treatment Milestones:
        </p>
        <div className="space-y-2.5 border-l-2 border-teal-200 pl-4 ml-2">
          {timeline.map((t, idx) => (
            <div key={idx} className="relative text-xs">
              <span
                className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                  t.status === "Completed"
                    ? "bg-emerald-500"
                    : t.status === "Active"
                    ? "bg-teal-500 animate-pulse"
                    : "bg-slate-300"
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{t.day} — {t.event}</span>
                <span className="text-[10px] text-slate-400">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default MedicationTimeline;
