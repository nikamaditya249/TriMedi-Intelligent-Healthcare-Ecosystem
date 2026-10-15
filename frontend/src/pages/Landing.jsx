import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiUserCheck,
  FiFileText,
  FiPackage,
  FiClock,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiUsers,
  FiRefreshCw,
  FiHeart,
  FiLock,
  FiCalendar,
} from "react-icons/fi";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export function Landing() {
  const navigate = useNavigate();
  const { switchDemoRole, isAuthenticated, activeRole } = useAuth();

  const handleRoleLaunch = (role) => {
    switchDemoRole(role);
    navigate(`/app/${role}/dashboard`);
  };

  const workflowSteps = [
    {
      step: "01",
      title: "Patient Consultation",
      desc: "Connect directly with certified specialists through secure real-time messaging and appointment scheduling.",
      icon: FiCalendar,
    },
    {
      step: "02",
      title: "Digital Prescription",
      desc: "Doctors issue structured, tamper-proof electronic prescriptions with exact dosing schedules and durations.",
      icon: FiFileText,
    },
    {
      step: "03",
      title: "Authentic Dispensing",
      desc: "Licensed pharmacies fulfill authentic medications with batch tracking, verified stock, and transparent fulfillment.",
      icon: FiPackage,
    },
    {
      step: "04",
      title: "Refill Gap Intelligence",
      desc: "Deterministic arithmetic tracks supply days elapsed vs. days remaining, alerting patients before therapy gaps occur.",
      icon: FiRefreshCw,
    },
  ];

  const roleWorkspaces = [
    {
      role: "patient",
      title: "Patient Workspace",
      desc: "Track medication supply progress, receive refill recommendations, access digital prescriptions, and chat with your doctor.",
      icon: FiHeart,
      action: "Launch Patient View",
      badges: ["Supply Timeline", "Refill Alerts", "E-Prescriptions"],
    },
    {
      role: "doctor",
      title: "Doctor Clinical Portal",
      desc: "MD-verified workspace for reviewing patient medical records, managing appointment queues, and generating digital prescriptions.",
      icon: FiUserCheck,
      action: "Launch Doctor View",
      badges: ["Clinical Queue", "Prescription Issuer", "Direct Chat"],
    },
    {
      role: "pharmacy",
      title: "Pharmacy Dispensing Network",
      desc: "Real-time order fulfillment workflow with automated status transitions (Processing → Dispensed → Delivered) and inventory alerts.",
      icon: FiPackage,
      action: "Launch Pharmacy View",
      badges: ["Live Queue", "Stock Tracking", "Order Verification"],
    },
    {
      role: "admin",
      title: "Governance & Telemetry",
      desc: "System-wide administrative center monitoring background scheduler heartbeats, WebSocket gateways, and platform user directories.",
      icon: FiShield,
      action: "Launch Admin View",
      badges: ["System Telemetry", "Audit Logs", "Directory"],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Positioning & Clear Explanation */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                <span>Connected Healthcare Platform</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Connected Healthcare, <br />
                <span className="text-brand-700">Simplified.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                TriMedi connects patients, certified doctors, and licensed pharmacies through one intelligent healthcare ecosystem — unifying appointments, digital prescriptions, medicine dispensing, and proactive refill gap tracking.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    if (isAuthenticated && activeRole) {
                      navigate(`/app/${activeRole}/dashboard`);
                    } else {
                      navigate("/auth?mode=login");
                    }
                  }}
                  icon={FiArrowRight}
                  iconPosition="right"
                >
                  {isAuthenticated ? "Go to Workspace" : "Access Workspace"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/products")}
                >
                  Browse Medicine Catalog
                </Button>
              </div>

              {/* Quick Role Shortcuts */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Instant Demo Login:</span>
                {["patient", "doctor", "pharmacy", "admin"].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleLaunch(r)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium capitalize transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Clean Platform Visual */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-card">
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-slate-800">
                      Live Care Journey
                    </span>
                  </div>
                  <Badge variant="brand" size="sm">
                    Verified Sync
                  </Badge>
                </div>

                {/* Simulated Care Loop Visual */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Active Prescription
                        </p>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          Atorvastatin 20mg • 30 Days
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Issued by Dr. Sarah Jenkins, MD
                        </p>
                      </div>
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </div>

                    {/* Supply Progress Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Medication Supply</span>
                        <span className="font-bold text-amber-700">12 Days Left</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-600 h-2 rounded-full"
                          style={{ width: "40%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                    <FiClock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-900">
                        Smart Refill Notification Triggered
                      </p>
                      <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                        Purchased quantity (15 days) creates a 15-day care gap against your 30-day course. Order Again ready in 1 click.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FiPackage className="w-4 h-4 text-brand-700" />
                      <span className="font-semibold text-slate-700">Fulfillment Status</span>
                    </div>
                    <span className="font-bold text-slate-800">Dispensed by MedPlus Prime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CONTINUOUS CARE JOURNEY (HOW IT WORKS) */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Continuous Treatment Journey
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              One Unified Healthcare Workflow
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              TriMedi eliminates fragmented healthcare by connecting consultations, e-prescriptions, pharmacy fulfillment, and therapy tracking into one continuous journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {item.step}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MULTI-ROLE WORKSPACES */}
      <section className="py-14 sm:py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Role-Based Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tailored Portals, One Consistent System
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Every participant in the care cycle operates within an authenticated, role-specific environment designed for speed, safety, and clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roleWorkspaces.map((w) => {
              const Icon = w.icon;
              return (
                <div
                  key={w.role}
                  className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-subtle hover:border-slate-300 hover:shadow-card transition-all duration-150 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          {w.title}
                        </h4>
                        <span className="text-[11px] font-semibold text-brand-700 capitalize">
                          {w.role} Portal
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                      {w.desc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {w.badges.map((b) => (
                        <span
                          key={b}
                          className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200/60"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => handleRoleLaunch(w.role)}
                    icon={FiArrowRight}
                    iconPosition="right"
                  >
                    {w.action}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. HEALTHCARE SAFETY & CLINICAL GOVERNANCE */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-subtle">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-4">
                <FiShield className="w-3.5 h-3.5 text-brand-700" />
                <span>Clinical Governance & Safety Standards</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
                Built Around Patient Safety & Clinical Authority
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                TriMedi incorporates automated intelligence strictly as an assistive tool. Certified doctors retain ultimate clinical decision-making authority over all prescriptions and dosing regimens.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Human Verification</h5>
                  <p className="text-slate-500 leading-relaxed">
                    Prescriptions extracted with AI require explicit physician or pharmacist verification before submission.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Authoritative Pricing</h5>
                  <p className="text-slate-500 leading-relaxed">
                    Order totals, GST calculations, and refill drafts are computed strictly server-side to prevent price tampering.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Non-Alarmist Alerts</h5>
                  <p className="text-slate-500 leading-relaxed">
                    Refill alerts trigger at $\le 5$ days of remaining supply, keeping patients proactively informed without anxiety.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Landing;
