import React from "react";

export function Tabs({ tabs = [], activeTab, onChange, className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 ${className}`}>
      {tabs.map((tab) => {
        const id = typeof tab === "string" ? tab : tab.id;
        const label = typeof tab === "string" ? tab : tab.label;
        const count = typeof tab === "object" ? tab.count : undefined;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              isActive
                ? "bg-white text-slate-900 shadow-subtle border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-brand-50 text-brand-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
