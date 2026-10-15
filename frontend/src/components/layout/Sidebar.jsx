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

export function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRole, logout, switchDemoRole } = useAuth();

  // Role navigation configuration
  const navConfigs = {
    patient: [
      { name: "Care Overview", path: "/app/patient/dashboard", icon: FiGrid },
      { name: "Consultation Chat", path: "/app/chat", icon: FiMessageSquare, badge: "Live" },
      { name: "My Doctors", path: "/app/patient/doctors", icon: FiUserCheck },
      { name: "Prescriptions", path: "/app/patient/prescriptions", icon: FiFileText },
      { name: "Medicine Catalog", path: "/products", icon: FiPackage },
      { name: "Orders & Refills", path: "/app/patient/orders", icon: FiShoppingBag },
      { name: "Health Profile", path: "/profile", icon: FiUser },
    ],
    doctor: [
      { name: "Clinical Hub", path: "/app/doctor/dashboard", icon: FiGrid },
      { name: "Patient Chat", path: "/app/chat", icon: FiMessageSquare, badge: "Live" },
      { name: "My Patients", path: "/app/doctor/patients", icon: FiUsers },
      { name: "Digital Prescriptions", path: "/app/doctor/prescriptions", icon: FiFileText },
      { name: "Appointments", path: "/app/doctor/appointments", icon: FiCalendar },
      { name: "Clinical Profile", path: "/profile", icon: FiUser },
    ],
    pharmacy: [
      { name: "Dispensing Hub", path: "/app/pharmacy/dashboard", icon: FiGrid },
      { name: "Fulfillment Orders", path: "/app/pharmacy/orders", icon: FiShoppingBag, badge: "Queue" },
      { name: "Medicine Catalog", path: "/products", icon: FiPackage },
      { name: "Stock Inventory", path: "/app/pharmacy/inventory", icon: FiLayers },
      { name: "Patient Records", path: "/app/pharmacy/patients", icon: FiUsers },
      { name: "Pharmacy Profile", path: "/profile", icon: FiUser },
    ],
    admin: [
      { name: "Governance Center", path: "/app/admin/dashboard", icon: FiGrid },
      { name: "User Directory", path: "/app/admin/users", icon: FiUsers },
      { name: "Doctors", path: "/app/admin/doctors", icon: FiUserCheck },
      { name: "Patients", path: "/app/admin/patients", icon: FiHeart },
      { name: "Orders & Refills", path: "/app/admin/orders", icon: FiShoppingBag },
      { name: "Medicine Catalog", path: "/products", icon: FiPackage },
      { name: "System Management", path: "/app/admin/system", icon: FiSettings },
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
              to="/"
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

          {/* Active Workspace / Role Box */}
          <div className="p-3 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Role
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-brand-800">
                {activeRole}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.name || "Aditya Nikam"}
            </p>
          </div>

          {/* Nav Items */}
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

        {/* Footer actions & Switch Role helper */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-1">
              Switch Workspace (Role Preview)
            </span>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {["patient", "doctor", "reception", "pharmacy", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchDemoRole(r);
                    navigate(`/app/${r}/dashboard`);
                    handleNavClick();
                  }}
                  className={`px-2 py-1 rounded-md font-medium capitalize text-left text-[11px] transition-colors ${
                    activeRole === r
                      ? "bg-brand-700 text-white font-semibold shadow-subtle"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
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
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
