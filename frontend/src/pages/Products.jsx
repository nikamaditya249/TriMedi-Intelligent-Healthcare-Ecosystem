import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CommerceProductCard from "../components/commerce/CommerceProductCard";
import { getProducts } from "../api";
import {
  HEALTH_CONCERNS,
  FEATURED_BRANDS,
  HEALTHCARE_DEVICES,
  TRIMEDI_DIFFERENTIATORS,
  TRUST_SAFETY_POINTS,
} from "../data/commerceData";
import { imageManifest, handleImageError } from "../data/imageManifest";

/**
 * TriMedi Healthcare Commerce Discovery Homepage (/products)
 * - Progressive Disclosure (Max 10 sections, top 6 previews, dedicated routes for full catalogs)
 * - WCAG AA Contrast (Dark navy text #172033 on white/neutral, teal accents #00897B)
 * - Server-Authoritative Products & Authentic Backend Integration
 */
export default function Products({ search = "" }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // If user typed into the header search bar on this page, navigate to dedicated search page
  useEffect(() => {
    if (search && search.trim().length > 1) {
      navigate(`/products/search?q=${encodeURIComponent(search.trim())}`);
    }
  }, [search, navigate]);

  // Fetch authentic backend products
  useEffect(() => {
    getProducts()
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("Products fetch error:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter top 8-12 popular medicines for the homepage preview
  const popularMedicines = products.slice(0, 8);

  // Top 6 Health Concerns Preview
  const topConcerns = HEALTH_CONCERNS.slice(0, 6);

  // Top 6 Brands Preview
  const topBrands = FEATURED_BRANDS.slice(0, 6);

  // Top 4 Devices Preview
  const topDevices = HEALTHCARE_DEVICES.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* =========================================================================
          SECTION 2: CLEAN TWO-COLUMN HERO (High Contrast, No Pale Background Text)
          ========================================================================= */}
      <section className="bg-white border-b border-slate-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* LEFT COLUMN: Value Proposition & Clear CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-teal-50 text-teal-800 border border-teal-200">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                <span>Intelligent Healthcare Ecosystem</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Healthcare, connected around you.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Medicines, doctor consultations, digital prescriptions and
                intelligent medication support — all connected through TriMedi.
              </p>

              {/* ACTION CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/products/medicines"
                  className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base shadow-sm transition-all duration-200 flex items-center gap-2 active:scale-95"
                >
                  <i className="bx bx-capsule text-lg"></i>
                  <span>Shop Medicines</span>
                </Link>

                <Link
                  to="/app/patient/doctors"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 transition-all duration-200 flex items-center gap-2"
                >
                  <i className="bx bx-user-voice text-lg text-teal-700"></i>
                  <span>Consult a Doctor</span>
                </Link>
              </div>

              {/* TRUST BULLETS */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <i className="bx bx-check-circle text-teal-700 text-base"></i>
                  <span>Verified Pharmacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="bx bx-check-circle text-teal-700 text-base"></i>
                  <span>Digital Prescriptions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="bx bx-check-circle text-teal-700 text-base"></i>
                  <span>Medication Tracking</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Authentic Clinical Healthcare Imagery */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 h-64 sm:h-80 lg:h-96">
                <img
                  src={imageManifest.hero.consultation}
                  alt="Doctor and patient consultation in a modern clinical setting"
                  loading="eager"
                  decoding="async"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-900/80 backdrop-blur-sm border border-teal-600/40">
                    Verified Doctor Network
                  </span>
                  <p className="text-xs sm:text-sm font-medium mt-1.5 text-slate-100">
                    Consultations linked directly to digital prescription fulfillment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 4: POPULAR MEDICINES (8 Products + View All Medicines ->)
          ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-14 sm:pt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
              <span>Licensed Pharmacy Fulfillment</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Popular Medicines
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verified everyday medications and acute care essentials.
            </p>
          </div>
          <Link
            to="/products/medicines"
            className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1 group whitespace-nowrap"
          >
            <span>View All Medicines</span>
            <i className="bx bx-right-arrow-alt text-base group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-4 h-72 animate-pulse flex flex-col justify-between"
              >
                <div className="bg-slate-100 rounded h-40 w-full" />
                <div className="bg-slate-100 rounded h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {popularMedicines.map((product) => (
              <CommerceProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 5: SHOP BY HEALTH CONCERNS (Top 6 + View All Concerns ->)
          ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-14 sm:pt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Shop by Health Concerns
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find products and care options based on what you need support with.
            </p>
          </div>
          <Link
            to="/products/concerns"
            className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1 group whitespace-nowrap"
          >
            <span>View All Health Concerns</span>
            <i className="bx bx-right-arrow-alt text-base group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topConcerns.map((concern) => {
            const slug = concern.id
              .replace(/([A-Z])/g, "-$1")
              .toLowerCase()
              .replace(/^-/, "");

            return (
              <Link
                key={concern.id}
                to={`/products/concern/${slug}`}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-teal-500/50 hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={concern.image}
                    alt={concern.title}
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 text-center flex-1 flex flex-col justify-center">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                    {concern.title}
                  </h3>
                  <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {concern.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FEATURED BRANDS (Top 6 Brands + View All Brands ->)
          ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-14 sm:pt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Featured Brands
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Shop trusted healthcare and wellness manufacturers.
            </p>
          </div>
          <Link
            to="/products/brands"
            className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1 group whitespace-nowrap"
          >
            <span>View All Brands</span>
            <i className="bx bx-right-arrow-alt text-base group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topBrands.map((brand) => {
            const slug = brand.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");

            return (
              <Link
                key={brand.id}
                to={`/products/brand/${slug}`}
                className="group bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center text-center hover:border-teal-500/50 hover:shadow-md transition-all duration-200"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center overflow-hidden mb-2.5 group-hover:scale-105 transition-transform">
                  <img
                    src={brand.image}
                    alt={brand.name}
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate max-w-full">
                  {brand.name}
                </h3>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {brand.tag}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: HEALTHCARE DEVICES (Top 4 Cards + View All Devices ->)
          ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-14 sm:pt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Healthcare Devices
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Monitor your vitals accurately from the comfort of your home.
            </p>
          </div>
          <Link
            to="/products/devices"
            className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1 group whitespace-nowrap"
          >
            <span>View All Devices</span>
            <i className="bx bx-right-arrow-alt text-base group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {topDevices.map((device) => (
            <Link
              key={device.id}
              to="/products/devices"
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-teal-500/50 hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="h-44 w-full bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100">
                <img
                  src={device.image}
                  alt={device.name}
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {device.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {device.desc}
                  </p>
                </div>
                <span className="mt-3 text-xs font-semibold text-teal-700 group-hover:underline inline-flex items-center gap-1">
                  <span>Explore Devices</span>
                  <i className="bx bx-right-arrow-alt"></i>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: WHY TRIMEDI (4 Concise Differentiators)
          ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-16 sm:pt-20">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Connected Healthcare
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              More Than a Medicine Store
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              TriMedi brings doctor consultation, digital prescription, pharmacy
              dispensing, and intelligent refill reminders together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRIMEDI_DIFFERENTIATORS.map((diff) => (
              <div
                key={diff.id}
                className="p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center text-xl mb-4">
                    <i className={`bx ${diff.icon}`}></i>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {diff.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {diff.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: TRUST & SAFETY STRIP (5 Direct Guarantees)
          ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-12 sm:pt-14">
        <div className="border-t border-b border-slate-200 py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {TRUST_SAFETY_POINTS.map((trust) => (
            <div key={trust.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                <i className={`bx ${trust.icon}`}></i>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {trust.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  {trust.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: FOOTER
          ========================================================================= */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-10 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          TriMedi Intelligent Healthcare Ecosystem © {new Date().getFullYear()}
        </p>
        <p className="mt-1 text-[11px] text-slate-400 max-w-xl mx-auto">
          Licensed medical fulfillment under pharmaceutical oversight. Prescriptions require physician verification.
        </p>
      </footer>
    </div>
  );
}