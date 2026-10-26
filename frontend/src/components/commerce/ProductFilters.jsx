import { useMemo } from "react";

/**
 * TriMedi Standard Healthcare Commerce Filters Sidebar & Mobile Drawer
 */
export default function ProductFilters({
  availableSubcategories = [],
  availableBrands = [],
  selectedSubcategory,
  onSelectSubcategory,
  selectedBrand,
  onSelectBrand,
  prescriptionFilter, // 'all', 'otc', 'rx'
  onSelectPrescription,
  priceRange, // 'all', 'under100', '100to300', '300to700', 'above700'
  onSelectPriceRange,
  inStockOnly,
  onToggleInStockOnly,
  onResetFilters,
  totalResults = 0,
}) {
  const hasActiveFilters =
    selectedSubcategory !== "All" ||
    selectedBrand !== "All" ||
    prescriptionFilter !== "all" ||
    priceRange !== "all" ||
    inStockOnly;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6">
      {/* FILTER HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Filters
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalResults} items found
          </p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      {/* AVAILABILITY TOGGLE */}
      <div>
        <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStockOnly(e.target.checked)}
            className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-500"
          />
          <span>Exclude Out of Stock</span>
        </label>
      </div>

      {/* PRESCRIPTION REQUIREMENT */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Prescription Type
        </h3>
        <div className="space-y-1.5 text-xs sm:text-sm">
          {[
            { id: "all", label: "All Items" },
            { id: "otc", label: "OTC Only (No Rx)" },
            { id: "rx", label: "Prescription Required (Rx)" },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 text-slate-700 cursor-pointer"
            >
              <input
                type="radio"
                name="prescriptionFilter"
                checked={prescriptionFilter === item.id}
                onChange={() => onSelectPrescription(item.id)}
                className="w-4 h-4 text-teal-700 border-slate-300 focus:ring-teal-500"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* SUBCATEGORIES */}
      {availableSubcategories.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
            Categories
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs sm:text-sm scrollbar-thin">
            <button
              type="button"
              onClick={() => onSelectSubcategory("All")}
              className={`w-full text-left py-1 px-2 rounded font-medium transition-colors ${
                selectedSubcategory === "All"
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              All Categories
            </button>
            {availableSubcategories.map((subcat) => (
              <button
                key={subcat}
                type="button"
                onClick={() => onSelectSubcategory(subcat)}
                className={`w-full text-left py-1 px-2 rounded transition-colors truncate ${
                  selectedSubcategory === subcat
                    ? "bg-teal-50 text-teal-800 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {subcat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BRANDS */}
      {availableBrands.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
            Brands
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs sm:text-sm scrollbar-thin">
            <button
              type="button"
              onClick={() => onSelectBrand("All")}
              className={`w-full text-left py-1 px-2 rounded font-medium transition-colors ${
                selectedBrand === "All"
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              All Brands
            </button>
            {availableBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => onSelectBrand(brand)}
                className={`w-full text-left py-1 px-2 rounded transition-colors truncate ${
                  selectedBrand === brand
                    ? "bg-teal-50 text-teal-800 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PRICE RANGE */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Price Range
        </h3>
        <div className="space-y-1.5 text-xs sm:text-sm">
          {[
            { id: "all", label: "All Prices" },
            { id: "under100", label: "Under ₹100" },
            { id: "100to300", label: "₹100 to ₹300" },
            { id: "300to700", label: "₹300 to ₹700" },
            { id: "above700", label: "Above ₹700" },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 text-slate-700 cursor-pointer"
            >
              <input
                type="radio"
                name="priceRange"
                checked={priceRange === item.id}
                onChange={() => onSelectPriceRange(item.id)}
                className="w-4 h-4 text-teal-700 border-slate-300 focus:ring-teal-500"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
