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
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-[#D9E2EC] bg-[#FFFFFF] ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-[#E8F7F4] text-[#087F73] flex items-center justify-center mb-3.5 border border-[#9AD9D1]">
          <Icon className="w-6 h-6 text-[#087F73]" />
        </div>
      )}
      <h4 className="text-sm sm:text-base font-bold text-[#172033] mb-1 tracking-tight">{title}</h4>
      <p className="text-xs sm:text-sm text-[#52627A] max-w-sm mb-4 leading-relaxed">
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
