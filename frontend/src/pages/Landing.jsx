import React, { useState, useEffect, useRef, useCallback } from "react";
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
  FiShoppingBag,
  FiLock,
  FiAlertCircle,
  FiChevronRight,
} from "react-icons/fi";
import Badge from "../components/ui/Badge";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getProducts } from "../api";

// 6 Core Care Loop Steps with full clinical metadata
const CARE_LOOP_STEPS = [
  {
    id: "consult",
    step: "01",
    label: "CONSULT",
    fullTitle: "Doctor Consultation",
    tagline: "Certified Clinical Evaluation",
    shortDesc: "Connect with a verified doctor through a secure consultation workflow.",
    details:
      "Licensed physicians evaluate symptoms, review longitudinal health history, conduct clinical video encounters, and issue structured diagnosis plans.",
    icon: FiCalendar,
    badge: "Clinical Encounter",
    color: "#087F73",
    actionText: "Consult a Doctor",
    target: "consult",
    highlights: [
      "Board-certified physician evaluations",
      "Encrypted clinical chat & video",
      "Direct handoff to digital prescription",
    ],
  },
  {
    id: "prescription",
    step: "02",
    label: "PRESCRIPTION",
    fullTitle: "Digital Prescription",
    tagline: "Structured & Tamper-Evident",
    shortDesc: "Receive a structured digital prescription reviewed and approved by your doctor.",
    details:
      "Every prescription contains precise dosing regimens, durations, and clinical notes saved directly to your permanent health vault.",
    icon: FiFileText,
    badge: "Doctor Approved",
    color: "#0D9488",
    actionText: "Explore Prescriptions",
    target: "prescriptions",
    highlights: [
      "Structured active ingredients & strengths",
      "Doctor verified with cryptographic audit trail",
      "Instant routing to dispensing pharmacy",
    ],
  },
  {
    id: "pharmacy",
    step: "03",
    label: "PHARMACY",
    fullTitle: "Verified Pharmacy",
    tagline: "Licensed Inventory Dispensing",
    shortDesc: "Prescription medicines move through verified pharmacy validation and fulfillment.",
    details:
      "Licensed pharmacy networks validate prescription legitimacy, allocate authentic batch inventory, and package medications under strict standards.",
    icon: FiPackage,
    badge: "Licensed Dispensing",
    color: "#0284C7",
    actionText: "Browse Pharmacy Catalog",
    target: "pharmacy",
    highlights: [
      "Batch verification & temperature control",
      "Server-side GST and authoritative rates",
      "Tracked packaging and dispatch",
    ],
  },
  {
    id: "medication",
    step: "04",
    label: "MEDICATION",
    fullTitle: "Medication Tracking",
    tagline: "Active Treatment Adherence",
    shortDesc: "Track dosage, treatment duration and medication adherence.",
    details:
      "Patients record daily doses, view remaining therapy duration, and maintain adherence visibility without complex paperwork.",
    icon: FiHeart,
    badge: "Daily Adherence",
    color: "#059669",
    actionText: "View Adherence Tools",
    target: "schedule",
    highlights: [
      "Simple take / skip / miss dose logging",
      "Supply countdown in real-time",
      "Adherence insights visible to doctor",
    ],
  },
  {
    id: "refill",
    step: "05",
    label: "REFILL",
    fullTitle: "Intelligent Refill",
    tagline: "Proactive Supply Alerts",
    shortDesc: "Receive proactive alerts when your medication supply is running low.",
    details:
      "TriMedi calculates remaining supply days based on prescribed dosage and notifies you when 5 days or fewer remain so therapy is never interrupted.",
    icon: FiClock,
    badge: "5-Day Gap Alert",
    color: "#D97706",
    actionText: "Learn About Refills",
    target: "refill",
    highlights: [
      "Calculated from actual consumption",
      "Non-alarmist early notification",
      "Prepares authenticated refill cart",
    ],
  },
  {
    id: "order-again",
    step: "06",
    label: "ORDER AGAIN",
    fullTitle: "Continuous Care Reorder",
    tagline: "Unbroken Therapy Continuity",
    shortDesc: "Reorder eligible medicines without rebuilding the entire healthcare journey.",
    details:
      "One-click reorder maintains treatment continuity with continuous clinical oversight, keeping your complete care loop connected.",
    icon: FiRefreshCw,
    badge: "Treatment Continuity",
    color: "#087F73",
    actionText: "Start Care Loop",
    target: "reorder",
    highlights: [
      "Pre-validated prescription eligibility",
      "Zero friction repeat ordering",
      "Feeds directly back into consultation",
    ],
  },
];

// High-resolution, stable healthcare photography
const HEALTHCARE_IMAGES = {
  consultation:
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1000&q=80",
  pharmacy:
    "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1000&q=80",
  doctorReview:
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80",
  packaging:
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1000&q=80",
  patientTracking:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80",
};

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, activeRole } = useAuth();
  const { addToCart } = useCart() || {};

  // Interactive Care Loop State
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  // Real Catalog Products from Backend
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState(null);

  // Auto-cycle through Care Loop nodes every 4.2 seconds if user is not actively interacting
  useEffect(() => {
    if (!isAutoCycling) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % CARE_LOOP_STEPS.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isAutoCycling]);

  // Load 4 real products from the backend catalog
  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      try {
        setProductsLoading(true);
        const data = await getProducts();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setFeaturedProducts(data.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load catalog products for landing page:", err);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    }
    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

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

  const handleRolePortalClick = (targetRole) => {
    if (isAuthenticated) {
      if (activeRole === targetRole) {
        navigate(`/app/${targetRole}/dashboard`);
      } else {
        navigate(`/app/${activeRole}/dashboard`);
      }
    } else {
      navigate("/login");
    }
  };

  const handleCareLoopAction = (target) => {
    if (target === "consult") {
      handleConsultDoctor();
    } else if (target === "pharmacy" || target === "reorder") {
      navigate("/products");
    } else if (isAuthenticated) {
      navigate(`/app/${activeRole}/dashboard`);
    } else {
      navigate("/login");
    }
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    if (addToCart) {
      addToCart(product, 1);
      setAddedProductId(product._id);
      setTimeout(() => setAddedProductId(null), 2000);
    }
  };

  const activeStep = CARE_LOOP_STEPS[activeStepIndex];

  // Radial positions for 6 nodes on a 500x500 SVG coordinate space
  // Center cx=250, cy=250, radius=170 (compact proportion to fit 620-720px section height).
  const cx = 250;
  const cy = 250;
  const radius = 170;

  const nodePositions = CARE_LOOP_STEPS.map((step, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      angle,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* 1. CLINICAL TRUST TOP BAR */}
      <div className="bg-emerald-50/70 text-slate-700 py-1.5 px-4 text-center text-[11px] font-medium border-b border-emerald-100/80">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-brand-800 font-semibold">
            <FiCheckCircle className="w-3.5 h-3.5 text-brand-600" />
            Connected Healthcare Ecosystem
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="text-slate-600">
            Verified Doctors • Licensed Pharmacies • Intelligent Refill Tracking
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. HERO SECTION — CONNECTED HEALTHCARE ECOSYSTEM COMPOSITION
          ========================================================================= */}
      <section className="relative bg-white pt-8 pb-12 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16 border-b border-slate-200/80 overflow-hidden">
        {/* Ambient subtle mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-50/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Headline & Healthcare Value Proposition */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/90 text-brand-800 text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
                <span>CONNECTED HEALTHCARE ECOSYSTEM</span>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  Healthcare, Connected.
                </h1>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-700 tracking-tight">
                  From Consultation to Refill.
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                TriMedi connects patients, doctors, prescriptions, pharmacies, and medication
                tracking into one continuous healthcare journey.
              </p>

              {/* Action Buttons with Consistent Hierarchy */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
                <button
                  type="button"
                  onClick={handleConsultDoctor}
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-xl font-bold text-sm bg-brand-700 hover:bg-brand-800 text-white shadow-subtle transition-colors cursor-pointer"
                >
                  <span>Consult a Doctor</span>
                  <FiArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-brand-600 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Browse Medicines</span>
                </button>
              </div>

              {/* 3 Concise Trust Points */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <FiCheck className="w-4 h-4 text-brand-700" />
                  Verified Doctors
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <FiCheck className="w-4 h-4 text-brand-700" />
                  Licensed Pharmacy
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <FiCheck className="w-4 h-4 text-brand-700" />
                  Intelligent Refill Tracking
                </span>
              </div>
            </div>

            {/* Right: Radial Connected Care Architecture Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-card relative">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                      Connected Care Architecture
                    </span>
                  </div>
                  <Badge variant="brand" size="sm">
                    Live System
                  </Badge>
                </div>

                {/* Central Radial Ecosystem Diagram */}
                <div className="relative w-full aspect-[4/3] flex items-center justify-center py-2">
                  <svg className="w-full h-full" viewBox="0 0 360 260">
                    <defs>
                      <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#087F73" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>

                    {/* Connecting Arcs between Center and Surrounding Orbitals */}
                    {[
                      { x: 60, y: 55 },
                      { x: 180, y: 35 },
                      { x: 300, y: 55 },
                      { x: 60, y: 205 },
                      { x: 180, y: 225 },
                      { x: 300, y: 205 },
                    ].map((pt, i) => (
                      <g key={i}>
                        <line
                          x1="180"
                          y1="130"
                          x2={pt.x}
                          y2={pt.y}
                          stroke="#CBD5E1"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        <circle cx={pt.x} cy={pt.y} r="22" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
                      </g>
                    ))}

                    {/* Outer Orbit Path */}
                    <ellipse
                      cx="180"
                      cy="130"
                      rx="130"
                      ry="95"
                      fill="none"
                      stroke="#9AD9D1"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.7"
                    />

                    {/* Center Core: TriMedi Connected Care */}
                    <circle cx="180" cy="130" r="42" fill="#FFFFFF" stroke="#087F73" strokeWidth="2.5" />
                    <circle cx="180" cy="130" r="36" fill="#E8F7F4" opacity="0.6" />
                    <text x="180" y="125" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#087F73">
                      TriMedi
                    </text>
                    <text x="180" y="140" textAnchor="middle" fontSize="9" fontWeight="600" fill="#52627A">
                      Connected Care
                    </text>
                  </svg>

                  {/* HTML Overlay Badges for crisp typography */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="bg-white/95 px-2 py-1 rounded-lg border border-slate-200 shadow-xs text-slate-800 flex items-center gap-1">
                        <FiCalendar className="text-brand-700 w-3 h-3" /> Doctor
                      </span>
                      <span className="bg-white/95 px-2 py-1 rounded-lg border border-slate-200 shadow-xs text-slate-800 flex items-center gap-1">
                        <FiFileText className="text-brand-700 w-3 h-3" /> Prescription
                      </span>
                      <span className="bg-white/95 px-2 py-1 rounded-lg border border-slate-200 shadow-xs text-slate-800 flex items-center gap-1">
                        <FiPackage className="text-brand-700 w-3 h-3" /> Pharmacy
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="bg-white/95 px-2 py-1 rounded-lg border border-slate-200 shadow-xs text-slate-800 flex items-center gap-1">
                        <FiHeart className="text-emerald-700 w-3 h-3" /> Medication
                      </span>
                      <span className="bg-white/95 px-2 py-1 rounded-lg border border-slate-200 shadow-xs text-slate-800 flex items-center gap-1">
                        <FiClock className="text-amber-700 w-3 h-3" /> Refill
                      </span>
                      <span className="bg-white/95 px-2 py-1 rounded-lg border border-slate-200 shadow-xs text-slate-800 flex items-center gap-1">
                        <FiRefreshCw className="text-brand-700 w-3 h-3" /> Order Again
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Medication Treatment Record Preview */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 shadow-subtle">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Active Treatment Plan
                      </p>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                        Atorvastatin 20mg • Daily Regimen
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Prescription verified by Doctor
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Refill Window Open
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-medium">Supply Remaining</span>
                      <span className="font-bold text-brand-800">6 Days Supply</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. THE CARE LOOP — HERO CIRCULAR/RADIAL WORKFLOW VISUALIZATION
          ========================================================================= */}
      <section
        id="care-loop"
        className="pt-16 pb-12 sm:pt-16 sm:pb-14 bg-[#F0FDFA]/70 border-b border-teal-100/90 relative overflow-hidden scroll-mt-24 sm:scroll-mt-28"
        onMouseEnter={() => setIsAutoCycling(false)}
        onMouseLeave={() => setIsAutoCycling(true)}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-7 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100/70 border border-brand-200 text-brand-800 text-xs font-bold uppercase tracking-wider mb-2">
              <FiRefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
              <span>End-to-End Care Loop</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-slate-900 tracking-tight leading-tight">
              One Continuous Healthcare Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-2xl mx-auto">
              Every step connects to the next, keeping care organized from consultation through refill.
            </p>
          </div>

          {/* Interactive Care Loop Layout (48% Diagram / 52% Information Panel) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Desktop Circular / Radial Visual (Left on lg) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-[400px] sm:max-w-[440px] aspect-square select-none">
                <svg className="w-full h-full" viewBox="0 0 500 500">
                  <defs>
                    <linearGradient id="activeArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#087F73" />
                      <stop offset="100%" stopColor="#0284C7" />
                    </linearGradient>

                    {/* Clockwise Directional Arrowhead Marker */}
                    <marker
                      id="arrowhead"
                      markerWidth="6"
                      markerHeight="6"
                      refX="3"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,1 L5,3 L0,5 Z" fill="#087F73" />
                    </marker>
                  </defs>

                  {/* Circular Track Background */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                  />

                  {/* 6 Clockwise Connecting Arcs with Directional Flow */}
                  {CARE_LOOP_STEPS.map((s, i) => {
                    const nextIndex = (i + 1) % CARE_LOOP_STEPS.length;
                    const p1 = nodePositions[i];
                    const p2 = nodePositions[nextIndex];
                    const isActiveSegment = activeStepIndex === i;

                    const arcPath = `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y}`;

                    const midAngle = p1.angle + Math.PI / 6;
                    const midX = cx + radius * Math.cos(midAngle);
                    const midY = cy + radius * Math.sin(midAngle);

                    return (
                      <g key={s.id}>
                        <path
                          d={arcPath}
                          fill="none"
                          stroke={isActiveSegment ? "url(#activeArcGrad)" : "#CBD5E1"}
                          strokeWidth={isActiveSegment ? "4" : "2"}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                        <circle
                          cx={midX}
                          cy={midY}
                          r={isActiveSegment ? "4.5" : "3"}
                          fill={isActiveSegment ? "#087F73" : "#94A3B8"}
                          className="transition-all duration-300"
                        />
                      </g>
                    );
                  })}

                  {/* CENTER OF CIRCLE: Compact TriMedi Connected Care Hub */}
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="78"
                      fill="#FFFFFF"
                      stroke="#087F73"
                      strokeWidth="2.5"
                      className="filter drop-shadow-md"
                    />
                    <circle cx={cx} cy={cy} r="72" fill="#E8F7F4" opacity="0.4" />

                    <text
                      x={cx}
                      y={cy - 18}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#087F73"
                      letterSpacing="0.1em"
                    >
                      TRIMEDI
                    </text>
                    <text
                      x={cx}
                      y={cy + 6}
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="800"
                      fill="#1E293B"
                    >
                      Connected Care
                    </text>

                    {/* Step indicator in center */}
                    <rect
                      x={cx - 44}
                      y={cy + 18}
                      width="88"
                      height="20"
                      rx="10"
                      fill="#FFFFFF"
                      stroke="#9AD9D1"
                      strokeWidth="1"
                    />
                    <text
                      x={cx}
                      y={cy + 32}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#087F73"
                    >
                      Step 0{activeStepIndex + 1} of 06
                    </text>
                  </g>

                  {/* 6 Interactive Nodes positioned around the perimeter */}
                  {CARE_LOOP_STEPS.map((s, i) => {
                    const pos = nodePositions[i];
                    const isActive = activeStepIndex === i;

                    return (
                      <g
                        key={s.id}
                        onClick={() => {
                          setActiveStepIndex(i);
                          setIsAutoCycling(false);
                        }}
                        onMouseEnter={() => {
                          setActiveStepIndex(i);
                          setIsAutoCycling(false);
                        }}
                        className="cursor-pointer transition-transform duration-300"
                        style={{
                          transformOrigin: `${pos.x}px ${pos.y}px`,
                          transform: isActive ? "scale(1.05)" : "scale(1)",
                        }}
                      >
                        {isActive && (
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="29"
                            fill="#087F73"
                            opacity="0.12"
                            className="animate-pulse"
                          />
                        )}

                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isActive ? "23" : "20"}
                          fill={isActive ? "#087F73" : "#FFFFFF"}
                          stroke={isActive ? "#06665D" : "#CBD5E1"}
                          strokeWidth={isActive ? "2.5" : "2"}
                          className="transition-all duration-300 filter drop-shadow-sm"
                        />

                        <text
                          x={pos.x}
                          y={pos.y - 3}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="800"
                          fontFamily="monospace"
                          fill={isActive ? "#FFFFFF" : "#64748B"}
                        >
                          {s.step}
                        </text>

                        <text
                          x={pos.x}
                          y={pos.y + 10}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="700"
                          letterSpacing="0.03em"
                          fill={isActive ? "#FFFFFF" : "#1E293B"}
                        >
                          {s.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Interactive Step Details Panel (Right on lg) */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl border-2 border-brand-600/70 p-6 sm:p-7 shadow-card relative">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200">
                      {activeStep.step}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Care Workflow Step
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                        {activeStep.fullTitle}
                      </h3>
                    </div>
                  </div>
                  <Badge variant="brand" size="sm">
                    {activeStep.badge}
                  </Badge>
                </div>

                {/* Primary Narrative */}
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-brand-800">
                    "{activeStep.shortDesc}"
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeStep.details}
                  </p>
                </div>

                {/* Key Clinical Safeguards */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Clinical Continuity Safeguards:
                  </span>
                  {activeStep.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <FiCheck className="w-3.5 h-3.5 text-brand-700 shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>

                {/* Direct Action Button */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleCareLoopAction(activeStep.target)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-subtle transition-colors cursor-pointer"
                  >
                    <span>{activeStep.actionText}</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {CARE_LOOP_STEPS.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => {
                          setActiveStepIndex(dotIdx);
                          setIsAutoCycling(false);
                        }}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          activeStepIndex === dotIdx
                            ? "bg-brand-700 w-4.5"
                            : "bg-slate-200 hover:bg-slate-300"
                        }`}
                        aria-label={`Jump to step ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "HEALTHCARE THAT STAYS CONNECTED" — LANDSCAPE HEALTHCARE TEAM VISUAL BREAK
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left: Narrative & Trust Points */}
            <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
                <FiActivity className="w-3.5 h-3.5" />
                <span>Clinical Continuity</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Healthcare That Stays Connected
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                TriMedi keeps every important step of care connected — from consultation and digital
                prescription to pharmacy fulfillment and ongoing medication support.
              </p>

              {/* 3 Concise Trust Points */}
              <div className="pt-2 space-y-2.5 text-xs text-slate-700 text-left">
                <div className="flex items-start gap-2.5">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span className="font-medium">Doctor-led clinical workflows</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span className="font-medium">Connected prescription and pharmacy fulfillment</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                  <span className="font-medium">Medication tracking and refill intelligence</span>
                </div>
              </div>
            </div>

            {/* Right: Landscape Healthcare Team Image (16:9) */}
            <div className="lg:col-span-7">
              <div
                className="rounded-2xl overflow-hidden border border-teal-700/15 shadow-card hover:scale-[1.01] transition-transform duration-300 relative group aspect-[4/3] sm:aspect-[16/9] bg-slate-900"
                style={{
                  borderRadius: "20px",
                  border: "1px solid rgba(15, 118, 110, 0.15)",
                  boxShadow: "0 12px 35px rgba(15, 23, 42, 0.08)",
                }}
              >
                <img
                  src="/images/trimedi-care-team-landscape.jpg"
                  alt="TriMedi healthcare team representing connected clinical care"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
                      Multi-Disciplinary Care Team
                    </span>
                  </div>
                  <span className="text-[10px] text-teal-200 font-semibold bg-white/10 px-2 py-0.5 rounded">
                    Certified Network
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 6-Stage Journey Timeline Summary */}
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { num: "01", title: "Consult", desc: "Certified doctor encounter" },
                { num: "02", title: "Digital Rx", desc: "Structured tamper-evident record" },
                { num: "03", title: "Pharmacy", desc: "Licensed authentic stock" },
                { num: "04", title: "Medication", desc: "Daily adherence schedule" },
                { num: "05", title: "Refill", desc: "5-day proactive gap alert" },
                { num: "06", title: "Order Again", desc: "1-click therapy continuity" },
              ].map((step) => (
                <div
                  key={step.num}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left"
                >
                  <span className="text-[10px] font-mono font-bold text-brand-700 block">
                    {step.num}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BEFORE VS. TRIMEDI — VISUAL COMPARISON
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Fragmented vs. Connected Care
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Healthcare Shouldn't Feel Fragmented
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Why an integrated healthcare ecosystem eliminates therapy interruptions and protects patient health.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Traditional Healthcare (Fragmented) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-800">Traditional Healthcare</h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                    Fragmented
                  </span>
                </div>

                {/* Broken workflow illustration */}
                <div className="py-2.5 px-3 mb-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                    <span>Doctor</span>
                    <span className="text-rose-400 font-bold">⤏ / / ⤏</span>
                    <span>Paper Rx</span>
                    <span className="text-rose-400 font-bold">⤏ / / ⤏</span>
                    <span>Pharmacy</span>
                    <span className="text-rose-400 font-bold">⤏ / / ⤏</span>
                    <span className="text-rose-600 font-bold">Missed Refill</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    Dashed connectors indicate disconnected systems and manual handoffs
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span>Paper prescriptions are easily misplaced, damaged, or illegible.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span>Medical records scattered across different clinics and paper files.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span>Manual pharmacy hunting with uncertain stock availability and delays.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span>Unmonitored supply leading to abrupt therapy gaps and treatment lapses.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Frequent therapy dropouts and uncoordinated medical records.
              </div>
            </div>

            {/* With TriMedi (Connected) */}
            <div className="bg-white rounded-2xl border-2 border-brand-600 p-5 sm:p-7 shadow-card flex flex-col justify-between relative">
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-50 text-brand-800 border border-brand-200 rounded">
                  Connected Care
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 pb-3 mb-3.5 border-b border-brand-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
                  <h4 className="text-sm sm:text-base font-bold text-brand-900">With TriMedi</h4>
                </div>

                {/* Continuous workflow illustration */}
                <div className="py-2.5 px-3 mb-4 rounded-xl bg-brand-50/50 border border-brand-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px] text-brand-900 font-bold">
                    <span>Doctor</span>
                    <span className="text-brand-600">→</span>
                    <span>Digital Rx</span>
                    <span className="text-brand-600">→</span>
                    <span>Pharmacy</span>
                    <span className="text-brand-600">→</span>
                    <span>Adherence</span>
                    <span className="text-brand-600">→</span>
                    <span className="text-brand-700">Refill Alert</span>
                  </div>
                  <p className="text-[10px] text-brand-700 text-center font-medium">
                    Continuous unbroken digital record keeps all clinical participants aligned
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5 font-medium">
                    <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                    <span>Cryptographically verified digital prescriptions saved to patient vault.</span>
                  </li>
                  <li className="flex items-start gap-2.5 font-medium">
                    <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                    <span>Longitudinal medical history accessible to authorized care teams.</span>
                  </li>
                  <li className="flex items-start gap-2.5 font-medium">
                    <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                    <span>Direct routing to licensed pharmacy inventory with verified stock.</span>
                  </li>
                  <li className="flex items-start gap-2.5 font-medium">
                    <FiCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                    <span>Intelligent 5-day refill alert window prevents therapy interruption.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-brand-100 text-[11px] font-semibold text-brand-800">
                Clinical oversight, transparent pricing, and zero treatment gaps.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. REAL PRODUCT CATALOG SECTION — "MEDICINES WHEN YOU NEED THEM"
          ========================================================================= */}
      <section id="products-catalog" className="py-12 sm:py-16 bg-white border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 mb-1">
                <FiPackage className="w-3.5 h-3.5" />
                <span>Verified Pharmacy Catalog</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Medicines When You Need Them
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Authentic medicines and healthcare essentials verified by licensed pharmacy partners.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/products")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-300 hover:bg-brand-50 text-xs font-bold text-brand-800 transition-colors cursor-pointer"
            >
              <span>View All Medicines</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {productsLoading ? (
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-xl border border-slate-200 p-4 bg-slate-50 animate-pulse space-y-3">
                  <div className="w-full aspect-[4/3] bg-slate-200 rounded-lg"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((prod) => (
                <div
                  key={prod._id}
                  onClick={() => navigate(`/product/${prod._id}`)}
                  className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-subtle hover:border-brand-500 hover:shadow-card transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Image with fallback */}
                    <div className="w-full aspect-[4/3] rounded-lg bg-slate-50 border border-slate-100 overflow-hidden mb-3 flex items-center justify-center relative">
                      <img
                        src={prod.image || HEALTHCARE_IMAGES.packaging}
                        alt={prod.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = HEALTHCARE_IMAGES.packaging;
                        }}
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2">
                        {prod.prescriptionRequired ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Rx Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            OTC
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {prod.category || "Pharmaceutical"}
                    </p>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 group-hover:text-brand-700 transition-colors line-clamp-1">
                      {prod.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {prod.dosageForm || "Formulation"} • {prod.strength || "Standard"}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{prod.price}
                      </span>
                      {prod.mrp && prod.mrp > prod.price && (
                        <span className="text-xs text-slate-400 line-through ml-1.5">
                          ₹{prod.mrp}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(prod, e)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                        addedProductId === prod._id
                          ? "bg-emerald-600 text-white"
                          : "bg-brand-50 hover:bg-brand-700 text-brand-800 hover:text-white border border-brand-200"
                      }`}
                    >
                      {addedProductId === prod._id ? (
                        <>
                          <FiCheck className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <FiShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-8 text-xs text-slate-500">
                Catalog data currently loading from server.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. "WHY TRIMEDI" — 4 FEATURE BLOCKS WITH ALTERNATING STORYTELLING LAYOUT
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50/70 border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Clinical Platform Principles
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Healthcare Leaders Choose TriMedi
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Engineered around clinical integrity, verified dispensing, and treatment continuity.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* Block 1: Image Left, Text Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-subtle">
              <div className="md:col-span-5 rounded-xl overflow-hidden aspect-[4/3] border border-slate-100">
                <img
                  src={HEALTHCARE_IMAGES.pharmacy}
                  alt="Pharmacist verifying medication stock"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="md:col-span-7 space-y-2.5">
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  01 • CONNECTED CARE
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                  One Unified Healthcare Architecture
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Consultation, prescription, pharmacy fulfillment, and medication adherence remain
                  connected in a single longitudinal patient record. No lost paper slips, duplicate
                  forms, or fractured care plans.
                </p>
              </div>
            </div>

            {/* Block 2: Text Left, Image Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-subtle">
              <div className="md:col-span-7 space-y-2.5 order-2 md:order-1">
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  02 • CLINICAL AUTHORITY
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                  AI-Assisted, Human Doctor Verified
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Artificial intelligence assists doctors with documentation, drug interaction checks,
                  and dosage calculations, but certified physicians retain ultimate clinical
                  decision-making authority over every prescription.
                </p>
              </div>
              <div className="md:col-span-5 rounded-xl overflow-hidden aspect-[4/3] border border-slate-100 order-1 md:order-2">
                <img
                  src={HEALTHCARE_IMAGES.doctorReview}
                  alt="Doctor reviewing clinical records on tablet"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Block 3: Image Left, Text Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-subtle">
              <div className="md:col-span-5 rounded-xl overflow-hidden aspect-[4/3] border border-slate-100">
                <img
                  src={HEALTHCARE_IMAGES.packaging}
                  alt="Pharmaceutical grade verified dispensing package"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="md:col-span-7 space-y-2.5">
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  03 • VERIFIED FULFILLMENT
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                  Controlled Pharmacy Dispensing
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Prescription validation, stock reservation, and temperature-controlled pharmacy
                  dispensing guarantee genuine formulations directly from licensed distributors.
                </p>
              </div>
            </div>

            {/* Block 4: Text Left, Image Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-subtle">
              <div className="md:col-span-7 space-y-2.5 order-2 md:order-1">
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  04 • INTELLIGENT REFILLS
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                  Proactive Treatment Continuity
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Medication duration is tracked automatically to identify potential treatment gaps
                  before therapy is interrupted, giving patients ample time to order refills with peace of mind.
                </p>
              </div>
              <div className="md:col-span-5 rounded-xl overflow-hidden aspect-[4/3] border border-slate-100 order-1 md:order-2">
                <img
                  src={HEALTHCARE_IMAGES.patientTracking}
                  alt="Patient using smartphone to track medication schedule"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. BUILT AROUND PATIENT SAFETY & HEALTHCARE TRUST (DARK NAVY BAND)
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-[#17213A] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 text-teal-300 text-xs font-semibold mb-2.5 border border-slate-700">
              <FiShield className="w-3.5 h-3.5 text-teal-400" />
              <span>Clinical Governance & Patient Safety</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Built Around Patient Safety & Clinical Integrity
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Automated intelligence assists workflows, but clinical decisions and prescriptions
              remain strictly doctor-controlled.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div className="p-4 sm:p-5 rounded-xl bg-slate-800/50 border border-slate-700/80">
              <h4 className="font-bold text-teal-300 mb-1.5 flex items-center gap-1.5 text-sm">
                <FiCheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                Human Clinical Authority
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Doctors retain exclusive decision-making authority over all treatment decisions and prescriptions.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-800/50 border border-slate-700/80">
              <h4 className="font-bold text-teal-300 mb-1.5 flex items-center gap-1.5 text-sm">
                <FiFileText className="w-4 h-4 text-teal-400 shrink-0" />
                Tamper-Evident Prescriptions
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Every prescription carries cryptographic audit trails and doctor approval validation before dispensing.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-800/50 border border-slate-700/80">
              <h4 className="font-bold text-teal-300 mb-1.5 flex items-center gap-1.5 text-sm">
                <FiLock className="w-4 h-4 text-teal-400 shrink-0" />
                Role-Isolated Workspaces
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Strict backend RBAC ensures patients, doctors, pharmacies, and admins access only permitted clinical records.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-800/50 border border-slate-700/80">
              <h4 className="font-bold text-teal-300 mb-1.5 flex items-center gap-1.5 text-sm">
                <FiActivity className="w-4 h-4 text-teal-400 shrink-0" />
                Server-Side Authoritative Pricing
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Medicine prices and GST taxes are computed server-side from official licensed pharmacy catalogs.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-800/50 border border-slate-700/80">
              <h4 className="font-bold text-teal-300 mb-1.5 flex items-center gap-1.5 text-sm">
                <FiPackage className="w-4 h-4 text-teal-400 shrink-0" />
                Verified Pharmacy Inventory
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Prescriptions route directly to registered pharmacy partners for authentic stock reservation and packaging.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-800/50 border border-slate-700/80">
              <h4 className="font-bold text-teal-300 mb-1.5 flex items-center gap-1.5 text-sm">
                <FiClock className="w-4 h-4 text-teal-400 shrink-0" />
                Non-Alarmist 5-Day Alerts
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Proactive refill reminders trigger precisely when 5 days of medicine remain to prevent therapy interruption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. ROLE-BASED PLATFORM WORKSPACES
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">
              Role-Based Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              One Ecosystem. Dedicated Portals.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Every participant operates within an authenticated, role-isolated workspace designed for clinical safety and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Patient Portal */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60 mb-3.5">
                  <FiHeart className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Patients</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-5">
                  <li>• Certified doctor appointments</li>
                  <li>• Digital prescription vault</li>
                  <li>• Authentic medicine orders</li>
                  <li>• Proactive refill reminders</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleRolePortalClick("patient")}
                className="w-full text-center text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
              >
                Patient Portal
              </button>
            </div>

            {/* Doctor Portal */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60 mb-3.5">
                  <FiUserCheck className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Doctors</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-5">
                  <li>• Longitudinal medical records</li>
                  <li>• Consultation queue & notes</li>
                  <li>• Structured e-prescription issuance</li>
                  <li>• Clinical decision support</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleRolePortalClick("doctor")}
                className="w-full text-center text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
              >
                Doctor Portal
              </button>
            </div>

            {/* Pharmacy Portal */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60 mb-3.5">
                  <FiPackage className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Pharmacies</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-5">
                  <li>• Prescription validation</li>
                  <li>• Real-time dispensing queue</li>
                  <li>• Batch & stock inventory controls</li>
                  <li>• Order fulfillment workflow</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleRolePortalClick("pharmacy")}
                className="w-full text-center text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
              >
                Pharmacy Portal
              </button>
            </div>

            {/* Admin Portal */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-subtle transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200/60 mb-3.5">
                  <FiShield className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Administrators</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-5">
                  <li>• Platform governance & audit logs</li>
                  <li>• Directory & role permissions</li>
                  <li>• System health telemetry</li>
                  <li>• Operational compliance controls</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleRolePortalClick("admin")}
                className="w-full text-center text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
              >
                Admin Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. NEED HELP & FAQS
          ========================================================================= */}
      <section id="help" className="py-10 sm:py-14 bg-slate-50 border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-7">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 mb-1">
              <FiHelpCircle className="w-3.5 h-3.5" />
              <span>Assistance & Guidance</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Need Help With Your Care Journey?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Straightforward guidance for appointments, prescription verification, and medicine delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-subtle">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                How do digital prescriptions work?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Following your doctor consultation, an official digital prescription is saved to your
                secure patient vault and can be used directly for pharmacy orders.
              </p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-subtle">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                Can I order medicines without a prescription?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Over-the-counter (OTC) health essentials can be ordered directly. Prescription-only
                medicines strictly require an approved digital prescription.
              </p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-subtle">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                How does refill tracking work?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                TriMedi calculates your prescribed duration against purchased supplies, notifying
                you when 5 days or fewer remain so you can reorder without gap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          11. FINAL CALL TO ACTION BANNER (HIGH-CONTRAST & RESTRAINED HEIGHT)
          ========================================================================= */}
      <section className="py-12 sm:py-14 lg:py-[72px] bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white border-t border-brand-950 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Start Your Connected Healthcare Journey With TriMedi
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl mx-auto leading-relaxed font-normal">
            Consult verified doctors, manage prescriptions, track treatment adherence, and reorder
            supplies with zero interruptions.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-2">
            {/* Primary High-Contrast CTA */}
            <button
              type="button"
              onClick={handleConsultDoctor}
              className="inline-flex items-center justify-center gap-2 min-h-[46px] px-7 py-3 rounded-xl font-bold text-sm transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-900 cursor-pointer hover:bg-teal-50"
              style={{ color: "#044D46", backgroundColor: "#FFFFFF" }}
            >
              <span style={{ color: "#044D46" }}>Consult a Doctor</span>
              <FiArrowRight className="w-4 h-4 shrink-0" style={{ color: "#044D46" }} />
            </button>

            {/* Secondary High-Contrast CTA */}
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="inline-flex items-center justify-center gap-2 min-h-[46px] px-7 py-3 rounded-xl font-bold text-sm bg-transparent transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-900 cursor-pointer hover:bg-white/10"
              style={{
                color: "#FFFFFF",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(255, 255, 255, 0.45)",
              }}
            >
              <span style={{ color: "#FFFFFF" }}>Browse Medicines</span>
            </button>
          </div>
        </div>
      </section>

      {/* 12. GLOBAL CLINICAL LIGHT FOOTER */}
      <Footer />
    </div>
  );
}

export default Landing;
