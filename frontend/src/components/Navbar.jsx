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
} from "react-icons/fi";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";

export function Navbar({ search = "", setSearch = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [] } = useCart() || {};
  const { user, activeRole, logout, isAuthenticated } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const dropdownRef = useRef(null);

  const cartCount = cart.reduce((total, item) => total + (item.qty || 1), 0);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(localSearch);
    if (location.pathname !== "/products") {
      navigate("/products");
    }
  };

  const handleConsultClick = () => {
    setMobileMenuOpen(false);
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
      {/* Main Single Centered Container (Matches content grid width & alignment exactly) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 xl:gap-8">
          
          {/* 1. LEFT: Logo & Mobile Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
              aria-label="Toggle mobile menu"
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
            >
              <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-subtle border border-brand-800 shrink-0">
                <FiActivity className="w-4 h-4" />
              </div>
              <span className="shrink-0">
                Tri<span className="text-brand-700">Medi</span>
              </span>
            </Link>
          </div>

          {/* 2. SEARCH BAR: Immediately after the logo with a clean gap */}
          <div className="hidden lg:block flex-1 max-w-xs xl:max-w-sm">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setSearch(e.target.value);
                }}
                placeholder="Search medicines, health products..."
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder-slate-400 pl-10 pr-16 py-2 rounded-lg text-xs sm:text-sm border border-slate-200 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded-md transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* 3. NAVIGATION LINKS: Vertically centered, sharing the same baseline */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-semibold text-slate-700 shrink-0">
            <Link
              to="/products"
              className="hover:text-brand-700 transition-colors py-1 leading-none"
            >
              Medicines
            </Link>

            <button
              type="button"
              onClick={handleConsultClick}
              className="hover:text-brand-700 transition-colors py-1 leading-none"
            >
              Consult Doctor
            </button>

            <button
              type="button"
              onClick={() => handleSectionScroll("offers")}
              className="hover:text-brand-700 transition-colors py-1 leading-none flex items-center gap-1"
            >
              <FiPercent className="w-3.5 h-3.5 text-brand-700" />
              <span>Offers</span>
            </button>

            <Link
              to="/cart"
              className="relative py-1 rounded-lg text-slate-700 hover:text-brand-700 transition-colors flex items-center gap-1.5 leading-none"
              aria-label="Shopping Cart"
            >
              <FiShoppingBag className="w-4 h-4 text-slate-700" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-brand-700 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-subtle ml-0.5">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => handleSectionScroll("help")}
              className="hover:text-brand-700 transition-colors py-1 leading-none flex items-center gap-1 text-slate-600"
            >
              <FiHelpCircle className="w-4 h-4 text-slate-400" />
              <span>Need Help?</span>
            </button>
          </nav>

          {/* 4. RIGHT SIDE: AUTHENTICATION ACTIONS */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {isAuthenticated && user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
                  aria-expanded={userDropdownOpen}
                >
                  <Avatar name={user.name} size="sm" />
                  <div className="text-left max-w-[120px]">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user.name}</p>
                    <p className="text-[10px] text-brand-700 font-semibold capitalize truncate">
                      {activeRole}
                    </p>
                  </div>
                  <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1.5 z-50">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-brand-50 text-brand-800 rounded">
                        {activeRole} portal
                      </span>
                    </div>

                    <div className="py-1">
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
                        <span>Account Profile</span>
                      </Link>
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
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Login
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="text-xs font-bold px-3.5 py-1.5 shadow-subtle"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* MOBILE CONTROLS (Hidden on desktop) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Shopping Cart"
            >
              <FiShoppingBag className="w-5 h-5 text-slate-800" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-700 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate(`/app/${activeRole}/dashboard`)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Go to workspace"
              >
                <Avatar name={user?.name || "User"} size="xs" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="px-2.5 py-1 text-xs font-bold bg-brand-50 text-brand-800 border border-brand-200 rounded-md"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Row (Always visible on mobile) */}
        <div className="pb-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setSearch(e.target.value);
              }}
              placeholder="Search medicines, health products..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder-slate-400 pl-9 pr-16 py-2 rounded-lg text-xs sm:text-sm border border-slate-200 focus:border-brand-700 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-700 text-white text-xs font-semibold rounded transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-50 p-6 flex flex-col justify-between">
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
                  onClick={handleConsultClick}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Consult Doctor</span>
                  <span className="text-xs font-normal text-slate-400">Appointments</span>
                </button>

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
              </nav>
            </div>

            {/* Drawer Bottom Auth */}
            <div className="pt-6 border-t border-slate-200">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <Avatar name={user.name} size="sm" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{activeRole} Portal</p>
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
                    Open Workspace
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