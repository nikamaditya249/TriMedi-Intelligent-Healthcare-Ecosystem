import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FiShoppingBag, FiCheck, FiPackage, FiX } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { getProducts } from "../api";

function Products({ search = "" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get("search") || "";
  const effectiveSearch = querySearch || search || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCart();

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
        console.error("Fetch error:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", "Medicine", "Health", "Supplements", "Personal Care"];

  const filtered = Array.isArray(products)
    ? products.filter((p) => {
        const term = effectiveSearch.toLowerCase().trim();
        const matchesSearch =
          !term ||
          p.name?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          p.composition?.toLowerCase().includes(term) ||
          p.genericName?.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term);
        const matchesCategory =
          category === "All" ||
          (p.category && p.category.toLowerCase() === category.toLowerCase());
        return matchesSearch && matchesCategory;
      })
    : [];

  const handleAdd = (product) => {
    addToCart(product);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Verified Medicine Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Genuine medications sourced through licensed partner pharmacies.
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                category === cat
                  ? "bg-brand-700 text-white shadow-subtle"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {effectiveSearch && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-brand-50/70 border border-brand-200/80 text-xs text-brand-900">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Showing results for:</span>
            <span className="font-bold text-brand-800">"{effectiveSearch}"</span>
            <span className="text-[11px] text-slate-500">({filtered.length} {filtered.length === 1 ? "medicine" : "medicines"} found)</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900 hover:underline"
          >
            <FiX className="w-3.5 h-3.5" />
            <span>Clear Search</span>
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading authentic medicines catalog..." rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FiPackage}
          title="No Medicines Found"
          description={
            effectiveSearch
              ? `No products matching "${effectiveSearch}". Try searching for Paracetamol, Atorvastatin, or Telmisartan.`
              : "No medicines available in this category."
          }
          actionLabel="View All Products"
          onAction={() => setCategory("All")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
          {filtered.map((p) => {
            const isAdded = addedId === p._id;

            return (
              <Card
                key={p._id}
                className="flex flex-col justify-between hover:border-slate-300 transition-all group"
              >
                <div>
                  <div className="relative h-40 w-full bg-slate-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center p-3 border border-slate-100">
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"}
                      alt={p.name}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300";
                      }}
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="text-[10px] font-bold bg-white/95 px-2 py-0.5 rounded text-slate-700 border border-slate-200/80 shadow-xs">
                        {p.category || "Medicine"}
                      </span>
                      {p.prescriptionRequired ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shadow-xs" title="Prescription Required">
                          Rx
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shadow-xs" title="Over The Counter">
                          OTC
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-0.5">{p.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                    {p.genericName || p.composition || p.dosageForm || "Verified Pharma Stock"}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{p.dosageForm || "Standard"}</span>
                    {(p.stockQuantity ?? 100) > 0 ? (
                      <span className="text-emerald-700 font-semibold">In Stock</span>
                    ) : (
                      <span className="text-rose-600 font-semibold">Out of Stock</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block leading-none">Price</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-slate-900">₹{p.price}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant={isAdded ? "secondary" : "primary"}
                    size="sm"
                    className={`text-xs ${isAdded ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold" : ""}`}
                    onClick={() => handleAdd(p)}
                    icon={isAdded ? FiCheck : FiShoppingBag}
                  >
                    {isAdded ? "Added" : "Add to Cart"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;