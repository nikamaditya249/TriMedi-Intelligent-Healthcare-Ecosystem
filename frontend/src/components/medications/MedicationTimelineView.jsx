import React, { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiFileText,
  FiRefreshCw,
  FiPackage,
  FiAlertTriangle,
} from "react-icons/fi";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { getMedicationTimeline } from "../../api";

export function MedicationTimelineView({ patientEmail }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    try {
      const res = await getMedicationTimeline({ patientEmail });
      if (res && res.success) {
        setEvents(res.timeline || []);
      }
    } catch (err) {
      console.warn("Timeline fetch notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [patientEmail]);

  const getEventIcon = (type) => {
    switch (type) {
      case "MEDICATION_STARTED":
      case "PRESCRIPTION_ISSUED":
        return <FiFileText className="w-4 h-4 text-teal-700" />;
      case "DOSE_TAKEN":
        return <FiCheckCircle className="w-4 h-4 text-emerald-700" />;
      case "DOSE_MISSED":
        return <FiXCircle className="w-4 h-4 text-rose-700" />;
      case "REFILL_DUE":
      case "REFILL_ORDERED":
        return <FiRefreshCw className="w-4 h-4 text-amber-700" />;
      default:
        return <FiPackage className="w-4 h-4 text-slate-700" />;
    }
  };

  const getEventBadge = (category) => {
    switch (category) {
      case "adherence":
        return <Badge variant="success" size="sm">Adherence</Badge>;
      case "prescription":
        return <Badge variant="brand" size="sm">Prescription</Badge>;
      case "refill":
        return <Badge variant="warning" size="sm">Refill</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Medication</Badge>;
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Medication Timeline</h3>
          <p className="text-xs text-slate-500">
            Chronological audit of prescription issuances, recorded doses, and refill events.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchTimeline} icon={FiRefreshCw}>
          Sync
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading medication events...</div>
      ) : events.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No medication events recorded yet. Doses and refills will appear here chronologically.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 space-y-5 my-2">
          {events.map((event, idx) => (
            <div key={idx} className="relative pl-6">
              <span className="absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              </span>
              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.type)}
                    <h4 className="text-xs font-bold text-slate-800">{event.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEventBadge(event.category)}
                    <span className="text-[11px] text-slate-400">
                      {event.date ? new Date(event.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : ""}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default MedicationTimelineView;
