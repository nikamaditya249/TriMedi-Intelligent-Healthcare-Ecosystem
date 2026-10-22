import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiShield,
  FiCalendar,
  FiFileText,
  FiShoppingBag,
  FiClock,
  FiRefreshCw,
  FiArrowRight,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { forgotPassword as apiForgotPassword } from "../api";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, activeRole, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot Password modal/state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState(null);

  // Where did the user come from?
  const redirectTarget = location.state?.from?.pathname || null;

  // If already authenticated and not actively logging in, redirect to workspace
  useEffect(() => {
    if (isAuthenticated && user && !loading && !successMessage) {
      const destination =
        redirectTarget && redirectTarget.startsWith("/app")
          ? redirectTarget
          : `/app/${user.role || activeRole || "patient"}/dashboard`;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, activeRole, redirectTarget, navigate, loading, successMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await login({
        email: email.trim(),
        password,
      });

      if (res.success && res.user) {
        setSuccessMessage("Authentication successful. Opening your healthcare workspace...");

        const destination =
          redirectTarget && redirectTarget.startsWith("/app")
            ? redirectTarget
            : `/app/${res.user.role || "patient"}/dashboard`;

        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 400);
      } else {
        const errorMsg =
          res.message || res.error || "Invalid email or password. Please verify and try again.";
        setErrorMessage(errorMsg);
      }
    } catch (err) {
      console.error("Login unexpected error:", err);
      setErrorMessage("Unable to connect to TriMedi. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotFeedback({
        type: "error",
        message: "Please enter your registered email address.",
      });
      return;
    }

    setForgotLoading(true);
    setForgotFeedback(null);

    try {
      const res = await apiForgotPassword({ email: forgotEmail.trim() });
      if (res.success) {
        setForgotFeedback({
          type: "success",
          message:
            res.message ||
            "Password reset instructions have been dispatched to your email address.",
        });
      } else {
        setForgotFeedback({
          type: "error",
          message: res.message || res.error || "Unable to process password reset at this time.",
        });
      }
    } catch (err) {
      setForgotFeedback({
        type: "error",
        message: "Network error occurred while submitting password reset request.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const careJourneySteps = [
    {
      num: "01",
      title: "Doctor Consultation",
      desc: "Licensed video & in-clinic clinical encounters",
      icon: FiCalendar,
    },
    {
      num: "02",
      title: "Digital Prescription",
      desc: "Tamper-evident electronic prescribing",
      icon: FiFileText,
    },
    {
      num: "03",
      title: "Verified Pharmacy",
      desc: "Authentic licensed dispensing network",
      icon: FiShoppingBag,
    },
    {
      num: "04",
      title: "Medication Tracking",
      desc: "Real-time dosage schedules & safety adherence",
      icon: FiClock,
    },
    {
      num: "05",
      title: "Intelligent Refill",
      desc: "Proactive, automated prescription continuity",
      icon: FiRefreshCw,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-between selection:bg-brand-100 selection:text-brand-900">
      {/* Main Content Area: Responsive Split Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: TriMedi Branding & Care Journey */}
          <div className="lg:col-span-6 space-y-6 lg:pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold uppercase tracking-wider">
              <FiShield className="w-3.5 h-3.5 text-brand-700" />
              <span>Enterprise Healthcare Ecosystem</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Connected Healthcare, <br className="hidden sm:block" />
                <span className="text-brand-700">Simplified.</span>
              </h1>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-xl">
                TriMedi connects doctor consultations, tamper-evident digital prescriptions, authentic pharmacy fulfillment, and automated refill tracking into one unified experience.
              </p>
            </div>

            {/* Structured Care Journey Walkthrough */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                End-to-End Care Architecture
              </p>

              <div className="space-y-2">
                {careJourneySteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.num}
                      className="flex items-center gap-3.5 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-subtle hover:border-brand-200 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 font-bold text-xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-brand-700">{step.num}</span>
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compliance & Trust Markers */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-200/80">
              <span className="flex items-center gap-1.5 font-medium">
                <FiCheckCircle className="w-4 h-4 text-brand-600" />
                Doctor & Pharmacy Certified
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FiCheckCircle className="w-4 h-4 text-brand-600" />
                256-bit Encrypted Sessions
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FiCheckCircle className="w-4 h-4 text-brand-600" />
                Server-Authoritative Pricing
              </span>
            </div>
          </div>

          {/* Right Column: Clean TriMedi Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-10 transition-all">
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome Back
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Sign in to continue to your TriMedi healthcare account.
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

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Email Address */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiMail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="name@trimedi.health"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotFeedback(null);
                        setForgotEmail(email || "");
                        setForgotModalOpen(true);
                      }}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors focus:outline-none focus:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FiLock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="Enter your account password"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit CTA */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    disabled={loading}
                    className="w-full justify-center shadow-subtle text-sm font-bold"
                  >
                    {loading ? "Signing in..." : "Login"}
                  </Button>
                </div>
              </form>

              {/* Login <-> Signup Switching */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-600">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-bold text-brand-700 hover:text-brand-800 transition-colors hover:underline focus:outline-none"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>

              {/* Terms and Privacy Footer Note */}
              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  By logging in, you agree to TriMedi's{" "}
                  <span className="text-slate-600 underline">Terms of Service</span> and{" "}
                  <span className="text-slate-600 underline">Privacy Policy</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal (Fully connected to backend POST /api/auth/forgot-password) */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-dropdown border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Reset Your Password
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Enter your registered TriMedi email address. We will dispatch secure, single-use password reset instructions.
            </p>

            {forgotFeedback && (
              <div className="mb-4">
                <Alert
                  variant={forgotFeedback.type === "success" ? "success" : "error"}
                  onClose={() => setForgotFeedback(null)}
                >
                  {forgotFeedback.message}
                </Alert>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@trimedi.health"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={forgotLoading}
                  disabled={forgotLoading}
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default Login;
