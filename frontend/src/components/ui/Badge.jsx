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
    default: "bg-[#F1F5F9] text-[#52627A] border border-[#D9E2EC]",
    brand: "bg-[#E8F7F4] text-[#087F73] border border-[#9AD9D1]",
    success: "bg-[#E8F7F4] text-[#087F73] border border-[#9AD9D1]",
    warning: "bg-[#FFF7E6] text-[#B7791F] border border-[#FDE68A]",
    danger: "bg-[#FFF0F0] text-[#C53030] border border-[#FECACA]",
    info: "bg-[#EDF5FF] text-[#2563A6] border border-[#BAE6FD]",
  };

  const dotColors = {
    default: "bg-[#718096]",
    brand: "bg-[#087F73]",
    success: "bg-[#087F73]",
    warning: "bg-[#B7791F]",
    danger: "bg-[#C53030]",
    info: "bg-[#2563A6]",
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
