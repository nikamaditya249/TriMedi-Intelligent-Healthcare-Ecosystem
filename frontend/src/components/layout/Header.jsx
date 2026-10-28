import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiSearch,
  FiBell,
  FiUser,
  FiLogOut,
  FiShoppingBag,
  FiChevronDown,
  FiMessageSquare,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import NotificationCenterModal from "../notifications/NotificationCenterModal";
import Avatar from "../ui/Avatar";

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
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
        {/* Left section: Mobile toggle + Global Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Open sidebar"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          <div className="relative w-full hidden sm:block">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search prescriptions, medicines, appointments..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 pl-9 pr-3.5 py-1.5 rounded-lg text-xs sm:text-sm border border-slate-200 focus:border-brand-700 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Right section: Real-time Gateway status, links, notifications & profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Socket.IO status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <span>{isConnected ? "Live Network" : "Reconnecting"}</span>
          </div>

          {/* Quick Chat Link */}
          <Link
            to="/app/chat"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Consultation Chat"
          >
            <FiMessageSquare className="w-4 h-4" />
          </Link>

          {/* Medicine Store Quick Link - Patient Commerce Only */}
          {activeRole === "patient" && (
            <Link
              to="/products"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <FiShoppingBag className="w-3.5 h-3.5 text-slate-500" />
              <span>Medicine Store</span>
            </Link>
          )}

          {/* Notifications Button */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
            title="Healthcare Notifications"
            aria-label="View notifications"
          >
            <FiBell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 min-w-3.5 h-3.5 px-1 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <Avatar name={user?.name || "Aditya"} size="sm" />
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || "Aditya Nikam"}
                </p>
                <p className="text-[10px] text-slate-500 capitalize">{activeRole || "Patient"}</p>
              </div>
              <FiChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-dropdown py-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || "Aditya Nikam"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || "patient@trimedi.health"}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                    {activeRole}
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <FiUser className="w-3.5 h-3.5 text-slate-400" />
                  <span>Your Profile</span>
                </Link>

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <FiLogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </>
  );
}

export default Header;
