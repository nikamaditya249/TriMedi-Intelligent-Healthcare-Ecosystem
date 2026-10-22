import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser as apiLogin, registerUser as apiRegister } from "../api";

const AuthContext = createContext();

const DEMO_USERS = {
  patient: {
    _id: "demo_patient_1",
    name: "Aditya Nikam",
    email: "aditya@trimedi.health",
    role: "patient",
    phone: "+91 98765 43210",
    bloodGroup: "O+",
    allergies: ["Penicillin"],
  },
  doctor: {
    _id: "demo_doctor_1",
    name: "Dr. Sarah Jenkins, MD",
    email: "doctor@trimedi.health",
    role: "doctor",
    specialty: "Internal Medicine & Cardiology",
    hospital: "Metro Health Center",
    licenseNumber: "MED-88492-IN",
    qualifications: "MBBS, MD (Internal Medicine), FACC",
    experienceYears: 14,
    verificationStatus: "verified",
    phone: "+91 98221 11223",
  },
  pharmacy: {
    _id: "demo_pharmacy_1",
    name: "MedPlus Prime Pharmacy",
    email: "pharmacy@trimedi.health",
    role: "pharmacy",
    pharmacyName: "MedPlus Prime Pharmacy",
    licenseId: "PHARM-2026-9901",
    address: "74 Health Ave, Sector 4",
    phone: "+91 98111 22334",
  },
  admin: {
    _id: "demo_admin_1",
    name: "System Administrator",
    email: "admin@trimedi.health",
    role: "admin",
    phone: "+91 99000 11222",
  },
  reception: {
    _id: "demo_reception_1",
    name: "Meena Ramanathan",
    email: "reception@trimedi.health",
    role: "reception",
    clinicName: "Metro Health Center",
    shift: "General Day Shift",
    phone: "+91 98333 44556",
  },
};

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
  const [activeRole, setActiveRole] = useState(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        return JSON.parse(saved).role || "patient";
      } catch {
        return "patient";
      }
    }
    return "patient";
  });

  useEffect(() => {
    if (user?.role) {
      setActiveRole(user.role);
    }
  }, [user]);

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
      setActiveRole(res.user.role || "patient");
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
      setActiveRole(res.user.role || userData.role || "patient");
      return { success: true, user: res.user };
    }
    return { success: false, message: res.message || res.error || "Registration failed" };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setActiveRole("patient");
  };

  const switchDemoRole = async (role) => {
    const roleEmailMap = {
      patient: "aditya@trimedi.health",
      doctor: "doctor@trimedi.health",
      pharmacy: "pharmacy@trimedi.health",
      admin: "admin@trimedi.health",
      reception: "reception@trimedi.health",
    };

    const mockUser = DEMO_USERS[role] || DEMO_USERS.patient;
    localStorage.setItem("user", JSON.stringify(mockUser));
    setUser(mockUser);
    setActiveRole(role);

    const email = roleEmailMap[role] || "aditya@trimedi.health";
    try {
      const res = await apiLogin({ email, password: "password123" });
      if (res.token && res.user) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        setActiveRole(res.user.role || role);
      }
    } catch (err) {
      console.warn("Real login fallback:", err);
    }
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
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchDemoRole,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
