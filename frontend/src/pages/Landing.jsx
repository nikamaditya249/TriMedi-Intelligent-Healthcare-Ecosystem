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
  FiZap,
} from "react-icons/fi";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export function Landing() {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();

  const workflowSteps = [
    { step: "01", title: "Patient", desc: "Signs up & connects medical history", icon: FiHeart, color: "text-sky-500 bg-sky-50" },
    { step: "02", title: "Doctor", desc: "Conducts consultation & clinical review", icon: FiUserCheck, color: "text-teal-600 bg-teal-50" },
    { step: "03", title: "Prescription", desc: "Issues digital prescription with dosage", icon: FiFileText, color: "text-brand-600 bg-brand-50" },
    { step: "04", title: "Medicine", desc: "Verified pharmacy dispenses exact items", icon: FiPackage, color: "text-purple-600 bg-purple-50" },
    { step: "05", title: "Treatment Tracking", desc: "Monitors daily schedule & supply days", icon: FiActivity, color: "text-emerald-600 bg-emerald-50" },
    { step: "06", title: "Smart Refill", desc: "Detects supply gaps & prompts reorder", icon: FiRefreshCw, color: "text-amber-600 bg-amber-50" },
    { step: "07", title: "Continued Care", desc: "Sustained doctor-patient treatment loop", icon: FiCheckCircle, color: "text-indigo-600 bg-indigo-50" },
  ];

  const features = [
    {
      icon: FiUserCheck,
      title: "Doctor & Patient Connection",
      desc: "Direct coordination between certified medical specialists and patients for continuous clinical care.",
      color: "border-teal-100 text-teal-600 bg-teal-50",
    },
    {
      icon: FiFileText,
      title: "Digital Prescriptions",
      desc: "Structured, tamper-resistant digital prescriptions linked seamlessly from doctor consultation to medicine checkout.",
      color: "border-sky-100 text-sky-600 bg-sky-50",
    },
    {
      icon: FiPackage,
      title: "Medicine Management",
      desc: "Verified pharmacy network dispensing authentic medicines with tracked quantities and batch accuracy.",
      color: "border-purple-100 text-purple-600 bg-purple-50",
    },
    {
      icon: FiActivity,
      title: "Treatment Tracking",
      desc: "Compare prescribed treatment duration against actual medicine quantity purchased to eliminate care gaps.",
      color: "border-emerald-100 text-emerald-600 bg-emerald-50",
    },
    {
      icon: FiClock,
      title: "Smart Refill Alerts",
      desc: "Timely reminders before your medicine runs low, allowing one-click 'Order Again' to maintain treatment continuity.",
      color: "border-amber-100 text-amber-600 bg-amber-50",
    },
    {
      icon: FiShield,
      title: "Healthcare Communication",
      desc: "Secure, authenticated channels maintaining privacy for patient treatment logs and doctor instructions.",
      color: "border-slate-100 text-slate-700 bg-slate-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-teal-950 via-slate-900 to-slate-900 text-white">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold backdrop-blur-md">
                <FiZap className="w-3.5 h-3.5 text-brand-400" />
                <span>Next-Generation Healthcare Ecosystem</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                One Connected <br />
                <span className="text-gradient-teal">Healthcare Journey</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                TriMedi unifies doctors, patients, digital prescriptions, authentic medicines, and intelligent treatment tracking into one seamless platform.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                {user ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold shadow-lg shadow-brand-500/20"
                    onClick={() => navigate(`/app/${activeRole}/dashboard`)}
                    icon={FiArrowRight}
                    iconPosition="right"
                  >
                    Go to Your Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold shadow-lg shadow-brand-500/20"
                      onClick={() => navigate("/auth?mode=register")}
                      icon={FiArrowRight}
                      iconPosition="right"
                    >
                      Get Started Free
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md"
                      onClick={() => navigate("/auth?mode=login")}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </div>

              {/* Quick stats pills */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-white">4 Roles</p>
                  <p className="text-xs text-slate-400">Patient • Doctor • Pharmacy • Admin</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-teal-400">100%</p>
                  <p className="text-xs text-slate-400">Synchronized Digital Care</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-brand-300">Phase 1</p>
                  <p className="text-xs text-slate-400">Product Foundation Ready</p>
                </div>
              </div>
            </div>

            {/* Right Visual Card Mockup */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-gradient-to-tr from-slate-800/90 to-slate-900/90 border border-slate-700/70 p-6 shadow-2xl backdrop-blur-xl">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">trimedi-care-hub.live</span>
                </div>

                {/* Floating Interactive Care Journey Card */}
                <div className="space-y-3.5">
                  {/* Doctor badge */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                        MD
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Dr. Sarah Jenkins</p>
                        <p className="text-[10px] text-teal-400">Prescribed: 30 Days Cycle</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-semibold">
                      Verified Rx
                    </span>
                  </div>

                  {/* Supply & Gap Visualizer */}
                  <div className="p-4 rounded-2xl bg-brand-950/40 border border-brand-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-200">Atorvastatin 20mg</span>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Low Supply Warning
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span>Prescribed: 30 Days</span>
                      <span>Purchased: 15 Days (~4 left)</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full w-[28%]"></div>
                    </div>
                    <button
                      onClick={() => navigate("/products")}
                      className="w-full mt-1 bg-brand-500 text-slate-950 text-xs font-bold py-2 rounded-xl hover:bg-brand-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FiRefreshCw className="w-3.5 h-3.5" />
                      <span>Order Again (Instant Refill)</span>
                    </button>
                  </div>

                  {/* Pharmacy Fulfillment */}
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiPackage className="w-4 h-4 text-purple-400" />
                      <span>MedPlus Pharmacy Dispense</span>
                    </div>
                    <span className="text-emerald-400 font-semibold text-[11px]">Ready for Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM & TRIMEDI'S SOLUTION (Visually concise) */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              The Healthcare Disconnect
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Healthcare Information is Fragmented. <br className="hidden sm:inline" />
              <span className="text-brand-700">TriMedi Connects the Journey.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Fragmented Healthcare (Before) */}
            <div className="p-8 rounded-3xl bg-rose-50/40 border border-rose-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg mb-4">
                  ✕
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Disconnected Traditional Care</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Doctor consultations, paper prescriptions, and medicine orders exist in separate silos.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Patients forget refill dates when medicine purchases do not match full prescription duration.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Doctors have zero visibility into whether prescribed medicines are actually taken or reordered.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-rose-200/60 text-xs font-semibold text-rose-700">
                Result: Treatment gaps, missed refills, and forgotten medical records.
              </div>
            </div>

            {/* TriMedi Connected Ecosystem (After) */}
            <div className="p-8 rounded-3xl bg-brand-50/40 border border-brand-200/80 flex flex-col justify-between shadow-subtle">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">TriMedi Connected Ecosystem</h3>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-600 font-bold">•</span>
                    <span><b>Unified Care Loop:</b> Doctor, Patient, Digital Prescription, Pharmacy, and Treatment tracking in one place.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-600 font-bold">•</span>
                    <span><b>Duration Intelligence:</b> Understands the difference between a 30-day prescription and a 15-day purchase.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-600 font-bold">•</span>
                    <span><b>Continuous Care:</b> Proactive refill alerts and instant reorders keep patients consistently on schedule.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-200 text-xs font-bold text-brand-800">
                Result: Uninterrupted therapy, synchronized treatment records, and peace of mind.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW TRIMEDI WORKS (Visual 7-step Workflow) */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
              Seamless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              How TriMedi Works
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              From the initial consultation to continuous refill management in 7 synchronized steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.slice(0, 4).map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-slate-400">{s.step}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
            {workflowSteps.slice(4).map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-slate-400">{s.step}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Designed for Complete Healthcare Management
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-200 hover:shadow-md transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-brand-700 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. TRUST & SECURITY */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3 text-center lg:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-900/50 px-3 py-1 rounded-full border border-teal-700">
                Security & Data Integrity
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Healthcare Information Handled with Care
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                TriMedi applies authenticated role-based access, encrypted sessions, and verified doctor-pharmacy linkages to ensure your medical history and prescriptions stay protected.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-center lg:justify-end gap-3">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                <FiLock className="w-6 h-6 text-brand-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">Encrypted Access</span>
                <span className="text-[10px] text-slate-400">JWT Authentication</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                <FiUserCheck className="w-6 h-6 text-teal-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">Role Separation</span>
                <span className="text-[10px] text-slate-400">Strict Permissioning</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-tr from-brand-900 via-teal-800 to-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Take Control of Your Healthcare Journey
          </h2>
          <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto mb-8 leading-relaxed">
            Experience connected prescriptions, intelligent medication tracking, and seamless doctor consultations with TriMedi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="bg-brand-400 hover:bg-brand-300 text-slate-950 font-bold px-8 shadow-xl"
              onClick={() => navigate("/auth?mode=register")}
              icon={FiArrowRight}
              iconPosition="right"
            >
              Get Started with TriMedi
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => navigate("/products")}
            >
              Browse Medicine Catalog
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Landing;
