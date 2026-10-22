import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiPhone,
  FiShield,
  FiCheckCircle,
  FiFileText,
  FiShoppingBag,
  FiHeart,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";

export function Signup() {
  const navigate = useNavigate();
  const { register, isAuthenticated, activeRole, user } = useAuth();

  const [role, setRole] = useState("patient");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    bloodGroup: "",
    // Doctor fields
    licenseNumber: "",
    specialty: "",
    hospital: "",
    // Pharmacy fields
    pharmacyName: "",
    licenseId: "",
    address: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading && !successMessage) {
      const targetRole = user.role || activeRole || "patient";
      const destination = targetRole === "patient" ? "/products" : `/app/${targetRole}/dashboard`;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, activeRole, navigate, loading, successMessage]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // 1. Basic Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage("Please complete all required fields (Name, Email, and Password).");
      return;
    }

    // 2. Password Strength Validation (Backend enforces minimum 8 characters)
    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long for account security.");
      return;
    }

    // 3. Confirm Password Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password accurately.");
      return;
    }

    // 4. Role-specific validation
    if (role === "doctor" && !formData.licenseNumber.trim()) {
      setErrorMessage("Medical License Number is required for healthcare practitioner registration.");
      return;
    }

    if (role === "pharmacy" && (!formData.pharmacyName.trim() || !formData.licenseId.trim())) {
      setErrorMessage("Pharmacy Name and Drug License ID are required for pharmacy registration.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role,
        phone: formData.phone.trim(),
        bloodGroup: role === "patient" ? formData.bloodGroup : "",
        specialty: role === "doctor" ? formData.specialty.trim() : "",
        hospital: role === "doctor" ? formData.hospital.trim() : "",
        licenseNumber: role === "doctor" ? formData.licenseNumber.trim() : "",
        pharmacyName: role === "pharmacy" ? formData.pharmacyName.trim() : "",
        licenseId: role === "pharmacy" ? formData.licenseId.trim() : "",
        address: role === "pharmacy" ? formData.address.trim() : "",
      };

      const res = await register(payload);

      if (res.success && res.user) {
        const targetRole = res.user.role || role;
        const destination = targetRole === "patient" ? "/products" : `/app/${targetRole}/dashboard`;
        setSuccessMessage(
          targetRole === "patient"
            ? "Your TriMedi account has been created! Welcome to our medicine catalog..."
            : "Your TriMedi account has been created! Launching your workspace..."
        );
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 400);
      } else {
        setErrorMessage(res.message || res.error || "Unable to complete registration. Please try again.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMessage("Unable to connect to TriMedi. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      id: "patient",
      title: "Patient",
      desc: "Consultations & Refills",
      icon: FiHeart,
    },
    {
      id: "doctor",
      title: "Doctor",
      desc: "Clinical Prescribing",
      icon: FiFileText,
    },
    {
      id: "pharmacy",
      title: "Pharmacy",
      desc: "Dispensing Partner",
      icon: FiShoppingBag,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-between selection:bg-brand-100 selection:text-brand-900">
      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Left Column: Context & Guarantees */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold uppercase tracking-wider">
              <FiShield className="w-3.5 h-3.5 text-brand-700" />
              <span>Unified Healthcare Network</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Join the <br className="hidden sm:block" />
                <span className="text-brand-700">TriMedi Ecosystem</span>
              </h1>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Connect directly with certified physicians, obtain verifiable digital prescriptions, order authentic medicines, and automate your chronic treatment schedules.
              </p>
            </div>

            {/* Key Platform Safeguards */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-subtle flex items-start gap-3">
                <FiCheckCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Patient-First Privacy Safeguards
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Personal clinical information is encrypted at rest and in transit. Medical records are shared only with explicit patient consent.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-subtle flex items-start gap-3">
                <FiCheckCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Verified Medical Licenses
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Doctor registrations undergo state medical council identity verification before clinical prescribing permissions are unlocked.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-subtle flex items-start gap-3">
                <FiCheckCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Authentic Pharmacy Fulfillment
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Dispensing partners are strictly licensed retail pharmacies with verified cold-chain and pharmaceutical custody standards.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Card */}
          <div className="lg:col-span-7 w-full max-w-xl mx-auto lg:max-w-none">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-10">
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Create Your Account
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Select your role to configure your customized healthcare workspace.
                </p>
              </div>

              {/* Status Alerts */}
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

              {/* Role Selector Pills */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Account Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = role === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setRole(opt.id);
                          setErrorMessage("");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-brand-700 bg-brand-50/50 ring-1 ring-brand-700 text-brand-900 shadow-subtle"
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-brand-700" : "text-slate-400"}`} />
                          {isSelected && <FiCheckCircle className="w-3.5 h-3.5 text-brand-700" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{opt.title}</p>
                          <p className="text-[10px] text-slate-400 leading-tight hidden sm:block mt-0.5">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doctor Pending Notice */}
              {role === "doctor" && (
                <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <FiInfo className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Doctor registrations are marked as <strong>Pending Verification</strong> until medical license and credentials are certified by clinical administration.
                  </p>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={role === "doctor" ? "Dr. Firstname Lastname" : "Firstname Lastname"}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiMail className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password (Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FiLock className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 8 characters"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="signup-confirm-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FiLock className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phone & Blood Group (Patient) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="signup-phone"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FiPhone className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                      />
                    </div>
                  </div>

                  {role === "patient" && (
                    <div>
                      <label
                        htmlFor="signup-blood-group"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                      >
                        Blood Group (Optional)
                      </label>
                      <select
                        id="signup-blood-group"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* DOCTOR FIELDS */}
                {role === "doctor" && (
                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                      Medical Credentials
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="signup-license"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                          License Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="signup-license"
                          name="licenseNumber"
                          type="text"
                          required
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          placeholder="e.g. MED-88492-IN"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="signup-specialty"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                          Primary Specialty
                        </label>
                        <input
                          id="signup-specialty"
                          name="specialty"
                          type="text"
                          value={formData.specialty}
                          onChange={handleChange}
                          placeholder="e.g. Cardiology, Pediatrics"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="signup-hospital"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                      >
                        Affiliated Hospital / Clinic
                      </label>
                      <input
                        id="signup-hospital"
                        name="hospital"
                        type="text"
                        value={formData.hospital}
                        onChange={handleChange}
                        placeholder="e.g. Metro Health Center"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                      />
                    </div>
                  </div>
                )}

                {/* PHARMACY FIELDS */}
                {role === "pharmacy" && (
                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                      Pharmacy Credentials
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="signup-pharmacy-name"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                          Pharmacy Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="signup-pharmacy-name"
                          name="pharmacyName"
                          type="text"
                          required
                          value={formData.pharmacyName}
                          onChange={handleChange}
                          placeholder="e.g. MedPlus Prime Pharmacy"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="signup-license-id"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                          Drug License ID <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="signup-license-id"
                          name="licenseId"
                          type="text"
                          required
                          value={formData.licenseId}
                          onChange={handleChange}
                          placeholder="e.g. PHARM-2026-9901"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="signup-address"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                      >
                        Dispensing Facility Address
                      </label>
                      <input
                        id="signup-address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Sector / Street, City, Pincode"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                      />
                    </div>
                  </div>
                )}

                {/* Submit CTA */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    disabled={loading}
                    className="w-full justify-center shadow-subtle text-sm font-bold"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </form>

              {/* Login <-> Signup Switching */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-brand-700 hover:text-brand-800 transition-colors hover:underline focus:outline-none"
                  >
                    Login
                  </Link>
                </p>
              </div>

              {/* Terms and Privacy Footer Note */}
              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  By registering, you agree to TriMedi's{" "}
                  <span className="text-slate-600 underline">Terms of Service</span>,{" "}
                  <span className="text-slate-600 underline">Privacy Policy</span>, and{" "}
                  <span className="text-slate-600 underline">Clinical Governance Rules</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 TriMedi Healthcare Ecosystem. Clinical Governance & Server-Authoritative Care.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <Link to="/" className="hover:text-slate-800">Home</Link>
            <Link to="/products" className="hover:text-slate-800">Medicines</Link>
            <Link to="/#help" className="hover:text-slate-800">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Signup;
