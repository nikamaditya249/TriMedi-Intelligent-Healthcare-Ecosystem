import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../../components/commerce/Breadcrumbs";
import { FEATURED_BRANDS } from "../../data/commerceData";
import { handleImageError } from "../../data/imageManifest";

export default function BrandDirectoryPage() {
  const [search, setSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("All");

  const breadcrumbItems = [
    { label: "Products", to: "/products" },
    { label: "Featured Brands" },
  ];

  // Alphabet list
  const alphabet = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

  // Filter brands by search and alphabetical letter
  const filteredBrands = useMemo(() => {
    return FEATURED_BRANDS.filter((brand) => {
      const matchesSearch =
        brand.name.toLowerCase().includes(search.toLowerCase()) ||
        brand.tag.toLowerCase().includes(search.toLowerCase());
      const matchesLetter =
        selectedLetter === "All" ||
        brand.name.toUpperCase().startsWith(selectedLetter);
      return matchesSearch && matchesLetter;
    });
  }, [search, selectedLetter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* BREADCRUMB */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* HEADER HERO */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-3">
            <i className="bx bx-award text-sm"></i>
            <span>Verified Pharmaceutical & Wellness Partners</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Featured Healthcare Brands
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
            Explore authentic medicines, clinically tested personal care, and
            certified health devices from India's leading manufacturers.
          </p>

          {/* SEARCH & ALPHABET BAR */}
          <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <i className="bx bx-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands (e.g. Himalaya, Abbott)..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              )}
            </div>

            {/* Alphabet Scroller */}
            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedLetter === letter
                      ? "bg-teal-700 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BRAND DIRECTORY GRID */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-8">
        {filteredBrands.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <i className="bx bx-search-alt text-4xl text-slate-300"></i>
            <h3 className="text-base font-bold text-slate-800 mt-2">
              No brands found matching "{search}"
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or reset the alphabetical filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedLetter("All");
              }}
              className="mt-4 px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredBrands.map((brand) => {
              const slug = brand.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

              return (
                <Link
                  key={brand.id}
                  to={`/products/brand/${slug}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col items-center text-center hover:border-teal-500 hover:shadow-card transition-all duration-200"
                >
                  {/* BRAND LOGO CONTAINER */}
                  <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 p-3 flex items-center justify-center overflow-hidden mb-3.5 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                    <img
                      src={brand.image}
                      alt={brand.name}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* BRAND NAME */}
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate max-w-full leading-tight">
                    {brand.name}
                  </h2>
                  <span className="text-xs text-slate-500 mt-1">
                    {brand.tag}
                  </span>

                  <span className="mt-3.5 text-xs font-bold text-teal-700 group-hover:text-teal-800 inline-flex items-center gap-1">
                    <span>View Products</span>
                    <i className="bx bx-chevron-right text-sm"></i>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
