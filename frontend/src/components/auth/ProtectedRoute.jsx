import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Route protection guard for authenticated application workspaces.
 * Unauthenticated users are redirected to /login with original location preserved in state.
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, activeRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = activeRole || user.role;
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to={`/app/${userRole || "patient"}/dashboard`} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
