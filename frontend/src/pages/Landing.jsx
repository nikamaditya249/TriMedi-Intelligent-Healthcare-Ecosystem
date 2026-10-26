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
  FiRefreshCw,
  FiHeart,
  FiCalendar,
  FiCheck,
  FiHelpCircle,
  FiPercent,
} from "react-icons/fi";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export function Landing() {
  const navigate = useNavigate();
  const { switchDemoRole, isAuthenticated, activeRole } = useAuth();

  const handleConsultDoctor = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (activeRole === "patient") {
      navigate("/app/patient/doctors");
    } else if (activeRole === "doctor") {
      navigate("/app/doctor/dashboard");
    } else {
      navigate(`/app/${activeRole}/dashboard`);
    }
  };

  const handleRoleLaunch = (role) => {
    switchDemoRole(role);
    navigate(`/app/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* 1. SUBTLE CLINICAL TRUST STRIP */}
      <div className="bg-emerald-50/60 text-slate-600 py-1.5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center text-[11px] font-medium border-b border-emerald-100/80">
        <div className="w-full flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-brand-800 font-semibold">
            <FiCheckCircle className="w-3.5 h-3.5 text-brand-600" />
            Connected Healthcare Ecosystem
          </span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="text-slate-600">Certified Doctors, Licensed Pharmacies & Intelligent Refill Tracking</span>
        </div>
      </div>

      {/* 2. HEALTHCARE COMMERCE HERO SECTION */}
      <section className="relative bg-white pt-8 pb-14 lg:pt-12 lg:pb-20 border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
            {/* Left: Clear Healthcare Value Proposition */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                <span>CONNECTED HEALTHCARE PLATFORM</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Healthcare, Connected <br className="hidden sm:inline" />
                <span className="text-brand-700">From Consultation to Refill.</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto lg:mx-0 font-normal leading-relaxed">
                TriMedi connects patients, doctors, and licensed pharmacies through consultations, digital prescriptions, medicine fulfillment, and intelligent medication tracking.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleConsultDoctor}
                  icon={FiArrowRight}
                  iconPosition="right"
                  className="font-bold text-sm px-6 shadow-subtle"
                >
                  Consult a Doctor
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/products")}
                  className="font-bold text-sm px-6 text-slate-700 hover:text-slate-900"
                >
                  Browse Medicines
                </Button>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <FiCheck className="w-4 h-4 text-brand-700" />
                  Verified Doctors
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <FiCheck className="w-4 h-4 text-brand-700" />
                  Licensed Pharmacies
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <FiCheck className="w-4 h-4 text-brand-700" />
                  Proactive Refill Tracking
                </span>
              </div>
            </div>

            {/* Right: Restrained Healthcare Product Visual */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 sm:p-7 shadow-card w-full">
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800">
                      Active Care Journey
                    </span>
                  </div>
                  <Badge variant="brand" size="sm">
                    Live Record
                  </Badge>
                </div>

                {/* Status Cards */}
                <div className="space-y-3">
                  {/* Digital Prescription */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Digital Prescription
                        </p>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          Atorvastatin 20mg • 30 Days
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Issued by Dr. Sarah Jenkins, MD
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    {/* Supply Progress */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Supply Remaining</span>
                        <span className="font-bold text-amber-700">12 Days Supply</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-600 h-2 rounded-full"
                          style={{ width: "40%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Refill Gap Intelligence Signal */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
                    <FiClock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-900">
                        Intelligent Refill Window Open
                      </p>
                      <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                        Refill alert triggers when 5 days or fewer of medication remain to prevent therapy interruption.
                      </p>
                    </div>
                  </div>

                  {/* Pharmacy Verification */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FiPackage className="w-4 h-4 text-brand-700" />
                      <span className="font-semibold text-slate-700">Dispensing Partner</span>
                    </div>
                    <span className="font-bold text-slate-800">Verified Pharmacy Stock</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE TRIMEDI DIFFERENTIATORS (MORE THAN A PHARMACY) */}
      <section id="differentiators" className="py-16 sm:py-24 bg-white border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-center max-w-4xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              <FiActivity className="w-3.5 h-3.5" />
              <span>Core Ecosystem</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              More Than a Pharmacy
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
              TriMedi connects the complete healthcare journey instead of treating consultation, prescriptions, medicines, and follow-up as separate services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {/* 01 — Doctor Consultation */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center">
                    <FiCalendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">01</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Doctor Consultation
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Connect with certified doctors through appointments and secure consultation workflows.
                </p>
              </div>
              <button
                type="button"
                onClick={handleConsultDoctor}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
              >
                <span>Consult a Doctor</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 02 — Digital Prescriptions */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center">
                    <FiFileText className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">02</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Digital Prescriptions
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Doctors issue structured digital prescriptions that remain connected to the patient's healthcare journey.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate(`/app/${activeRole}/prescriptions`);
                  } else {
                    navigate("/login");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
              >
                <span>Learn More</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 03 — Verified Pharmacy Fulfillment */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center">
                    <FiPackage className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">03</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Verified Pharmacy Fulfillment
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Prescribed medicines move into a controlled pharmacy workflow with prescription validation, inventory management, and fulfillment tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
              >
                <span>Browse Medicines</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 04 — Intelligent Refill Tracking */}
            <div id="refill-intelligence" className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center">
                    <FiRefreshCw className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">04</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Intelligent Refill Tracking
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  TriMedi tracks medication supply and identifies potential refill gaps so patients can act before treatment continuity is interrupted.
                </p>
              </div>
              <a
                href="#journey"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
              >
                <span>How It Works</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ONE CONTINUOUS HEALTHCARE JOURNEY (HORIZONTAL WORKFLOW) */}
      <section id="journey" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              End-to-End Care Loop
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              One Continuous Healthcare Journey
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Every step is integrated into a unified digital record to ensure therapy continuity.
            </p>
          </div>

          {/* 6 Steps Workflow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 xl:gap-5">
            {[
              {
                step: "01",
                title: "Consult",
                desc: "Consult certified doctors via video or clinical visits.",
                icon: FiCalendar,
              },
              {
                step: "02",
                title: "Prescription",
                desc: "Receive structured digital prescriptions with exact dosages.",
                icon: FiFileText,
              },
              {
                step: "03",
                title: "Pharmacy",
                desc: "Prescriptions route directly to licensed pharmacy networks.",
                icon: FiPackage,
              },
              {
                step: "04",
                title: "Medication",
                desc: "Daily dosage adherence and treatment duration are tracked.",
                icon: FiHeart,
              },
              {
                step: "05",
                title: "Refill",
                desc: "Proactive alert signals when 5 days or fewer of supply remain.",
                icon: FiClock,
              },
              {
                step: "06",
                title: "Order Again",
                desc: "1-click reorder maintains seamless treatment continuity.",
                icon: FiRefreshCw,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle hover:border-brand-600/60 hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {s.step}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      {s.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PRESCRIPTION-TO-DOOR SECTION */}
      <section id="prescription-flow" className="py-16 sm:py-20 bg-white border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="max-w-4xl mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Controlled Fulfillment
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              From Prescription to Your Door
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              How TriMedi safely coordinates between medical consultation and authentic pharmacy dispensing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 xl:gap-5">
            {[
              {
                num: "1",
                name: "Doctor Consultation",
                desc: "Certified physician evaluates symptoms & diagnoses condition.",
              },
              {
                num: "2",
                name: "Digital Prescription",
                desc: "Doctor issues cryptographically verifiable digital Rx.",
              },
              {
                num: "3",
                name: "Prescription Validation",
                desc: "Licensed pharmacist verifies validity before processing.",
              },
              {
                num: "4",
                name: "Medicine Selection",
                desc: "Authentic batch stock allocated from licensed inventory.",
              },
              {
                num: "5",
                name: "Pharmacy Fulfillment",
                desc: "Safe packaging with dosage schedules and batch details.",
              },
              {
                num: "6",
                name: "Delivery Tracking",
                desc: "Transparent tracking right to your doorstep.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50"
              >
                <div className="w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center mb-2.5">
                  {step.num}
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">
                  {step.name}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRADITIONAL HEALTHCARE VS TRIMEDI (COMPARISON) */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Integrated vs. Fragmented
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Healthcare Shouldn't Feel Fragmented
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Why an integrated ecosystem provides safer, simpler treatment outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 w-full">
            {/* Traditional Healthcare */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-subtle">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <h4 className="text-base font-bold text-slate-800">
                  Traditional Healthcare
                </h4>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Physical paper prescriptions easily lost or damaged.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Medical records scattered across different clinics and files.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Separate pharmacy search with unknown stock availability.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Manual refill tracking causing abrupt therapy gaps.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Repeated medical history explanations at each visit.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold mt-0.5">•</span>
                  <span>Difficult post-consultation doctor follow-up.</span>
                </li>
              </ul>
            </div>

            {/* With TriMedi */}
            <div className="bg-white rounded-2xl border-2 border-brand-600/80 p-6 sm:p-8 shadow-card relative">
              <div className="absolute top-3 right-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-50 text-brand-800 border border-brand-200 rounded">
                  Connected Care
                </span>
              </div>
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-brand-100">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
                <h4 className="text-base font-bold text-brand-900">
                  With TriMedi
                </h4>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5 font-medium">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span>Tamper-evident structured digital prescriptions.</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span>Connected longitudinal medical records accessible to authorized care teams.</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span>Integrated pharmacy network with verified inventory & delivery.</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span>Intelligent refill gap tracking preventing treatment interruptions.</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span>Unified patient care hub with full medication adherence visibility.</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span>Secure messaging and streamlined appointment follow-up.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ROLE-BASED PLATFORM WORKSPACES */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Role-Based Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dedicated Portals for Every Care Participant
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Every participant operates within an authenticated, role-isolated workspace designed for clinical safety and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {/* Patient Portal */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60 mb-4">
                  <FiHeart className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">
                  Patients
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
                  <li>• Certified doctor appointments</li>
                  <li>• Digital prescription vault</li>
                  <li>• Authentic medicine orders</li>
                  <li>• Proactive refill reminders</li>
                </ul>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  if (isAuthenticated && activeRole === "patient") {
                    navigate("/app/patient/dashboard");
                  } else {
                    handleRoleLaunch("patient");
                  }
                }}
              >
                Patient Portal
              </Button>
            </div>

            {/* Doctor Portal */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60 mb-4">
                  <FiUserCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">
                  Doctors
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
                  <li>• Longitudinal medical records</li>
                  <li>• Consultation queue & notes</li>
                  <li>• Structured e-prescription issuance</li>
                  <li>• Clinical decision support</li>
                </ul>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  if (isAuthenticated && activeRole === "doctor") {
                    navigate("/app/doctor/dashboard");
                  } else {
                    handleRoleLaunch("doctor");
                  }
                }}
              >
                Doctor Portal
              </Button>
            </div>

            {/* Pharmacy Portal */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60 mb-4">
                  <FiPackage className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">
                  Pharmacies
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
                  <li>• Prescription authenticity validation</li>
                  <li>• Real-time dispensing queue</li>
                  <li>• Batch & stock inventory controls</li>
                  <li>• Order fulfillment workflow</li>
                </ul>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  if (isAuthenticated && activeRole === "pharmacy") {
                    navigate("/app/pharmacy/dashboard");
                  } else {
                    handleRoleLaunch("pharmacy");
                  }
                }}
              >
                Pharmacy Portal
              </Button>
            </div>

            {/* Admin Portal */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60 mb-4">
                  <FiShield className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">
                  Administrators
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
                  <li>• Platform governance & audit logs</li>
                  <li>• Directory & role permissions</li>
                  <li>• System health telemetry</li>
                  <li>• Operational compliance controls</li>
                </ul>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  if (isAuthenticated && activeRole === "admin") {
                    navigate("/app/admin/dashboard");
                  } else {
                    handleRoleLaunch("admin");
                  }
                }}
              >
                Admin Portal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PATIENT SAFETY & TRUST */}
      <section id="safety" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-subtle w-full">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
                <FiShield className="w-3.5 h-3.5 text-brand-700" />
                <span>Clinical Governance & Standards</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Built Around Patient Safety
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">
                TriMedi incorporates automated intelligence strictly as an assistive tool. Certified doctors retain ultimate clinical decision-making authority over all prescriptions and dosing regimens.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Human Clinical Authority</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Doctors retain final clinical decision-making authority over all treatment decisions.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Prescription Verification</h4>
                  <p className="text-slate-500 leading-relaxed">
                    AI-assisted extraction does not autonomously authorize prescriptions; human doctor verification is strictly enforced.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Secure Healthcare Data</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Role-based access control and security protocols protect sensitive patient and clinical information.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Authoritative Server Pricing</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Order pricing, GST calculations, and refill drafts are computed server-side to guarantee transparency.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Verified Pharmacy Workflow</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Prescription validity and inventory reservation are confirmed before dispensing orders.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Non-Alarmist Proactive Alerts</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Refill alerts trigger when 5 days or fewer of medication remain, keeping patients informed without anxiety.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. OFFERS & BENEFITS SECTION */}
      <section id="offers" className="py-14 sm:py-18 bg-white border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 mb-1">
              <FiPercent className="w-3.5 h-3.5" />
              <span>Patient Benefits</span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Transparent Healthcare Benefits
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Honest, transparent pricing without artificial markups or fake discounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8">
            <div className="p-5 rounded-xl border border-slate-200/90 bg-slate-50/50">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Fulfillment</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1.5">Direct Pharmacy Rates</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Medicines are billed directly at licensed pharmacy catalog rates with complete GST itemization and zero surprise charges.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200/90 bg-slate-50/50">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Continuity</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1.5">Included Refill Intelligence</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Treatment supply tracking and refill window notifications are provided as a core healthcare service at zero additional cost.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200/90 bg-slate-50/50">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Payment Safety</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1.5">Secure Transaction Gateway</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transactions use encrypted payment capture with real-time receipt generation and inventory locking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. NEED HELP & SUPPORT SECTION */}
      <section id="help" className="py-14 sm:py-18 bg-slate-50 border-b border-slate-200/90">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 mb-1">
              <FiHelpCircle className="w-3.5 h-3.5" />
              <span>Assistance & FAQs</span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Need Help With Your Healthcare?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Straightforward guidance for appointments, prescription verification, and medicine delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">How do digital prescriptions work?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Following your doctor consultation, an official digital prescription is saved to your secure patient vault and can be used directly for pharmacy orders.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Can I order medicines without a prescription?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Over-the-counter (OTC) health essentials can be ordered directly. Prescription-only medicines strictly require an approved digital prescription.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">How does refill tracking work?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                TriMedi calculates your prescribed duration against purchased supplies, notifying you when 5 days or fewer remain so you can reorder without gap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FINAL CALL TO ACTION */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Start Your Healthcare Journey With TriMedi
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Consult a doctor, manage prescriptions, find medicines, and stay on track with your treatment.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleConsultDoctor}
              className="font-bold text-sm px-7 shadow-subtle"
            >
              Consult a Doctor
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/products")}
              className="font-bold text-sm px-7 text-slate-700"
            >
              Browse Medicines
            </Button>
          </div>
        </div>
      </section>

      {/* 12. GLOBAL PLATFORM FOOTER */}
      <Footer />
    </div>
  );
}

export default Landing;
