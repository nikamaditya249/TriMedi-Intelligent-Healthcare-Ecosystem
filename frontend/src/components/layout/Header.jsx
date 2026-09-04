import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiSearch,
  FiBell,
  FiUser,
  FiLogOut,
  FiShoppingBag,
  FiShield,
  FiChevronDown,
  FiMessageSquare,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import NotificationCenterModal from "../notifications/NotificationCenterModal";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

export function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, activeRole, logout } = useAuth();
  const { unreadNotifCount, isConnected } = useSocket();

  const [profileOpen, setProfileOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
        {/* Left section: Mobile toggle + Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          <div className="relative w-full hidden sm:block">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search prescriptions, medicines, doctors..."
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-transparent focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right section: Chat + Medicine Store + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Gateway status indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>{isConnected ? "Live Real-Time" : "Connecting"}</span>
          </div>

          {/* Chat Quick Link */}
          <Link
            to="/app/chat"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Doctor-Patient Consultation Chat"
          >
            <FiMessageSquare className="w-5 h-5" />
          </Link>

          {/* Medicine Store Quick Link */}
          <Link
            to="/products"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <FiShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Medicine Store</span>
          </Link>

          {/* Notifications Button */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            title="Healthcare Notifications"
          >
            <FiBell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              <Avatar name={user?.name || "User"} role={activeRole} size="sm" />
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.name || "Aditya Nikam"}
                </p>
                <p className="text-[10px] text-slate-500 capitalize">{activeRole}</p>
              </div>
              <FiChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || "User"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || "patient@trimedi.com"}</p>
                  <div className="mt-1.5">
                    <Badge variant={activeRole} size="sm">
                      {activeRole.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/app/chat"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <FiMessageSquare className="w-4 h-4 text-slate-400" />
                    <span>Consultation Chat</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <FiUser className="w-4 h-4 text-slate-400" />
                    <span>Profile & Health Settings</span>
                  </Link>

                  <Link
                    to="/"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <FiShield className="w-4 h-4 text-slate-400" />
                    <span>Public Landing Page</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      navigate("/auth");
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Real-time Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </>
  );
}

export default Header;
