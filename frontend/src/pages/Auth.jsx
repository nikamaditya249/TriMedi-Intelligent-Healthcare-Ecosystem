import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/**
 * Backward compatibility route for legacy /auth navigation.
 * Instantly routes to canonical /login or /signup with replacement.
 */
export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register") {
      navigate("/signup", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex items-center gap-3 text-slate-500 text-sm">
        <svg
          className="animate-spin h-5 w-5 text-brand-700"
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
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Redirecting to TriMedi secure authentication...</span>
      </div>
    </div>
  );
}

export default Auth;