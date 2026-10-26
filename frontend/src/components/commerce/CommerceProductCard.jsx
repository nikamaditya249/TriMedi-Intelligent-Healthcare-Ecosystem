import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { handleImageError } from "../../data/imageManifest";

/**
 * TriMedi Standard Healthcare Commerce Product Card
 * - Packshot with object-contain (never crops packaging)
 * - Restrained healthcare palette (Teal #00897B, Navy #172033, Slate #64748B)
 * - Server-authoritative pricing and instant cart persistence
 */
export default function CommerceProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || Math.round(price * 1.15);
  const hasDiscount = mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  const inStock = (product.availableQuantity || product.stockQuantity || 0) > 0;
  const isPrescription = Boolean(product.prescriptionRequired);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || isAdding) return;

    setIsAdding(true);
    try {
      addToCart({
        id: product._id,
        _id: product._id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        category: product.category,
        brand: product.brand,
        prescriptionRequired: product.prescriptionRequired,
        sku: product.sku,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
    } catch (err) {
      console.error("Cart addition failed:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-xl overflow-hidden hover:border-teal-500/50 hover:shadow-md transition-all duration-200 flex flex-col h-full">
      {/* CARD TOP HEADER: Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        {/* Prescription or OTC badge */}
        {isPrescription ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
            title="Prescription Required by Licensed Physician"
          >
            <i className="bx bx-receipt text-xs"></i>
            <span>Rx</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            OTC
          </span>
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* PACKSHOT IMAGE CONTAINER: Fixed height with object-contain */}
      <Link
        to={`/products/${product._id}`}
        className="block bg-white pt-7 pb-3 px-4 h-48 sm:h-52 flex items-center justify-center border-b border-slate-100 group-hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* PRODUCT INFORMATION */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span className="uppercase tracking-wider truncate max-w-[140px]">
              {product.brand || "TriMedi"}
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {product.dosageForm || product.strength || ""}
            </span>
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product._id}`}
            className="block text-slate-900 font-semibold text-sm sm:text-base leading-snug line-clamp-2 hover:text-teal-700 transition-colors"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Generic Salt / Composition */}
          {product.genericName && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
              {product.genericName}
            </p>
          )}

          {/* Stock Availability */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            {inStock ? (
              <span className="inline-flex items-center text-emerald-700 font-medium gap-1">
                <i className="bx bx-check-circle text-emerald-600"></i>
                <span>In Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-600 font-medium gap-1">
                <i className="bx bx-x-circle text-rose-500"></i>
                <span>Out of Stock</span>
              </span>
            )}
          </div>
        </div>

        {/* PRICE & ADD TO CART CTA */}
        <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Pricing Details */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold text-slate-900">
                ₹{price}
              </span>
              {hasDiscount && (
                <span className="text-xs sm:text-sm text-slate-400 line-through">
                  ₹{mrp}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Incl. all taxes
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock || isAdding}
            aria-label={`Add ${product.name} to cart`}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 min-w-[90px] sm:min-w-[105px] ${
              justAdded
                ? "bg-emerald-600 text-white border border-emerald-600"
                : inStock
                ? "bg-teal-700 hover:bg-teal-800 text-white shadow-sm active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
          >
            {justAdded ? (
              <>
                <i className="bx bx-check text-base"></i>
                <span>Added</span>
              </>
            ) : (
              <>
                <i className="bx bx-cart-add text-base"></i>
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
