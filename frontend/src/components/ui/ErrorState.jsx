import React from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import Button from "./Button";

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this information. Please try again or check back later.",
  onRetry,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-slate-200 bg-white shadow-subtle ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-4">
        <FiAlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={FiRefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
