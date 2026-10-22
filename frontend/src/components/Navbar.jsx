import React, { useState, useRef, useEffect } from "react";
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
  FiMenu,
  FiX,
  FiHelpCircle,
  FiPercent,
  FiMapPin,
  FiFileText,
  FiClock,
  FiCheck,
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

export function Navbar({ search = "", setSearch = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [] } = useCart() || {};
  const { user, activeRole, logout, isAuthenticated } = useAuth();

  // Navigation states
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const [customCityInput, setCustomCityInput] = useState("");

  // Persisted Location
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem("trimedi_location") || "Pune";
  });

  const userDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  const cartCount = cart.reduce((total, item) => total + (item.qty || 1), 0);

  // Sync search with prop and URL parameter on /products
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search");
    if (location.pathname === "/products" && query !== null) {
      setLocalSearch(query);
    } else if (location.pathname !== "/products") {
      setLocalSearch(search || "");
    }
  }, [location.pathname, location.search, search]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-subtle">
      {/* =========================================================================
          ROW 1: PRIMARY HEALTHCARE NAVIGATION & COMMERCE BAR
          ========================================================================= */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4 xl:gap-8">
            
            {/* 1.1 LEFT: Logo & Mobile Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
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
                <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-subtle border border-brand-800 shrink-0">
                  <FiActivity className="w-4 h-4" />
                </div>
                <span className="shrink-0 font-extrabold tracking-tight">
                  Tri<span className="text-brand-700">Medi</span>
                </span>
              </Link>
            </div>

            {/* 1.2 CENTER: Primary Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-semibold text-slate-700 shrink-0">
              <Link
                to="/products"
                className={`py-1 leading-none transition-colors border-b-2 ${
                  location.pathname === "/products"
                    ? "text-brand-700 font-bold border-brand-700"
                    : "text-slate-700 hover:text-brand-700 border-transparent"
                }`}
              >
                Medicines
              </Link>

              <button
                type="button"
                onClick={handleLabReportsClick}
                className="hover:text-brand-700 transition-colors py-1 leading-none text-slate-700 focus:outline-none"
              >
                Lab Reports
              </button>

              <button
                type="button"
                onClick={handleConsultDoctorClick}
                className="hover:text-brand-700 transition-colors py-1 leading-none text-slate-700 focus:outline-none"
              >
                Consult Doctor
              </button>

              <button
                type="button"
                onClick={handleHealthRecordsClick}
                className="hover:text-brand-700 transition-colors py-1 leading-none text-slate-700 focus:outline-none"
              >
                Health Records
              </button>

              <button
                type="button"
                onClick={() => handleSectionScroll("offers")}
                className="hover:text-brand-700 transition-colors py-1 leading-none flex items-center gap-1 text-slate-600 focus:outline-none"
              >
                <FiPercent className="w-3.5 h-3.5 text-brand-700" />
                <span>Offers</span>
              </button>
            </nav>

            {/* 1.3 RIGHT: Commerce Cart, Help & Account State */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {/* Shopping Cart Link */}
              <Link
                to="/cart"
                className="relative py-1.5 px-2.5 rounded-lg text-slate-700 hover:text-brand-700 hover:bg-slate-50 transition-colors flex items-center gap-2 leading-none"
                aria-label={`Shopping Cart with ${cartCount} items`}
              >
                <FiShoppingBag className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:inline text-xs font-bold text-slate-800">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-brand-700 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-subtle">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Need Help link */}
              <button
                type="button"
                onClick={() => handleSectionScroll("help")}
                className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-700 transition-colors py-1"
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
                    className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700"
                    aria-expanded={userDropdownOpen}
                    aria-label="User Account Menu"
                  >
                    <Avatar name={user.name} size="sm" />
                    <div className="text-left hidden sm:block max-w-[120px]">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                        Hi, {user.name.split(" ")[0]}
                      </p>
                      <p className="text-[10px] text-brand-700 font-semibold capitalize truncate">
                        {activeRole === "patient" ? "Patient" : (activeRole || "Patient")}
                      </p>
                    </div>
                    <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1.5 z-50">
                      <div className="px-3.5 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-brand-50 text-brand-800 rounded">
                          {activeRole} access
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
                              <FiShoppingBag className="w-4 h-4 text-brand-700" />
                              <span>My Orders</span>
                            </Link>
                            <Link
                              to="/app/patient/prescriptions"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiFileText className="w-4 h-4 text-brand-700" />
                              <span>My Prescriptions</span>
                            </Link>
                            <Link
                              to="/app/patient/dashboard?tab=medical_record"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiActivity className="w-4 h-4 text-brand-700" />
                              <span>Health Records</span>
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
                              <FiGrid className="w-4 h-4 text-slate-500" />
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
                              <FiGrid className="w-4 h-4 text-brand-700" />
                              <span>
                                {activeRole
                                  ? activeRole.charAt(0).toUpperCase() + activeRole.slice(1)
                                  : "Care"}{" "}
                                Workspace
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
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                  >
                    Login
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/signup")}
                    className="text-xs font-bold px-3.5 py-1.5 shadow-subtle rounded-lg"
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
          ROW 2: DEDICATED HEALTHCARE COMMERCE ROW (LOCATION + PROMINENT SEARCH)
          ========================================================================= */}
      <div className="bg-slate-50/90 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-4 sm:gap-6 xl:gap-8">
            
            {/* 2.1 LOCATION SELECTOR (India Delivery Location) */}
            <div className="relative shrink-0" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-800 font-medium transition-colors shadow-subtle focus:outline-none focus:ring-1 focus:ring-brand-700"
                aria-expanded={locationDropdownOpen}
                aria-label="Select delivery city"
              >
                <FiMapPin className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span className="hidden md:inline text-slate-500 font-normal">Deliver to:</span>
                <span className="font-bold text-slate-900 truncate max-w-[110px]">
                  {selectedLocation}
                </span>
                <FiChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Location Popover Menu */}
              {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-dropdown border border-slate-200 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <FiMapPin className="w-3.5 h-3.5 text-brand-700" />
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
                            ? "bg-brand-50 text-brand-800 font-bold border border-brand-200"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100"
                        }`}
                      >
                        <span className="truncate">{city}</span>
                        {selectedLocation === city && (
                          <FiCheck className="w-3 h-3 text-brand-700 shrink-0 ml-1" />
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
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-brand-700"
                    />
                    <button
                      type="submit"
                      disabled={!customCityInput.trim()}
                      className="px-2.5 py-1 bg-brand-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      Set
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 2.2 CENTER: PROMINENT WIDE SEARCH BAR */}
            <div className="flex-1 max-w-4xl 2xl:max-w-5xl">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                  }}
                  placeholder="Search medicines, active salts, healthcare products..."
                  aria-label="Search medicines and healthcare products"
                  className="w-full bg-white text-slate-900 placeholder-slate-400 pl-10 pr-24 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 hover:border-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 focus:outline-none transition-all shadow-subtle"
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
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-subtle"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:text-brand-700 hover:border-brand-200 transition-colors shadow-subtle"
                  >
                    <FiShoppingBag className="w-3.5 h-3.5 text-brand-700" />
                    <span>My Orders</span>
                  </button>
                  <Link
                    to="/app/patient/prescriptions"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:text-brand-700 hover:border-brand-200 transition-colors shadow-subtle"
                  >
                    <FiFileText className="w-3.5 h-3.5 text-brand-700" />
                    <span>Prescriptions</span>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleOrdersClick}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-brand-700 transition-colors py-1"
                  >
                    <FiClock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Track Order</span>
                  </button>
                  <Link
                    to="/products"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-brand-700 hover:bg-brand-50/50 transition-colors shadow-subtle font-bold"
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
          MOBILE SLIDE-OUT NAVIGATION DRAWER
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
            <div className="space-y-6">
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
                  <div className="w-7 h-7 rounded-lg bg-brand-700 text-white flex items-center justify-center">
                    <FiActivity className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    Tri<span className="text-brand-700">Medi</span>
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
                    <FiMapPin className="w-3.5 h-3.5 text-brand-700" />
                    {selectedLocation}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIndex =
                        (POPULAR_CITIES.indexOf(selectedLocation) + 1) % POPULAR_CITIES.length;
                      handleLocationSelect(POPULAR_CITIES[nextIndex]);
                    }}
                    className="text-[11px] font-semibold text-brand-700 hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1 text-sm font-semibold text-slate-800">
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Medicines Catalog</span>
                  <span className="text-xs font-normal text-slate-400">Shop</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLabReportsClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Lab Reports</span>
                  <span className="text-xs font-normal text-slate-400">Diagnostics</span>
                </button>

                <button
                  type="button"
                  onClick={handleConsultDoctorClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Consult Doctor</span>
                  <span className="text-xs font-normal text-slate-400">Appointments</span>
                </button>

                <button
                  type="button"
                  onClick={handleHealthRecordsClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Health Records</span>
                  <span className="text-xs font-normal text-slate-400">Ledger</span>
                </button>

                <button
                  type="button"
                  onClick={handleOrdersClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>My Orders</span>
                  <span className="text-xs font-normal text-slate-400">Track</span>
                </button>

                {isAuthenticated && activeRole === "patient" && (
                  <Link
                    to="/app/patient/prescriptions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span>Prescriptions</span>
                    <span className="text-xs font-normal text-slate-400">Rx</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => handleSectionScroll("offers")}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FiPercent className="w-4 h-4 text-brand-700" />
                    Offers & Benefits
                  </span>
                </button>

                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FiShoppingBag className="w-4 h-4 text-brand-700" />
                    Cart
                  </span>
                  {cartCount > 0 && (
                    <span className="bg-brand-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {cartCount} items
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => handleSectionScroll("help")}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FiHelpCircle className="w-4 h-4 text-slate-400" />
                    Need Help?
                  </span>
                </button>

                {isAuthenticated && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FiUser className="w-4 h-4 text-slate-400" />
                      Account Profile
                    </span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Drawer Bottom Auth Actions */}
            <div className="pt-6 border-t border-slate-200 mt-6">
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
                    className="w-full justify-center text-xs"
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
                    className="w-full justify-center text-xs"
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