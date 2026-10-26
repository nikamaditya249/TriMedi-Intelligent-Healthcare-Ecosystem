import { Link } from "react-router-dom";
import Breadcrumbs from "../../components/commerce/Breadcrumbs";
import { HEALTH_CONCERNS } from "../../data/commerceData";
import { handleImageError } from "../../data/imageManifest";

export default function HealthConcernsExplorer() {
  const breadcrumbItems = [
    { label: "Products", to: "/products" },
    { label: "Health Concerns" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* BREADCRUMB */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* HEADER HERO */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-3">
            <i className="bx bx-pulse text-sm"></i>
            <span>Targeted Health Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Shop by Health Concerns
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
            Find medicines, daily monitoring devices, supplements and verified
            care pathways tailored to specific wellness requirements.
          </p>

          {/* Clinical Disclaimer */}
          <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200 flex items-center gap-2 max-w-2xl">
            <i className="bx bx-info-circle text-teal-700 text-base flex-shrink-0"></i>
            <span>
              <strong>Clinical Note:</strong> Discovery categories assist navigation and education. TriMedi enforces licensed doctor authorization on all prescription medications.
            </span>
          </div>
        </div>
      </div>

      {/* HEALTH CONCERNS GRID */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {HEALTH_CONCERNS.map((concern) => {
            const slug = concern.id
              .replace(/([A-Z])/g, "-$1")
              .toLowerCase()
              .replace(/^-/, "");

            return (
              <Link
                key={concern.id}
                to={`/products/concern/${slug}`}
                className="group bg-white rounded-xl border border-slate-200/90 overflow-hidden hover:border-teal-500/50 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* IMAGE CONTAINER */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={concern.image}
                    alt={concern.title}
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-900/80 text-white backdrop-blur-sm border border-teal-700/40">
                      {concern.tag}
                    </span>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {concern.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2">
                      {concern.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:text-teal-900">
                    <span>Explore Products</span>
                    <i className="bx bx-right-arrow-alt text-lg group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
