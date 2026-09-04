import React from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiShield, FiHeart, FiLock, FiCheckCircle } from "react-icons/fi";

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-white">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center shadow-xs">
                <FiActivity className="w-4 h-4" />
              </div>
              <span className="tracking-tight">
                Tri<span className="text-brand-400">Medi</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligent healthcare ecosystem connecting patients, doctors, digital prescriptions, medicine dispensing, and treatment tracking.
            </p>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Platform Ecosystem
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/app/patient/dashboard" className="hover:text-white transition-colors">
                  Patient Care Hub
                </Link>
              </li>
              <li>
                <Link to="/app/doctor/dashboard" className="hover:text-white transition-colors">
                  Doctor Clinical Portal
                </Link>
              </li>
              <li>
                <Link to="/app/pharmacy/dashboard" className="hover:text-white transition-colors">
                  Pharmacy Dispensing Network
                </Link>
              </li>
              <li>
                <Link to="/app/admin/dashboard" className="hover:text-white transition-colors">
                  System Governance
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Core Capabilities
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Digital Prescriptions</li>
              <li>Medication Duration Tracking</li>
              <li>Refill Gap Intelligence (Roadmap)</li>
              <li>Medicine Catalog & Orders</li>
            </ul>
          </div>

          {/* Trust & Architecture */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Security & Compliance
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-1.5 text-teal-400">
                <FiCheckCircle className="w-3.5 h-3.5" />
                <span>Role-Based Access Control</span>
              </p>
              <p className="flex items-center gap-1.5 text-teal-400">
                <FiLock className="w-3.5 h-3.5" />
                <span>Encrypted JWT Sessions</span>
              </p>
              <p className="flex items-center gap-1.5 text-teal-400">
                <FiShield className="w-3.5 h-3.5" />
                <span>Phase 1 Architecture Verified</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 TriMedi Connected Healthcare. Phase 1 Foundation Active.</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-slate-300">Home</Link>
            <Link to="/products" className="hover:text-slate-300">Medicines</Link>
            <Link to="/auth" className="hover:text-slate-300">Authentication</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;