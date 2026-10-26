import React from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiShield, FiLock, FiCheckCircle, FiHelpCircle } from "react-icons/fi";

export function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Column 1 — TriMedi Brand */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-white">
              <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-subtle border border-brand-800">
                <FiActivity className="w-4 h-4" />
              </div>
              <span className="tracking-tight text-white font-extrabold">
                Tri<span className="text-brand-400">Medi</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connected healthcare ecosystem for patients, certified doctors, and licensed pharmacies.
            </p>
            <div className="pt-2 space-y-1.5 text-[11px] text-slate-400">
              <p className="flex items-center gap-1.5 text-slate-300">
                <FiCheckCircle className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>Doctor-Controlled Clinical Care</span>
              </p>
              <p className="flex items-center gap-1.5 text-slate-300">
                <FiShield className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>Authentic Pharmacy Network</span>
              </p>
              <p className="flex items-center gap-1.5 text-slate-300">
                <FiLock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>Server-Authoritative Pricing</span>
              </p>
            </div>
          </div>

          {/* Column 2 — Healthcare */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Healthcare
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Medicines & Essentials
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Consult a Doctor
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Digital Prescriptions
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("journey")}
                  className="hover:text-white transition-colors text-left"
                >
                  Medication Tracking
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("refill-intelligence")}
                  className="hover:text-white transition-colors text-left"
                >
                  Refill Intelligence
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("about")}
                  className="hover:text-white transition-colors text-left"
                >
                  About TriMedi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("differentiators")}
                  className="hover:text-white transition-colors text-left"
                >
                  Why We Are Different
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("prescription-flow")}
                  className="hover:text-white transition-colors text-left"
                >
                  Pharmacy Network
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-white transition-colors text-left"
                >
                  Clinical Governance
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4 — Policies & Disclaimers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Policies
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy Policy & Data Security
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-white transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-white transition-colors text-left"
                >
                  Medical Disclaimer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-white transition-colors text-left"
                >
                  Role-Based Access Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5 — Need Help? */}
          <div id="footer-help">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Need Help?
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("help")}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                >
                  <FiHelpCircle className="w-3.5 h-3.5 text-brand-400" />
                  <span>Help & Inquiries Center</span>
                </button>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Order Status & Cart
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("prescription-flow")}
                  className="hover:text-white transition-colors text-left"
                >
                  Prescription Upload Guidance
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("help")}
                  className="hover:text-white transition-colors text-left"
                >
                  Pharmacy Dispensing Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 border-t border-slate-900 text-xs text-slate-500 space-y-3">
          <p className="leading-relaxed text-[11px] text-slate-400 max-w-4xl">
            Healthcare information and AI-assisted features do not replace professional medical advice. Healthcare decisions remain with qualified healthcare professionals. Prescription medicines are dispensed exclusively upon verification of a valid digital or uploaded prescription by a licensed pharmacist.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <p className="text-slate-500 font-medium">
              © 2026 TriMedi Healthcare Ecosystem. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 text-slate-400 text-xs">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/products" className="hover:text-white transition-colors">Medicines</Link>
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;