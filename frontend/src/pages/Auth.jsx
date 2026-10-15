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
  FiHeart,
  FiUserCheck,
  FiShoppingBag,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, switchDemoRole } = useAuth();

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
          setSuccessMessage("Login successful. Accessing your workspace...");
          const targetRole = res.user?.role || "patient";
          setTimeout(() => navigate(`/app/${targetRole}/dashboard`), 400);
        } else {
          setErrorMessage(res.message || res.error || "Invalid credentials provided.");
        }
      } else {
        const payload = {
          ...formData,
          role,
        };

        const res = await register(payload);
        if (res.success) {
          setSuccessMessage("Account created successfully. Redirecting to workspace...");
          setTimeout(() => navigate(`/app/${role}/dashboard`), 400);
        } else {
          setErrorMessage(res.message || res.error || "Registration could not be completed.");
        }
      }
    } catch (err) {
      setErrorMessage(err.message || "Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole) => {
    switchDemoRole(demoRole);
    navigate(`/app/${demoRole}/dashboard`);
  };

  const rolesList = [
    { id: "patient", label: "Patient", icon: FiHeart },
    { id: "doctor", label: "Doctor", icon: FiUserCheck },
    { id: "reception", label: "Reception", icon: FiClock },
    { id: "pharmacy", label: "Pharmacy", icon: FiShoppingBag },
    { id: "admin", label: "Admin", icon: FiShield },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-2xl text-slate-900">
          <div className="w-10 h-10 rounded-xl bg-brand-700 text-white flex items-center justify-center shadow-subtle border border-brand-800">
            <FiActivity className="w-5 h-5" />
          </div>
          <span className="tracking-tight">
            Tri<span className="text-brand-700">Medi</span>
          </span>
        </Link>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          {isLogin
            ? "Sign in to access your authenticated healthcare workspace"
            : "Register for the synchronized healthcare care network"}
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-slate-200/90">
          {/* Tab Switcher: Login / Register */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isLogin
                  ? "bg-white text-slate-900 shadow-subtle border border-slate-200/60"
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
                  ? "bg-white text-slate-900 shadow-subtle border border-slate-200/60"
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
                Select Your Role
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
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? "border-brand-700 bg-brand-50 text-brand-900 shadow-subtle font-semibold"
                          : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-brand-700" : "text-slate-400"}`} />
                      <span className="text-xs">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mb-5">
              <Alert variant="error" onClose={() => setErrorMessage("")}>
                {errorMessage}
              </Alert>
            </div>
          )}

          {successMessage && (
            <div className="mb-5">
              <Alert variant="success">
                {successMessage}
              </Alert>
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
                      label="Pharmacy Name"
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
              className="w-full mt-3"
            >
              {isLogin ? "Sign In to TriMedi" : `Register as ${role.toUpperCase()}`}
            </Button>
          </form>

          {/* Instant 1-Click Demo Logins */}
          <div className="mt-8 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 text-center mb-3">
              Instant 1-Click Demo Logins (Evaluation)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("patient")}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold transition-colors"
              >
                Patient Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("doctor")}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold transition-colors"
              >
                Doctor Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("reception")}
                className="px-2 py-1.5 rounded-lg border border-brand-200 bg-brand-50/70 hover:bg-brand-100/70 text-brand-900 text-[11px] font-bold transition-colors"
              >
                Reception Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("pharmacy")}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold transition-colors"
              >
                Pharmacy Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold transition-colors"
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