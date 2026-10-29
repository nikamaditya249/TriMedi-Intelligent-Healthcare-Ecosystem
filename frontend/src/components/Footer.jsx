import React from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiShield, FiLock, FiCheckCircle, FiHelpCircle } from "react-icons/fi";

export function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-10">
          {/* Column 1 — TriMedi Brand */}
          <div className="lg:col-span-1 space-y-3.5">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 group">
              <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-subtle transition-transform group-hover:scale-105">
                <FiActivity className="w-4 h-4 text-white" />
              </div>
              <span className="tracking-tight text-slate-900 font-extrabold text-base">
                Tri<span className="text-brand-700">Medi</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connected healthcare ecosystem simplifying doctor consultations, digital prescriptions, pharmacy dispensing, and refill tracking.
            </p>
            <div className="pt-1.5 space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span className="font-medium text-slate-700">Doctor-Controlled Care</span>
              </p>
              <p className="flex items-center gap-1.5">
                <FiShield className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span className="font-medium text-slate-700">Authentic Pharmacy Network</span>
              </p>
              <p className="flex items-center gap-1.5">
                <FiLock className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span className="font-medium text-slate-700">Authoritative Pricing & GST</span>
              </p>
            </div>
          </div>

          {/* Column 2 — Healthcare */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Healthcare
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/products" className="hover:text-brand-700 transition-colors">
                  Medicines Catalog
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-700 transition-colors">
                  Consult a Doctor
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-700 transition-colors">
                  Digital Prescriptions
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("care-loop")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Medication Tracking
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("care-loop")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Refill Intelligence
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("care-loop")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  About TriMedi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("care-loop")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Connected Care Journey
                </button>
              </li>
              <li>
                <Link to="/products" className="hover:text-brand-700 transition-colors">
                  Pharmacy Network
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Clinical Governance
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4 — Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Policies
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Privacy Policy & Data Security
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Medical Disclaimer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("safety")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Role-Based Access Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5 — Need Help? */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Need Help?
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("help")}
                  className="hover:text-brand-700 transition-colors text-left flex items-center gap-1.5"
                >
                  <FiHelpCircle className="w-3.5 h-3.5 text-brand-700" />
                  <span>Help Center & FAQs</span>
                </button>
              </li>
              <li>
                <Link to="/cart" className="hover:text-brand-700 transition-colors">
                  Order Status & Cart
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("help")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Prescription Guidance
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("help")}
                  className="hover:text-brand-700 transition-colors text-left"
                >
                  Pharmacy Dispensing Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-3">
          <p className="leading-relaxed text-[11px] text-slate-500 max-w-4xl">
            Healthcare information and assistive features do not replace professional medical advice. Medical decisions remain with qualified healthcare professionals. Prescription medicines are dispensed exclusively upon verification of a valid digital prescription by a licensed pharmacist.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <p className="text-slate-600 font-medium text-xs">
              © 2026 TriMedi Healthcare Ecosystem. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 text-slate-600 text-xs font-medium">
              <Link to="/" className="hover:text-brand-700 transition-colors">Home</Link>
              <Link to="/products" className="hover:text-brand-700 transition-colors">Medicines</Link>
              <Link to="/login" className="hover:text-brand-700 transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-brand-700 transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
