import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { FiShoppingBag, FiSearch, FiCheck, FiPackage, FiFilter } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";

function Products({ search = "" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch("http://localhost:5001/api/products")
      .then((res) => res.json())
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
        const matchesSearch = p.name?.toLowerCase().includes(search?.toLowerCase() || "");
        const matchesCategory = category === "All" || (p.category && p.category.toLowerCase() === category.toLowerCase());
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading authentic medicines catalog..." rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FiPackage}
          title="No Medicines Found"
          description={
            search
              ? `No products matching "${search}". Try searching for Paracetamol, Atorvastatin, or Cetirizine.`
              : "No medicines available in this category."
          }
          actionLabel="View All Products"
          onAction={() => setCategory("All")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => {
            const isAdded = addedId === p._id;

            return (
              <Card
                key={p._id}
                className="flex flex-col justify-between hover:border-brand-200 transition-all group"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center p-3">
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"}
                      alt={p.name}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300";
                      }}
                    />
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-slate-700 shadow-xs border border-slate-100">
                      {p.category || "Medicine"}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">{p.name}</h3>
                  <p className="text-xs text-slate-400">Authentic Pharmacy Stock</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 block leading-none">Price</span>
                    <span className="text-base font-extrabold text-slate-900">₹{p.price}</span>
                  </div>

                  <Button
                    variant={isAdded ? "secondary" : "primary"}
                    size="sm"
                    className={`text-xs ${isAdded ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" : ""}`}
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