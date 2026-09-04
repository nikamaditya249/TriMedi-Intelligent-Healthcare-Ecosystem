import React from "react";

export function Avatar({
  name = "User",
  src = "",
  size = "md",
  role = "",
  className = "",
}) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg font-bold",
    xl: "w-20 h-20 text-2xl font-bold",
  };

  const roleBorders = {
    patient: "ring-2 ring-sky-400 ring-offset-2",
    doctor: "ring-2 ring-teal-500 ring-offset-2",
    pharmacy: "ring-2 ring-purple-500 ring-offset-2",
    admin: "ring-2 ring-slate-600 ring-offset-2",
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
        className={`rounded-full object-cover shrink-0 ${sizes[size]} ${
          role ? roleBorders[role] || "" : ""
        } ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 text-white font-semibold flex items-center justify-center shrink-0 shadow-sm ${
        sizes[size]
      } ${role ? roleBorders[role] || "" : ""} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
