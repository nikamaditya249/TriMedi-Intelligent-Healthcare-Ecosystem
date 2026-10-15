import React from "react";

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  dot = false,
}) {
  const sizes = {
    sm: "px-2 py-0.5 text-[11px] font-medium",
    md: "px-2.5 py-0.5 text-xs font-semibold",
    lg: "px-3 py-1 text-sm font-semibold",
  };

  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    brand: "bg-brand-50 text-brand-800 border border-brand-200",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-rose-50 text-rose-800 border border-rose-200",
    info: "bg-sky-50 text-sky-800 border border-sky-200",
  };

  const dotColors = {
    default: "bg-slate-500",
    brand: "bg-brand-600",
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    danger: "bg-rose-600",
    info: "bg-sky-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizes[size] || sizes.md} ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
