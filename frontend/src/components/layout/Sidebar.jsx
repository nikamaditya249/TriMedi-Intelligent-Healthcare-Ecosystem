import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiUserCheck,
  FiFileText,
  FiPackage,
  FiShoppingBag,
  FiMessageSquare,
  FiUser,
  FiCalendar,
  FiUsers,
  FiLayers,
  FiSettings,
  FiLogOut,
  FiActivity,
  FiHeart,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import Badge from "../ui/Badge";

export function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRole, logout, switchDemoRole } = useAuth();

  // Role navigations config
  const navConfigs = {
    patient: [
      { name: "Dashboard", path: "/app/patient/dashboard", icon: FiGrid },
      { name: "Consultation Chat", path: "/app/chat", icon: FiMessageSquare, badge: "Live" },
      { name: "My Doctors", path: "/app/patient/doctors", icon: FiUserCheck },
      { name: "Prescriptions", path: "/app/patient/prescriptions", icon: FiFileText, badge: "Active" },
      { name: "Medicines", path: "/products", icon: FiPackage },
      { name: "Orders & Refills", path: "/app/patient/orders", icon: FiShoppingBag },
      { name: "Health Profile", path: "/profile", icon: FiUser },
    ],
    doctor: [
      { name: "Dashboard", path: "/app/doctor/dashboard", icon: FiGrid },
      { name: "Patient Chat", path: "/app/chat", icon: FiMessageSquare, badge: "Real-time" },
      { name: "My Patients", path: "/app/doctor/patients", icon: FiUsers },
      { name: "Digital Prescriptions", path: "/app/doctor/prescriptions", icon: FiFileText },
      { name: "Appointments", path: "/app/doctor/appointments", icon: FiCalendar, badge: "Schedule" },
      { name: "Doctor Profile", path: "/profile", icon: FiUser },
    ],
    pharmacy: [
      { name: "Dashboard", path: "/app/pharmacy/dashboard", icon: FiGrid },
      { name: "Fulfillment Orders", path: "/app/pharmacy/orders", icon: FiShoppingBag, badge: "Live" },
      { name: "Medicine Catalog", path: "/products", icon: FiPackage },
      { name: "Inventory", path: "/app/pharmacy/inventory", icon: FiLayers },
      { name: "Patient Records", path: "/app/pharmacy/patients", icon: FiUsers },
      { name: "Pharmacy Profile", path: "/profile", icon: FiUser },
    ],
    admin: [
      { name: "Dashboard", path: "/app/admin/dashboard", icon: FiGrid },
      { name: "User Directory", path: "/app/admin/users", icon: FiUsers },
      { name: "Doctors", path: "/app/admin/doctors", icon: FiUserCheck },
      { name: "Patients", path: "/app/admin/patients", icon: FiHeart },
      { name: "Orders & Refills", path: "/app/admin/orders", icon: FiShoppingBag },
      { name: "Medicines & Stock", path: "/products", icon: FiPackage },
      { name: "System Management", path: "/app/admin/system", icon: FiSettings },
    ],
  };

  const navItems = navConfigs[activeRole] || navConfigs.patient;

  const roleColors = {
    patient: "bg-sky-50 text-sky-700 border-sky-200",
    doctor: "bg-teal-50 text-teal-700 border-teal-200",
    pharmacy: "bg-purple-50 text-purple-700 border-purple-200",
    admin: "bg-slate-100 text-slate-800 border-slate-300",
  };

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-white"
              onClick={handleNavClick}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white flex items-center justify-center shadow-xs">
                <FiActivity className="w-4 h-4" />
              </div>
              <span className="tracking-tight">
                Tri<span className="text-teal-600">Medi</span>
              </span>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 lg:hidden"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Active Role Indicator */}
          <div className="p-4 mx-3 my-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  roleColors[activeRole] || roleColors.patient
                }`}
              >
                {activeRole}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
              {user?.name || "TriMedi User"}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-teal-200/70 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions & Switch Role helper */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="mb-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Switch Workspace (Role Preview)
            </label>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {["patient", "doctor", "pharmacy", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchDemoRole(r);
                    navigate(`/app/${r}/dashboard`);
                    handleNavClick();
                  }}
                  className={`px-2 py-1 rounded-lg font-medium capitalize text-left transition-colors ${
                    activeRole === r
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/auth");
              handleNavClick();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors mt-2"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
