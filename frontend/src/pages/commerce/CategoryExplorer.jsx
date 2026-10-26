import { Link } from "react-router-dom";
import Breadcrumbs from "../../components/commerce/Breadcrumbs";
import { SHOP_BY_CATEGORY } from "../../data/commerceData";
import { handleImageError } from "../../data/imageManifest";

export default function CategoryExplorer() {
  const breadcrumbItems = [
    { label: "Products", to: "/products" },
    { label: "Categories" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* BREADCRUMB */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* HEADER HERO */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-3">
            <i className="bx bx-grid-alt text-sm"></i>
            <span>Browse Complete Healthcare Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            All Healthcare Categories
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
            Explore authentic medicines, clinically validated monitoring devices,
            personal wellness, and specialized care essentials.
          </p>
        </div>
      </div>

      {/* CATEGORIES GRID */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {SHOP_BY_CATEGORY.map((cat) => {
            const destination =
              cat.id === "medicines"
                ? "/products/medicines"
                : cat.id === "devices"
                ? "/products/devices"
                : cat.id === "personalCare"
                ? "/products/personal-care"
                : cat.id === "vitamins"
                ? "/products/wellness"
                : `/products/category/${cat.id}`;

            return (
              <Link
                key={cat.id}
                to={destination}
                className="group bg-white rounded-xl border border-slate-200/90 overflow-hidden hover:border-teal-500/50 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* IMAGE CONTAINER (Consistent aspect ratio) */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm border border-white/20">
                      Authentic Catalog
                    </span>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {cat.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:text-teal-900">
                    <span>Explore Category</span>
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
