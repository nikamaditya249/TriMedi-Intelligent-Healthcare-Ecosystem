import React from "react";
import Button from "./Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center mb-3.5 border border-slate-200/80">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1 tracking-tight">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
