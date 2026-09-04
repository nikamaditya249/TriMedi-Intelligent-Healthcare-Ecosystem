import React from "react";

export function Card({
  children,
  className = "",
  hover = false,
  glass = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle transition-all duration-200 ${
        hover ? "hover:shadow-md hover:border-slate-300 cursor-pointer" : ""
      } ${glass ? "glass-panel" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = "brand",
  className = "",
}) {
  const colorMap = {
    brand: "bg-brand-50 text-brand-600 border-brand-100",
    patient: "bg-sky-50 text-sky-600 border-sky-100",
    doctor: "bg-teal-50 text-teal-600 border-teal-100",
    pharmacy: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
              colorMap[color] || colorMap.brand
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center text-xs text-slate-500 gap-1.5">
          {trend && (
            <span
              className={`font-semibold ${
                trend > 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          {trendLabel && <span>{trendLabel}</span>}
          {subtitle && !trendLabel && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

export default Card;
