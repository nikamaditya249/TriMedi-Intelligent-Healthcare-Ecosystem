import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useLocation, Link } from "react-router-dom";
import Breadcrumbs from "../../components/commerce/Breadcrumbs";
import CommerceProductCard from "../../components/commerce/CommerceProductCard";
import ProductFilters from "../../components/commerce/ProductFilters";
import { getProducts } from "../../api";

/**
 * Unified Healthcare Commerce Product Listing Engine
 * Powers:
 * - /products/category/:slug
 * - /products/concern/:slug
 * - /products/brand/:slug
 * - /products/medicines
 * - /products/devices
 * - /products/wellness
 * - /products/personal-care
 * - /products/search
 */
export default function ProductListingPage({ mode = "generic", search: globalSearch = "" }) {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // URL state
  const querySearch = searchParams.get("search") || searchParams.get("q") || "";
  const querySubcat = searchParams.get("subcategory") || "All";
  const queryBrand = searchParams.get("brand") || "All";
  const queryPrescription = searchParams.get("prescription") || "all";
  const queryPrice = searchParams.get("price") || "all";
  const querySort = searchParams.get("sort") || "featured";

  // Effective search
  const effectiveSearch = querySearch || globalSearch || "";

  // Filter states
  const [selectedSubcategory, setSelectedSubcategory] = useState(querySubcat);
  const [selectedBrand, setSelectedBrand] = useState(queryBrand);
  const [prescriptionFilter, setPrescriptionFilter] = useState(queryPrescription);
  const [priceRange, setPriceRange] = useState(queryPrice);
  const [sortBy, setSortBy] = useState(querySort);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Products data
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(16);

  // Sync state with URL params
  useEffect(() => {
    setSelectedSubcategory(querySubcat);
    setSelectedBrand(queryBrand);
    setPrescriptionFilter(queryPrescription);
    setPriceRange(queryPrice);
    setSortBy(querySort);
  }, [querySubcat, queryBrand, queryPrescription, queryPrice, querySort]);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    getProducts()
      .then((data) => {
        if (Array.isArray(data)) {
          setAllProducts(data);
        } else {
          setAllProducts([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load products:", err);
        setAllProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute Page Metadata (Title, Description, Category/Concern mapping)
  const meta = useMemo(() => {
    // Mode-specific defaults
    if (mode === "medicines") {
      return {
        title: "Prescription & OTC Medicines",
        subtitle:
          "Authentic pharmaceutical essentials dispensed by licensed pharmacists with doctor-controlled prescriptions.",
        categoryTarget: "Medicine",
        breadcrumbs: [
          { label: "Products", to: "/products" },
          { label: "Medicines" },
        ],
        icon: "bx-capsule",
        isClinical: true,
      };
    }
    if (mode === "devices") {
      return {
        title: "Healthcare Devices & Monitors",
        subtitle:
          "Clinically validated BP monitors, glucometers, oximeters, and diagnostic devices for home health tracking.",
        categoryTarget: "Medical Device",
        breadcrumbs: [
          { label: "Products", to: "/products" },
          { label: "Healthcare Devices" },
        ],
        icon: "bx-pulse",
      };
    }
    if (mode === "wellness") {
      return {
        title: "Wellness, Vitamins & Supplements",
        subtitle:
          "Multivitamins, nutrition, herbal formulations, and daily immunity boosters for whole-body vitality.",
        categoryTarget: "Wellness",
        breadcrumbs: [
          { label: "Products", to: "/products" },
          { label: "Wellness & Supplements" },
        ],
        icon: "bx-heart",
      };
    }
    if (mode === "personalCare") {
      return {
        title: "Personal Care & Hygiene",
        subtitle:
          "Dermatologist-tested skincare, gentle haircare, baby essentials, and daily hygiene products.",
        categoryTarget: "Personal Care",
        breadcrumbs: [
          { label: "Products", to: "/products" },
          { label: "Personal Care" },
        ],
        icon: "bx-spa",
      };
    }
    if (mode === "search") {
      return {
        title: effectiveSearch ? `Results for "${effectiveSearch}"` : "Search Products",
        subtitle: "Showing authentic medicines, health devices, and wellness essentials.",
        breadcrumbs: [
          { label: "Products", to: "/products" },
          { label: "Search Results" },
        ],
        icon: "bx-search",
      };
    }

    // Slug-based routing
    if (location.pathname.startsWith("/products/category")) {
      const cleanName = slug
        ? slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        : "Category";
      return {
        title: cleanName,
        subtitle: `Explore products and verified formulations under ${cleanName}.`,
        categoryTarget: cleanName,
        breadcrumbs: [
          { label: "Products", to: "/products" },
          { label: "Categories", to: "/products/categories" },
          { label: cleanName },
        ],
        icon: "bx-grid-alt",
      };
    }

    if (location.pathname.startsWith("/products/concern")) {
      const cleanName = slug
        ? slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        : "Health Concern";
      return {
        title: `${cleanName} Care`,
        subtitle: `Targeted healthcare products, monitoring devices, and care pathways for ${cleanName}.`,
        concernTarget: cleanName,
        breadcrumbs: [
          { label: "Products", to: "/products" },
          { label: "Health Concerns", to: "/products/concerns" },
          { label: cleanName },
        ],
        icon: "bx-shield-quarter",
        isClinical: true,
      };
    }

    if (location.pathname.startsWith("/products/brand")) {
      const cleanName = slug
        ? slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        : "Brand";
      return {
        title: cleanName,
        subtitle: `Authentic formulations and products manufactured by ${cleanName}.`,
        brandTarget: cleanName,
        breadcrumbs: [
          { label: "Products", to: "/products" },
          { label: "Featured Brands", to: "/products/brands" },
          { label: cleanName },
        ],
        icon: "bx-award",
      };
    }

    return {
      title: "All Products",
      subtitle: "Browse TriMedi's complete verified healthcare marketplace.",
      breadcrumbs: [{ label: "Products", to: "/products" }, { label: "Catalog" }],
      icon: "bx-store",
    };
  }, [mode, slug, effectiveSearch, location.pathname]);

  // 1. Base Domain Filtering (By Mode, Category slug, Concern slug, or Brand slug)
  const domainFilteredProducts = useMemo(() => {
    if (!Array.isArray(allProducts)) return [];

    return allProducts.filter((p) => {
      // Medicines mode
      if (mode === "medicines") {
        return (p.category || "").toLowerCase() === "medicine";
      }
      // Devices mode
      if (mode === "devices") {
        return (
          (p.category || "").toLowerCase() === "medical device" ||
          (p.subcategory || "").toLowerCase().includes("device") ||
          (p.dosageForm || "").toLowerCase() === "device"
        );
      }
      // Wellness mode
      if (mode === "wellness") {
        return (
          (p.category || "").toLowerCase() === "wellness" ||
          (p.category || "").toLowerCase() === "fitness" ||
          (p.category || "").toLowerCase() === "ayurvedic" ||
          (p.subcategory || "").toLowerCase().includes("vitamin")
        );
      }
      // Personal Care mode
      if (mode === "personalCare") {
        return (
          (p.category || "").toLowerCase() === "personal care" ||
          (p.category || "").toLowerCase() === "skin care" ||
          (p.category || "").toLowerCase() === "baby care"
        );
      }
      // Category slug
      if (meta.categoryTarget) {
        const catTarget = meta.categoryTarget.toLowerCase();
        return (
          (p.category || "").toLowerCase().includes(catTarget) ||
          (p.subcategory || "").toLowerCase().includes(catTarget)
        );
      }
      // Concern slug
      if (meta.concernTarget) {
        const concernTarget = meta.concernTarget.toLowerCase();
        return (
          (p.healthConcern || "").toLowerCase().includes(concernTarget) ||
          (p.subcategory || "").toLowerCase().includes(concernTarget) ||
          (p.name || "").toLowerCase().includes(concernTarget)
        );
      }
      // Brand slug
      if (meta.brandTarget) {
        const brandTarget = meta.brandTarget.toLowerCase();
        return (p.brand || "").toLowerCase().includes(brandTarget);
      }

      return true;
    });
  }, [allProducts, mode, meta]);

  // 2. Compute Available Subcategories & Brands from Domain Products
  const availableSubcategories = useMemo(() => {
    const set = new Set();
    domainFilteredProducts.forEach((p) => {
      if (p.subcategory && p.subcategory !== "General") {
        set.add(p.subcategory);
      }
    });
    return Array.from(set).sort();
  }, [domainFilteredProducts]);

  const availableBrands = useMemo(() => {
    const set = new Set();
    domainFilteredProducts.forEach((p) => {
      if (p.brand) {
        set.add(p.brand);
      }
    });
    return Array.from(set).sort();
  }, [domainFilteredProducts]);

  // 3. User Filter Application (Search, Subcategory, Brand, Prescription, Price, InStock)
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...domainFilteredProducts];

    // Search query
    if (effectiveSearch.trim()) {
      const q = effectiveSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.genericName && p.genericName.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.healthConcern && p.healthConcern.toLowerCase().includes(q))
      );
    }

    // Subcategory
    if (selectedSubcategory !== "All") {
      result = result.filter(
        (p) => (p.subcategory || "").toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }

    // Brand
    if (selectedBrand !== "All") {
      result = result.filter(
        (p) => (p.brand || "").toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    // Prescription filter
    if (prescriptionFilter === "rx") {
      result = result.filter((p) => p.prescriptionRequired === true);
    } else if (prescriptionFilter === "otc") {
      result = result.filter((p) => p.prescriptionRequired !== true);
    }

    // Price range filter
    if (priceRange === "under100") {
      result = result.filter((p) => Number(p.price) < 100);
    } else if (priceRange === "100to300") {
      result = result.filter((p) => Number(p.price) >= 100 && Number(p.price) <= 300);
    } else if (priceRange === "300to700") {
      result = result.filter((p) => Number(p.price) > 300 && Number(p.price) <= 700);
    } else if (priceRange === "above700") {
      result = result.filter((p) => Number(p.price) > 700);
    }

    // Exclude out of stock
    if (inStockOnly) {
      result = result.filter((p) => (p.availableQuantity || p.stockQuantity || 0) > 0);
    }

    // Sort order
    if (sortBy === "priceLow") {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "priceHigh") {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "discount") {
      result.sort((a, b) => {
        const discA = a.mrp > a.price ? (a.mrp - a.price) / a.mrp : 0;
        const discB = b.mrp > b.price ? (b.mrp - b.price) / b.mrp : 0;
        return discB - discA;
      });
    } else {
      // Default: Alphabetical by name
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return result;
  }, [
    domainFilteredProducts,
    effectiveSearch,
    selectedSubcategory,
    selectedBrand,
    prescriptionFilter,
    priceRange,
    inStockOnly,
    sortBy,
  ]);

  // Visible slice for pagination / load more
  const displayedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, visibleCount);
  }, [filteredAndSortedProducts, visibleCount]);

  const hasMore = visibleCount < filteredAndSortedProducts.length;

  const handleResetFilters = () => {
    setSelectedSubcategory("All");
    setSelectedBrand("All");
    setPrescriptionFilter("all");
    setPriceRange("all");
    setInStockOnly(false);
    setSortBy("featured");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* 1. BREADCRUMBS */}
      <Breadcrumbs items={meta.breadcrumbs} />

      {/* 2. PAGE HEADER BANNER */}
      <div className="bg-white border-b border-slate-200 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
              <i className={`bx ${meta.icon} text-sm`}></i>
              <span>Verified Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {meta.title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              {meta.subtitle}
            </p>
          </div>

          {/* Quick Doctor / Rx Consultation CTA if clinical */}
          {meta.isClinical && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center text-xl">
                <i className="bx bx-user-voice"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Need a Doctor's Prescription?
                </p>
                <Link
                  to="/app/patient/doctors"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors inline-flex items-center gap-1 mt-0.5"
                >
                  <span>Consult a verified physician</span>
                  <i className="bx bx-right-arrow-alt"></i>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN CONTENT: 2-COLUMN LAYOUT */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-6 sm:mt-8">
        {/* MOBILE FILTER & SORT BAR */}
        <div className="md:hidden flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 mb-4 shadow-sm sticky top-16 z-20">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <i className="bx bx-filter-alt text-sm"></i>
            <span>Filters ({filteredAndSortedProducts.length})</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 py-2 px-3 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="featured">Featured</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="discount">Biggest Discount</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* DESKTOP FILTERS SIDEBAR */}
          <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                availableSubcategories={availableSubcategories}
                availableBrands={availableBrands}
                selectedSubcategory={selectedSubcategory}
                onSelectSubcategory={setSelectedSubcategory}
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
                prescriptionFilter={prescriptionFilter}
                onSelectPrescription={setPrescriptionFilter}
                priceRange={priceRange}
                onSelectPriceRange={setPriceRange}
                inStockOnly={inStockOnly}
                onToggleInStockOnly={setInStockOnly}
                onResetFilters={handleResetFilters}
                totalResults={filteredAndSortedProducts.length}
              />
            </div>
          </aside>

          {/* RIGHT PRODUCT CATALOG AREA */}
          <main className="flex-1 min-w-0">
            {/* DESKTOP SORT & SUMMARY BAR */}
            <div className="hidden md:flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3 mb-6 shadow-sm">
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Showing{" "}
                <strong className="text-slate-900 font-bold">
                  {displayedProducts.length}
                </strong>{" "}
                of {filteredAndSortedProducts.length} products
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Sort By:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>
            </div>

            {/* PRODUCT GRID */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-slate-200 p-4 h-80 animate-pulse flex flex-col justify-between"
                  >
                    <div className="bg-slate-100 rounded-lg h-44 w-full" />
                    <div className="space-y-2">
                      <div className="bg-slate-100 rounded h-4 w-3/4" />
                      <div className="bg-slate-100 rounded h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <i className="bx bx-package text-5xl text-slate-300"></i>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-3">
                  No products match your current filters
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Try clearing some of your filters or searching with alternative keywords.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-5 px-5 py-2.5 bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-teal-800 transition-colors shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {displayedProducts.map((product) => (
                    <CommerceProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* LOAD MORE BUTTON */}
                {hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 16)}
                      className="px-6 py-2.5 bg-white border border-slate-300 hover:border-teal-700 text-slate-800 hover:text-teal-800 text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all"
                    >
                      Load More Products (
                      {filteredAndSortedProducts.length - displayedProducts.length}{" "}
                      remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-5 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h2 className="text-sm font-bold text-slate-900">Filters</h2>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <i className="bx bx-x text-2xl"></i>
                </button>
              </div>

              <ProductFilters
                availableSubcategories={availableSubcategories}
                availableBrands={availableBrands}
                selectedSubcategory={selectedSubcategory}
                onSelectSubcategory={setSelectedSubcategory}
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
                prescriptionFilter={prescriptionFilter}
                onSelectPrescription={setPrescriptionFilter}
                priceRange={priceRange}
                onSelectPriceRange={setPriceRange}
                inStockOnly={inStockOnly}
                onToggleInStockOnly={setInStockOnly}
                onResetFilters={handleResetFilters}
                totalResults={filteredAndSortedProducts.length}
              />
            </div>

            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full py-3 bg-teal-700 text-white rounded-lg text-sm font-bold shadow-md"
            >
              Apply Filters ({filteredAndSortedProducts.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
