import React from "react";

export function LoadingState({ message = "Loading healthcare data...", rows = 3 }) {
  return (
    <div className="w-full p-6 space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-subtle animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-slate-100 rounded-lg"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3.5 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-100 rounded w-1/3"></div>
        </div>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-12 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
        ))}
      </div>
      <p className="text-xs text-center text-slate-400 font-medium pt-1">{message}</p>
    </div>
  );
}

export function Spinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        className={`animate-spin text-brand-700 ${sizes[size] || sizes.md}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
}

export default LoadingState;
