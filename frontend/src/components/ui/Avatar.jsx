import React from "react";

export function Avatar({
  name = "User",
  src = "",
  size = "md",
  className = "",
}) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-xs font-semibold",
    lg: "w-12 h-12 text-sm font-bold",
    xl: "w-16 h-16 text-lg font-bold",
  };

  const getInitials = (str) => {
    if (!str) return "U";
    const parts = str.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 border border-slate-200 ${sizes[size] || sizes.md} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-brand-700 text-white font-semibold flex items-center justify-center shrink-0 border border-brand-800 ${
        sizes[size] || sizes.md
      } ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
