import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "react-icons/fi";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";

export function Navbar({ search = "", setSearch = () => {} }) {
  const navigate = useNavigate();
  const { cart = [] } = useCart() || {};
  const { user, activeRole, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const cartCount = cart.reduce((total, item) => total + (item.qty || 1), 0);

  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-subtle border border-brand-800">
            <FiActivity className="w-4 h-4" />
          </div>
          <span className="tracking-tight text-slate-900">
            Tri<span className="text-brand-700">Medi</span>
          </span>
        </Link>

        {/* Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              placeholder="Search prescription medicines, health essentials..."
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 pl-9 pr-3.5 py-1.5 rounded-lg text-xs sm:text-sm border border-slate-200 focus:border-brand-700 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Right Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-700 transition-colors hidden sm:block"
          >
            Medicine Catalog
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            aria-label="Shopping Cart"
          >
            <FiShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="bg-brand-700 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User / Auth Action */}
          {isAuthenticated && user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <Avatar name={user.name} size="sm" />
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{activeRole}</p>
                </div>
                <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1.5 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
                      {activeRole}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to={`/app/${activeRole}/dashboard`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <FiGrid className="w-4 h-4 text-brand-700" />
                      <span>{activeRole ? activeRole.charAt(0).toUpperCase() + activeRole.slice(1) : "Care"} Workspace</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <FiUser className="w-4 h-4 text-slate-400" />
                      <span>Account Profile</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        navigate("/auth");
                        setOpen(false);
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
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/auth?mode=login")}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;