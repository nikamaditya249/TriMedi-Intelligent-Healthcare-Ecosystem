import React from "react";

export function Card({
  children,
  className = "",
  hover = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-subtle transition-all duration-150 ${
        hover ? "hover:border-slate-300 hover:shadow-card cursor-pointer" : ""
      } ${className}`}
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
  className = "",
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-subtle hover:border-slate-300 hover:shadow-card transition-all duration-150 flex flex-col justify-between ${className}`}
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
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500 gap-1.5">
          {trend && (
            <span
              className={`font-semibold ${
                Number(trend) >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {Number(trend) > 0 ? `+${trend}%` : `${trend}%`}
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
