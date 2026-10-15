import React from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from "react-icons/fi";

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className = "",
  icon: CustomIcon,
}) {
  const configs = {
    info: {
      bg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-900",
      iconColor: "text-sky-600",
      defaultIcon: FiInfo,
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-900",
      iconColor: "text-emerald-600",
      defaultIcon: FiCheckCircle,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      iconColor: "text-amber-600",
      defaultIcon: FiAlertTriangle,
    },
    error: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-900",
      iconColor: "text-rose-600",
      defaultIcon: FiAlertCircle,
    },
  };

  const config = configs[variant] || configs.info;
  const Icon = CustomIcon || config.defaultIcon;

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 flex items-start gap-3 ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0 text-xs sm:text-sm">
        {title && <h5 className="font-bold mb-0.5 tracking-tight">{title}</h5>}
        <div className="text-slate-700 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors -mr-1"
          aria-label="Dismiss alert"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Alert;
