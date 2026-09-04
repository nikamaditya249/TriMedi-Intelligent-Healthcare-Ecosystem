import React from "react";

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  dot = false,
}) {
  const sizes = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    brand: "bg-brand-50 text-brand-700 border border-brand-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    // Role variants
    patient: "bg-sky-50 text-sky-700 border border-sky-200",
    doctor: "bg-teal-50 text-teal-700 border border-teal-200",
    pharmacy: "bg-purple-50 text-purple-700 border border-purple-200",
    admin: "bg-slate-100 text-slate-800 border border-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === "success"
              ? "bg-emerald-500"
              : variant === "danger"
              ? "bg-rose-500"
              : variant === "warning"
              ? "bg-amber-500"
              : "bg-brand-500"
          }`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
