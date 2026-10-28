import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser as apiLogin, registerUser as apiRegister } from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  // Authoritative role comes strictly from authenticated user object
  const activeRole = user?.role || "patient";

  // Listen for global 401 unauthorized events from api.js
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("trimedi:unauthorized", handleUnauthorized);
      return () => window.removeEventListener("trimedi:unauthorized", handleUnauthorized);
    }
  }, []);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    if (res.token && res.user) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, message: res.message || res.error || "Login failed" };
  };

  const register = async (userData) => {
    const res = await apiRegister(userData);
    if (res.token && res.user) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, message: res.message || res.error || "Registration failed" };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        role: activeRole,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
