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
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRole, logout } = useAuth();

  // Role-isolated navigation configuration: Each role sees only its own product workspace
  const navConfigs = {
    patient: [
      { name: "Care Overview", path: "/app/patient/dashboard", icon: FiGrid },
      { name: "Appointments", path: "/app/patient/appointments", icon: FiCalendar },
      { name: "Consultation Chat", path: "/app/chat", icon: FiMessageSquare, badge: "Live" },
      { name: "My Doctors", path: "/app/patient/doctors", icon: FiUserCheck },
      { name: "Prescriptions", path: "/app/patient/prescriptions", icon: FiFileText },
      { name: "Medicine Catalog", path: "/products", icon: FiPackage },
      { name: "Orders & Refills", path: "/app/patient/orders", icon: FiShoppingBag },
      { name: "Profile & Account", path: "/profile", icon: FiUser },
    ],
    doctor: [
      { name: "Clinical Hub", path: "/app/doctor/dashboard", icon: FiGrid },
      { name: "My Patients", path: "/app/doctor/patients", icon: FiUsers },
      { name: "Patient Chat", path: "/app/chat", icon: FiMessageSquare, badge: "Live" },
      { name: "Digital Prescriptions", path: "/app/doctor/prescriptions", icon: FiFileText },
      { name: "Appointments", path: "/app/doctor/appointments", icon: FiCalendar },
      { name: "Clinical Profile", path: "/profile", icon: FiUser },
    ],
    pharmacy: [
      { name: "Dispensing Hub", path: "/app/pharmacy/dashboard", icon: FiGrid },
      { name: "Fulfillment Orders", path: "/app/pharmacy/orders", icon: FiShoppingBag, badge: "Queue" },
      { name: "Stock Inventory", path: "/app/pharmacy/inventory", icon: FiLayers },
      { name: "Dispensing Records", path: "/app/pharmacy/patients", icon: FiUsers },
      { name: "Pharmacy Profile", path: "/profile", icon: FiUser },
    ],
    admin: [
      { name: "Governance Center", path: "/app/admin/dashboard", icon: FiGrid },
      { name: "User Directory", path: "/app/admin/users", icon: FiUsers },
      { name: "Doctor Registry", path: "/app/admin/doctors", icon: FiUserCheck },
      { name: "Patient Registry", path: "/app/admin/patients", icon: FiHeart },
      { name: "Fulfillment Orders", path: "/app/admin/orders", icon: FiShoppingBag },
      { name: "System Management", path: "/app/admin/system", icon: FiSettings },
      { name: "Admin Profile", path: "/profile", icon: FiUser },
    ],
    reception: [
      { name: "Reception Hub", path: "/app/reception/dashboard", icon: FiGrid },
      { name: "Live Clinic Queue", path: "/app/reception/queue", icon: FiClock, badge: "Live" },
      { name: "Appointments Desk", path: "/app/reception/appointments", icon: FiCalendar },
      { name: "Patient Check-In", path: "/app/reception/patients", icon: FiUsers },
      { name: "Reception Profile", path: "/profile", icon: FiUser },
    ],
  };

  const navItems = navConfigs[activeRole] || navConfigs.patient;

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  const roleLabels = {
    patient: "Patient",
    doctor: "Attending Physician",
    pharmacy: "Central Pharmacy",
    reception: "Clinic Reception",
    admin: "Platform Administrator",
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            <Link
              to={`/app/${activeRole}/dashboard`}
              className="flex items-center gap-2.5 font-bold text-lg text-slate-900"
              onClick={handleNavClick}
            >
              <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-subtle border border-brand-800">
                <FiActivity className="w-4 h-4" />
              </div>
              <span className="tracking-tight text-slate-900">
                Tri<span className="text-brand-700">Medi</span>
              </span>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Close sidebar"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Authenticated User Account Card */}
          <div className="p-3 mx-3 my-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-800 flex items-center justify-center font-bold text-xs shrink-0">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || "Healthcare Account"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {roleLabels[activeRole] || "Patient"}
              </p>
            </div>
          </div>

          {/* Role-Specific Navigation */}
          <nav className="px-3 space-y-0.5 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-brand-50 text-brand-800 font-semibold border-l-2 border-brand-700 pl-2.5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-brand-700" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? "bg-brand-100 text-brand-800"
                          : "bg-slate-100 text-slate-500"
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

        {/* Footer: Sign Out Only (Zero Role-Switching Mechanism) */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <button
            onClick={() => {
              logout();
              navigate("/login");
              handleNavClick();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
