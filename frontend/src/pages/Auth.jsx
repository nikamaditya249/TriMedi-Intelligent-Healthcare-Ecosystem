import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  FiActivity,
  FiMail,
  FiLock,
  FiUser,
  FiPhone,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiHeart,
  FiUserCheck,
  FiShoppingBag,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input, { Select } from "../components/ui/Input";

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, switchDemoRole, isAuthenticated, activeRole } = useAuth();

  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "",
    hospital: "",
    licenseNumber: "",
    pharmacyName: "",
    licenseId: "",
  });

  useEffect(() => {
    if (searchParams.get("mode") === "register") {
      setIsLogin(false);
    } else if (searchParams.get("mode") === "login") {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login({
          email: formData.email,
          password: formData.password,
        });

        if (res.success) {
          setSuccessMessage("Login successful! Redirecting to care hub...");
          const targetRole = res.user?.role || "patient";
          setTimeout(() => navigate(`/app/${targetRole}/dashboard`), 400);
        } else {
          setErrorMessage(res.message || "Invalid credentials");
        }
      } else {
        const payload = {
          ...formData,
          role,
        };

        const res = await register(payload);
        if (res.success) {
          setSuccessMessage("Account created successfully! Redirecting...");
          setTimeout(() => navigate(`/app/${role}/dashboard`), 400);
        } else {
          setErrorMessage(res.message || "Registration failed");
        }
      }
    } catch (err) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole) => {
    switchDemoRole(demoRole);
    navigate(`/app/${demoRole}/dashboard`);
  };

  const rolesList = [
    { id: "patient", label: "Patient", icon: FiHeart, desc: "Connected care & refills" },
    { id: "doctor", label: "Doctor", icon: FiUserCheck, desc: "Clinical & e-prescriptions" },
    { id: "pharmacy", label: "Pharmacy", icon: FiShoppingBag, desc: "Fulfillment & dispensing" },
    { id: "admin", label: "Admin", icon: FiShield, desc: "Platform governance" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-2xl text-white">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center shadow-md">
            <FiActivity className="w-5 h-5" />
          </div>
          <span className="tracking-tight">
            Tri<span className="text-brand-400">Medi</span>
          </span>
        </Link>
        <p className="text-xs sm:text-sm text-slate-300 mt-2">
          {isLogin ? "Sign in to access your synchronized healthcare workspace" : "Join TriMedi connected healthcare network"}
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20">
          {/* Tab Switcher: Login / Register */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isLogin
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrorMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isLogin
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selection on Register */}
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Select Your Role in TriMedi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {rolesList.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? "border-brand-600 bg-brand-50/60 text-brand-900 shadow-xs ring-2 ring-brand-500/20"
                          : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />
                      <span className="text-xs font-bold">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alert Messages */}
          {errorMessage && (
            <div className="p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 mb-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Full Name / Representative"
                name="name"
                required
                icon={FiUser}
                placeholder={role === "doctor" ? "e.g., Dr. Sarah Jenkins, MD" : "e.g., Aditya Nikam"}
                value={formData.name}
                onChange={handleChange}
              />
            )}

            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              icon={FiMail}
              placeholder="name@trimedi.health"
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              required
              icon={FiLock}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />

            {!isLogin && (
              <>
                <Input
                  label="Contact Phone"
                  name="phone"
                  icon={FiPhone}
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />

                {/* Doctor-specific fields */}
                {role === "doctor" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <Input
                      label="Medical Specialty"
                      name="specialty"
                      placeholder="e.g., Cardiology"
                      value={formData.specialty}
                      onChange={handleChange}
                    />
                    <Input
                      label="Medical License #"
                      name="licenseNumber"
                      placeholder="e.g., MED-88492-IN"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                    />
                  </div>
                )}

                {/* Pharmacy-specific fields */}
                {role === "pharmacy" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <Input
                      label="Pharmacy Store Name"
                      name="pharmacyName"
                      placeholder="e.g., MedPlus Prime"
                      value={formData.pharmacyName}
                      onChange={handleChange}
                    />
                    <Input
                      label="Pharmacy License ID"
                      name="licenseId"
                      placeholder="e.g., PHARM-2026-9901"
                      value={formData.licenseId}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-3 shadow-md"
            >
              {isLogin ? "Sign In to TriMedi" : `Register as ${role.toUpperCase()}`}
            </Button>
          </form>

          {/* Demo Quick Access Helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 text-center mb-3">
              ⚡ Instant Demo Workspace Access (Phase 1 Testing)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("patient")}
                className="px-2 py-1.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100 text-sky-800 text-[11px] font-bold transition-all"
              >
                Patient Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("doctor")}
                className="px-2 py-1.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100 text-teal-800 text-[11px] font-bold transition-all"
              >
                Doctor Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("pharmacy")}
                className="px-2 py-1.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-800 text-[11px] font-bold transition-all"
              >
                Pharmacy Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                className="px-2 py-1.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all"
              >
                Admin Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;