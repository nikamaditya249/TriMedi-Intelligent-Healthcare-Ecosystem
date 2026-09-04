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
import Badge from "./ui/Badge";
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
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center shadow-xs">
            <FiActivity className="w-4 h-4" />
          </div>
          <span className="tracking-tight">
            Tri<span className="text-brand-600">Medi</span>
          </span>
        </Link>

        {/* Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              placeholder="Search prescription medicines, healthcare products..."
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-transparent focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors hidden sm:block"
          >
            Medicine Catalog
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <FiShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="bg-brand-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User / Auth Action */}
          {isAuthenticated && user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <Avatar name={user.name} role={activeRole} size="sm" />
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{activeRole}</p>
                </div>
                <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1">
                      <Badge variant={activeRole} size="sm">
                        {activeRole.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to={`/app/${activeRole}/dashboard`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FiGrid className="w-4 h-4 text-brand-600" />
                      <span>{activeRole.toUpperCase()} Dashboard</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FiUser className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        navigate("/auth");
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
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