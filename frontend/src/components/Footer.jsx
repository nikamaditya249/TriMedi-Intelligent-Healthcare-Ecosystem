import React from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiShield, FiLock, FiCheckCircle } from "react-icons/fi";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-white">
              <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-subtle border border-brand-800">
                <FiActivity className="w-4 h-4" />
              </div>
              <span className="tracking-tight">
                Tri<span className="text-brand-300">Medi</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Intelligent healthcare ecosystem uniting patients, doctors, digital prescriptions, authentic pharmacy dispensing, and smart refill gap tracking.
            </p>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Platform Workspaces
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
                  System Governance Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinical Capabilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Clinical Capabilities
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Digital E-Prescriptions</li>
              <li>Medication Duration Intelligence</li>
              <li>Proactive Refill Gap Alerts</li>
              <li>Authoritative Pharmacy Catalog</li>
              <li>Real-Time Doctor Consultation</li>
            </ul>
          </div>

          {/* Security & Reliability */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Security & Standards
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2 text-slate-300">
                <FiCheckCircle className="w-3.5 h-3.5 text-brand-400" />
                <span>Role-Based Identity Isolation</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <FiLock className="w-3.5 h-3.5 text-brand-400" />
                <span>Cryptographic JWT Verification</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <FiShield className="w-3.5 h-3.5 text-brand-400" />
                <span>Authoritative Server Pricing</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 TriMedi Healthcare Ecosystem. Production Foundation Verified.</p>
          <div className="flex gap-4 text-slate-400">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/products" className="hover:text-white">Medicines</Link>
            <Link to="/auth" className="hover:text-white">Authentication</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;