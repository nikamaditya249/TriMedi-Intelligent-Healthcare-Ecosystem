import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  FiActivity,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiGrid,
  FiChevronDown,
  FiChevronRight,
  FiMenu,
  FiX,
  FiHelpCircle,
  FiPercent,
  FiMapPin,
  FiFileText,
  FiClock,
  FiCheck,
  FiShield,
  FiHeart,
  FiBox,
} from "react-icons/fi";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";

const POPULAR_CITIES = [
  "Pune",
  "Mumbai",
  "Bengaluru",
  "Delhi NCR",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
];

// Row 3 Category Definitions & Subcategories
const ROW_3_CATEGORIES = [
  {
    id: "medicines",
    label: "Medicines",
    items: [
      { label: "All Medicines", to: "/products/medicines", desc: "Complete pharmacy catalog" },
      { label: "Prescription Medicines", to: "/products/medicines?prescription=rx", desc: "Doctor Rx authorization required", badge: "Rx" },
      { label: "Over-the-Counter (OTC)", to: "/products/medicines?prescription=otc", desc: "Everyday acute care & analgesics", badge: "OTC" },
      { label: "Generic Formulations", to: "/products/medicines", desc: "Affordable active salts" },
    ],
  },
  {
    id: "wellness",
    label: "Wellness",
    items: [
      { label: "Vitamins & Supplements", to: "/products/wellness", desc: "Daily micronutrients" },
      { label: "Immunity Boosters", to: "/products/concern/immunity", desc: "Antioxidants & herbals" },
      { label: "Nutritional Energy", to: "/products/category/fitness-nutrition", desc: "Electrolytes & hydration" },
      { label: "Daily Multivitamins", to: "/products/wellness", desc: "Men & women multivitamins" },
    ],
  },
  {
    id: "personalCare",
    label: "Personal Care",
    items: [
      { label: "Skin Care & Sunscreens", to: "/products/personal-care", desc: "Cleansers & SPF protection" },
      { label: "Hair Care & Shampoos", to: "/products/personal-care", desc: "Anti-dandruff & nourishment" },
      { label: "Oral Care & Pastes", to: "/products/personal-care", desc: "Sensitivity & hygiene" },
      { label: "Hygiene & Antiseptics", to: "/products/personal-care", desc: "Medical disinfectant liquids" },
    ],
  },
  {
    id: "diabetes",
    label: "Diabetes Care",
    items: [
      { label: "Diabetes Medicines", to: "/products/concern/diabetes-care", desc: "Glycemic control drugs" },
      { label: "Blood Glucose Monitors", to: "/products/devices", desc: "Digital glucometers" },
      { label: "Test Strips & Lancets", to: "/products/concern/diabetes-care", desc: "Capillary test refills" },
      { label: "Sugar Substitutes", to: "/products/concern/diabetes-care", desc: "Zero calorie pellets" },
    ],
  },
  {
    id: "devices",
    label: "Healthcare Devices",
    items: [
      { label: "BP Monitors", to: "/products/devices", desc: "Automatic digital monitors" },
      { label: "Pulse Oximeters", to: "/products/devices", desc: "SpO2 & pulse rate sensors" },
      { label: "Digital Thermometers", to: "/products/devices", desc: "Flexible rapid fever check" },
      { label: "Nebulizers & Vaporizers", to: "/products/devices", desc: "Respiratory compressor units" },
    ],
  },
  {
    id: "fitness",
    label: "Fitness & Nutrition",
    items: [
      { label: "Whey Protein", to: "/products/category/fitness-nutrition", desc: "Isolate & concentrate" },
      { label: "Creatine & Strength", to: "/products/category/fitness-nutrition", desc: "Micronized cellular ATP" },
      { label: "Electrolytes & Energy", to: "/products/category/fitness-nutrition", desc: "Fast hydration powders" },
      { label: "Nutritional Spreads", to: "/products/category/fitness-nutrition", desc: "All-natural peanut butter" },
    ],
  },
  {
    id: "sexualWellness",
    label: "Sexual Wellness",
    items: [
      { label: "Intimate Care & Hygiene", to: "/products/personal-care", desc: "pH balanced wellness" },
      { label: "Vitality Supplements", to: "/products/wellness", desc: "Herbal vitality formulas" },
    ],
  },
  {
    id: "more",
    label: "More",
    items: [
      { label: "Ayurvedic Care", to: "/products/category/ayurvedic", desc: "Natural herbal formulations" },
      { label: "Baby & Infant Care", to: "/products/category/baby-care", desc: "Gentle baby washes & diapers" },
      { label: "Pain Relief Sprays & Gels", to: "/products/category/pain-relief", desc: "Topical analgesics" },
      { label: "All Categories Directory →", to: "/products/categories", desc: "Explore complete category catalog" },
    ],
  },
];

export function Navbar({ search = "", setSearch = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [] } = useCart() || {};
  const { user, activeRole, logout, isAuthenticated } = useAuth();

  // Navigation states
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null); // 'categories' | 'primary' | null
  const [localSearch, setLocalSearch] = useState(search);
  const [customCityInput, setCustomCityInput] = useState("");

  // Row 3 Category Dropdown state
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState(null);

  // Persisted Location
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem("trimedi_location") || "Pune";
  });

  const userDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const row3NavRef = useRef(null);
  const categoryCloseTimeoutRef = useRef(null);

  const cartCount = cart.reduce((total, item) => total + (item.qty || 1), 0);

  // Sync search with prop and URL parameter on /products
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search") || params.get("q");
    if (location.pathname.startsWith("/products") && query !== null) {
      setLocalSearch(query);
    } else if (!location.pathname.startsWith("/products")) {
      setLocalSearch(search || "");
    }
  }, [location.pathname, location.search, search]);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handler = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setLocationDropdownOpen(false);
      }
      if (row3NavRef.current && !row3NavRef.current.contains(e.target)) {
        setActiveCategoryDropdown(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setUserDropdownOpen(false);
        setLocationDropdownOpen(false);
        setActiveCategoryDropdown(null);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close mobile drawer and dropdowns on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveCategoryDropdown(null);
    setUserDropdownOpen(false);
    setLocationDropdownOpen(false);
  }, [location.pathname]);

  // Row 3 Category Hover Handlers with intentional 160ms transition buffer
  const handleCategoryMouseEnter = useCallback((catId) => {
    if (categoryCloseTimeoutRef.current) {
      clearTimeout(categoryCloseTimeoutRef.current);
      categoryCloseTimeoutRef.current = null;
    }
    setActiveCategoryDropdown(catId);
  }, []);

  const handleCategoryMouseLeave = useCallback(() => {
    categoryCloseTimeoutRef.current = setTimeout(() => {
      setActiveCategoryDropdown(null);
    }, 160);
  }, []);

  const handleLocationSelect = (city) => {
    const cleanCity = city.trim();
    if (!cleanCity) return;
    setSelectedLocation(cleanCity);
    localStorage.setItem("trimedi_location", cleanCity);
    setLocationDropdownOpen(false);
    setCustomCityInput("");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = localSearch.trim();
    setSearch(query);
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  const handleConsultDoctorClick = () => {
    setMobileMenuOpen(false);
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/app/patient/doctors" } } });
    } else if (activeRole === "patient") {
      navigate("/app/patient/doctors");
    } else if (activeRole === "doctor") {
      navigate("/app/doctor/dashboard");
    } else {
      navigate(`/app/${activeRole}/dashboard`);
    }
  };

  const handleLabReportsClick = () => {
    setMobileMenuOpen(false);
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: "/app/patient/dashboard?tab=medical_record" } },
      });
    } else if (activeRole === "patient") {
      navigate("/app/patient/dashboard?tab=medical_record");
    } else {
      navigate(`/app/${activeRole}/dashboard`);
    }
  };

  const handleHealthRecordsClick = () => {
    setMobileMenuOpen(false);
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: "/app/patient/dashboard?tab=medical_record" } },
      });
    } else if (activeRole === "patient") {
      navigate("/app/patient/dashboard?tab=medical_record");
    } else {
      navigate(`/app/${activeRole}/dashboard`);
    }
  };

  const handleOrdersClick = () => {
    setMobileMenuOpen(false);
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/app/patient/orders" } } });
    } else if (activeRole === "patient") {
      navigate("/app/patient/orders");
    } else {
      navigate(`/app/${activeRole}/dashboard`);
    }
  };

  const handleSectionScroll = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname === "/") {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    navigate(`/#${sectionId}`);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm">
      {/* =========================================================================
          ROW 1: PRIMARY HEALTHCARE NAVIGATION & COMMERCE BAR (RESTORED)
          ========================================================================= */}
      <div className="bg-white border-b border-slate-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between h-16 gap-4 xl:gap-8">
            {/* 1.1 LEFT: Logo & Mobile Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-700"
                aria-label="Toggle navigation drawer"
              >
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>

              <Link
                to="/"
                onClick={() => {
                  if (location.pathname === "/") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900 tracking-tight"
                aria-label="TriMedi Healthcare Home"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-sm border border-teal-800 shrink-0">
                  <FiActivity className="w-4 h-4" />
                </div>
                <span className="shrink-0 font-extrabold tracking-tight">
                  Tri<span className="text-teal-700">Medi</span>
                </span>
              </Link>
            </div>

            {/* 1.2 CENTER: Primary Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-semibold text-slate-700 shrink-0">
              <Link
                to="/products"
                className={`py-1 leading-none transition-colors border-b-2 ${
                  location.pathname === "/products" || location.pathname.startsWith("/products/medicines")
                    ? "text-teal-700 font-bold border-teal-700"
                    : "text-slate-700 hover:text-teal-700 border-transparent"
                }`}
              >
                Medicines
              </Link>

              <button
                type="button"
                onClick={handleLabReportsClick}
                className="hover:text-teal-700 transition-colors py-1 leading-none text-slate-700 focus:outline-none"
              >
                Lab Reports
              </button>

              <button
                type="button"
                onClick={handleConsultDoctorClick}
                className="hover:text-teal-700 transition-colors py-1 leading-none text-slate-700 focus:outline-none"
              >
                Consult Doctor
              </button>

              <button
                type="button"
                onClick={handleHealthRecordsClick}
                className="hover:text-teal-700 transition-colors py-1 leading-none text-slate-700 focus:outline-none"
              >
                Health Records
              </button>

              <button
                type="button"
                onClick={() => handleSectionScroll("offers")}
                className="hover:text-teal-700 transition-colors py-1 leading-none flex items-center gap-1 text-slate-600 focus:outline-none"
              >
                <FiPercent className="w-3.5 h-3.5 text-teal-700" />
                <span>Offers</span>
              </button>
            </nav>

            {/* 1.3 RIGHT: Commerce Cart, Help & Account State */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {/* Shopping Cart Link */}
              <Link
                to="/cart"
                className="relative py-1.5 px-2.5 rounded-lg text-slate-700 hover:text-teal-700 hover:bg-slate-50 transition-colors flex items-center gap-2 leading-none"
                aria-label={`Shopping Cart with ${cartCount} items`}
              >
                <FiShoppingBag className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:inline text-xs font-bold text-slate-800">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-teal-700 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Need Help link */}
              <button
                type="button"
                onClick={() => handleSectionScroll("help")}
                className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors py-1"
              >
                <FiHelpCircle className="w-4 h-4 text-slate-400" />
                <span>Need Help?</span>
              </button>

              {/* Authentication Actions */}
              {isAuthenticated && user ? (
                /* Authenticated User Menu */
                <div ref={userDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700"
                    aria-expanded={userDropdownOpen}
                    aria-label="User Account Menu"
                  >
                    <Avatar name={user.name} size="sm" />
                    <div className="text-left hidden sm:block max-w-[120px]">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                        Hi, {user.name.split(" ")[0]}
                      </p>
                      <p className="text-[10px] text-teal-700 font-semibold capitalize truncate">
                        {activeRole ? `${activeRole} Portal` : "Patient Account"}
                      </p>
                    </div>
                    <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 capitalize">
                          {activeRole} portal
                        </span>
                      </div>

                      <div className="py-1">
                        {activeRole === "patient" ? (
                          <>
                            <Link
                              to="/app/patient/orders"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiShoppingBag className="w-4 h-4 text-slate-400" />
                              <span>My Orders</span>
                            </Link>
                            <Link
                              to="/app/patient/prescriptions"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiFileText className="w-4 h-4 text-slate-400" />
                              <span>Prescriptions</span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiUser className="w-4 h-4 text-slate-400" />
                              <span>Profile</span>
                            </Link>
                            <Link
                              to="/app/patient/dashboard"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-t border-slate-100 mt-1 pt-2"
                            >
                              <FiGrid className="w-4 h-4 text-teal-700" />
                              <span>Patient Dashboard</span>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to={`/app/${activeRole}/dashboard`}
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiGrid className="w-4 h-4 text-teal-700" />
                              <span>
                                {activeRole ? activeRole.charAt(0).toUpperCase() + activeRole.slice(1) : "Care"} Workspace
                              </span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiUser className="w-4 h-4 text-slate-400" />
                              <span>Profile</span>
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            navigate("/login");
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated Login / Sign Up Actions */
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                  >
                    Login
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/signup")}
                    className="text-xs font-bold px-3.5 py-1.5 shadow-sm rounded-lg bg-teal-700 hover:bg-teal-800 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: DEDICATED HEALTHCARE COMMERCE ROW (RESTORED)
          ========================================================================= */}
      <div className="bg-slate-50/90 border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5">
          <div className="flex items-center justify-between gap-4 sm:gap-6 xl:gap-8">
            {/* 2.1 LOCATION SELECTOR (India Delivery Location) */}
            <div className="relative shrink-0" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-800 font-medium transition-colors shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-700"
                aria-expanded={locationDropdownOpen}
                aria-label="Select delivery city"
              >
                <FiMapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="hidden md:inline text-slate-500 font-normal">Deliver to:</span>
                <span className="font-bold text-slate-900 truncate max-w-[110px]">
                  {selectedLocation}
                </span>
                <FiChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Location Popover Menu */}
              {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <FiMapPin className="w-3.5 h-3.5 text-teal-700" />
                      <span>Select Delivery City</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocationDropdownOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                      aria-label="Close location selector"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick City Pills */}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Popular Service Hubs
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleLocationSelect(city)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors flex items-center justify-between ${
                          selectedLocation === city
                            ? "bg-teal-50 text-teal-800 font-bold border border-teal-200"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100"
                        }`}
                      >
                        <span className="truncate">{city}</span>
                        {selectedLocation === city && (
                          <FiCheck className="w-3 h-3 text-teal-700 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Location Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleLocationSelect(customCityInput);
                    }}
                    className="pt-2 border-t border-slate-100 flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={customCityInput}
                      onChange={(e) => setCustomCityInput(e.target.value)}
                      placeholder="Enter other city..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-teal-700"
                    />
                    <button
                      type="submit"
                      disabled={!customCityInput.trim()}
                      className="px-2.5 py-1 bg-teal-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      Set
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 2.2 CENTER: PROMINENT WIDE SEARCH BAR */}
            <div className="flex-1 max-w-5xl 2xl:max-w-6xl">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search medicines, active salts, healthcare products..."
                  aria-label="Search medicines and healthcare products"
                  className="w-full bg-white text-slate-900 placeholder-slate-400 pl-10 pr-24 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 hover:border-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 focus:outline-none transition-all shadow-xs"
                />

                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch("");
                      setSearch("");
                      if (location.pathname === "/products") {
                        navigate("/products");
                      }
                    }}
                    className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label="Clear search input"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  Search
                </button>
              </form>
            </div>

            {/* 2.3 RIGHT: RESTRAINED HEALTHCARE QUICK ACTIONS (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0 text-xs font-semibold">
              {isAuthenticated && activeRole === "patient" ? (
                <>
                  <button
                    type="button"
                    onClick={handleOrdersClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-xs"
                  >
                    <FiShoppingBag className="w-3.5 h-3.5 text-teal-700" />
                    <span>My Orders</span>
                  </button>
                  <Link
                    to="/app/patient/prescriptions"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-xs"
                  >
                    <FiFileText className="w-3.5 h-3.5 text-teal-700" />
                    <span>Prescriptions</span>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleOrdersClick}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-teal-700 transition-colors py-1"
                  >
                    <FiClock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Track Order</span>
                  </button>
                  <Link
                    to="/products"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-teal-700 hover:bg-teal-50/50 transition-colors shadow-xs font-bold"
                  >
                    <span>Browse All</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: NEW HORIZONTAL CATEGORY NAVIGATION WITH CONTEXTUAL DROPDOWNS
          ========================================================================= */}
      <div className="hidden lg:block bg-white border-b border-slate-200" ref={row3NavRef}>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            {ROW_3_CATEGORIES.map((cat) => {
              const isOpen = activeCategoryDropdown === cat.id;

              return (
                <div
                  key={cat.id}
                  className="relative py-2.5"
                  onMouseEnter={() => handleCategoryMouseEnter(cat.id)}
                  onMouseLeave={handleCategoryMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCategoryDropdown((prev) => (prev === cat.id ? null : cat.id))
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors leading-none select-none ${
                      isOpen
                        ? "text-teal-700 bg-teal-50 font-bold"
                        : "text-slate-700 hover:text-teal-700 hover:bg-slate-50"
                    }`}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                  >
                    <span>{cat.label}</span>
                    <FiChevronDown
                      className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-teal-700" : ""
                      }`}
                    />
                  </button>

                  {/* CONTEXTUAL DROPDOWN MENU */}
                  {isOpen && (
                    <div
                      className={`absolute top-full pt-1 w-72 z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                        cat.id === "more" || cat.id === "sexualWellness" ? "right-0" : "left-0"
                      }`}
                      onMouseEnter={() => handleCategoryMouseEnter(cat.id)}
                      onMouseLeave={handleCategoryMouseLeave}
                    >
                      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2.5">
                        <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                            {cat.label} Categories
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          {cat.items.map((subItem, idx) => (
                            <Link
                              key={idx}
                              to={subItem.to}
                              onClick={() => setActiveCategoryDropdown(null)}
                              className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-teal-50 hover:text-teal-900 transition-colors group"
                            >
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 group-hover:text-teal-900 block leading-tight text-xs">
                                    {subItem.label}
                                  </span>
                                  {subItem.badge && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                        subItem.badge === "Rx"
                                          ? "bg-amber-50 text-amber-800 border-amber-200"
                                          : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      {subItem.badge}
                                    </span>
                                  )}
                                </div>
                                {subItem.desc && (
                                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                    {subItem.desc}
                                  </span>
                                )}
                              </div>
                              <FiChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE SLIDE-OUT NAVIGATION DRAWER (With Category Accordion)
          ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-50 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <Link
                  to="/"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (location.pathname === "/") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="flex items-center gap-2 font-extrabold text-slate-900"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                    <FiActivity className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    Tri<span className="text-teal-700">Medi</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Location Selector Block */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Delivery Location
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FiMapPin className="w-3.5 h-3.5 text-teal-700" />
                    {selectedLocation}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIndex =
                        (POPULAR_CITIES.indexOf(selectedLocation) + 1) % POPULAR_CITIES.length;
                      handleLocationSelect(POPULAR_CITIES[nextIndex]);
                    }}
                    className="text-[11px] font-semibold text-teal-700 hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Mobile Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search medicines, devices..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </form>

              {/* PRIMARY NAV LINKS */}
              <nav className="space-y-1 text-sm font-semibold text-slate-800">
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Medicines</span>
                  <span className="text-xs font-normal text-slate-400">Shop</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLabReportsClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Lab Reports</span>
                  <span className="text-xs font-normal text-slate-400">Diagnostics</span>
                </button>

                <button
                  type="button"
                  onClick={handleConsultDoctorClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Consult Doctor</span>
                  <span className="text-xs font-normal text-slate-400">Appointments</span>
                </button>

                <button
                  type="button"
                  onClick={handleHealthRecordsClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Health Records</span>
                  <span className="text-xs font-normal text-slate-400">Ledger</span>
                </button>

                <button
                  type="button"
                  onClick={handleOrdersClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>My Orders</span>
                  <span className="text-xs font-normal text-slate-400">Track</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSectionScroll("offers")}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FiPercent className="w-4 h-4 text-teal-700" />
                    Offers & Benefits
                  </span>
                </button>

                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FiShoppingBag className="w-4 h-4 text-teal-700" />
                    Cart
                  </span>
                  {cartCount > 0 && (
                    <span className="bg-teal-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {cartCount} items
                    </span>
                  )}
                </Link>

                {/* ROW 3 CATEGORIES ACCORDION FOR MOBILE */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileAccordion((prev) => (prev === "categories" ? null : "categories"))
                    }
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-teal-800 bg-teal-50 font-bold transition-colors"
                  >
                    <span>Categories & Departments</span>
                    <FiChevronDown
                      className={`w-4 h-4 text-teal-700 transition-transform ${
                        mobileAccordion === "categories" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobileAccordion === "categories" && (
                    <div className="pl-3 pr-2 py-2 space-y-2 text-xs bg-slate-50/70 rounded-lg mt-1 border border-slate-100">
                      {ROW_3_CATEGORIES.map((cat) => (
                        <div key={cat.id} className="border-b border-slate-200/60 pb-1.5 last:border-none">
                          <p className="font-bold text-slate-900 mb-1">{cat.label}</p>
                          <div className="space-y-1 pl-2">
                            {cat.items.map((sub, sIdx) => (
                              <Link
                                key={sIdx}
                                to={sub.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-0.5 text-slate-600 hover:text-teal-700"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Drawer Bottom Auth Actions */}
            <div className="pt-4 border-t border-slate-200 mt-4">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <Avatar name={user.name} size="sm" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {activeRole === "patient" ? "Patient" : `${activeRole} Portal`}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center text-xs bg-teal-700 hover:bg-teal-800 text-white"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(`/app/${activeRole}/dashboard`);
                    }}
                  >
                    {activeRole === "patient" ? "Patient Dashboard" : "Open Workspace"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg text-center transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center text-xs bg-teal-700 hover:bg-teal-800 text-white"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/signup");
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;