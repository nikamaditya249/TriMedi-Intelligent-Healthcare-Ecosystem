import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Breadcrumbs from "../../components/commerce/Breadcrumbs";
import CommerceProductCard from "../../components/commerce/CommerceProductCard";
import { useCart } from "../../context/CartContext";
import { getProductById, getProducts } from "../../api";
import { handleImageError } from "../../data/imageManifest";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    getProductById(productId)
      .then((data) => {
        setProduct(data);
        // Load related products from same category
        if (data && data.category) {
          getProducts({ category: data.category }).then((list) => {
            if (Array.isArray(list)) {
              setRelatedProducts(
                list.filter((item) => String(item._id) !== String(data._id)).slice(0, 4)
              );
            }
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load product details:", err);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <i className="bx bx-loader-alt bx-spin text-3xl text-teal-700"></i>
          <span className="text-sm font-semibold">Loading product details...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 max-w-7xl mx-auto text-center">
        <i className="bx bx-error-circle text-5xl text-slate-300"></i>
        <h2 className="text-xl font-bold text-slate-900 mt-3">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          The requested pharmaceutical or healthcare product could not be found.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 transition-colors"
        >
          <i className="bx bx-left-arrow-alt text-lg"></i>
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || Math.round(price * 1.15);
  const hasDiscount = mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  const inStock = (product.availableQuantity || product.stockQuantity || 0) > 0;
  const isPrescription = Boolean(product.prescriptionRequired);

  const breadcrumbItems = [
    { label: "Products", to: "/products" },
    { label: product.category || "Medicines", to: `/products/medicines` },
    { label: product.name },
  ];

  const handleAddToCart = () => {
    if (!inStock) return;
    for (let i = 0; i < quantity; i++) {
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
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* BREADCRUMB */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* MAIN PRODUCT DISPLAY */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 mt-4">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10">
          {/* LEFT: PACKSHOT CONTAINER (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 p-8 h-80 sm:h-96 relative">
            {/* BADGES */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {isPrescription ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  <i className="bx bx-receipt text-sm"></i>
                  <span>Prescription Required (Rx)</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Over-the-Counter (OTC)
                </span>
              )}
            </div>

            <img
              src={product.image}
              alt={product.name}
              onError={handleImageError}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* RIGHT: PRODUCT DETAILS & ACTIONS (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              {/* Brand & Category tags */}
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Link
                  to={`/products/brand/${(product.brand || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="text-teal-700 hover:underline"
                >
                  {product.brand || "TriMedi Healthcare"}
                </Link>
                <span>•</span>
                <span>{product.category || "Medicine"}</span>
                {product.subcategory && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">{product.subcategory}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {product.name}
              </h1>

              {/* Generic Composition */}
              {product.genericName && (
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-1 italic">
                  Active Salt: {product.genericName}
                </p>
              )}

              {/* Strength & Dosage */}
              <div className="mt-3 flex items-center gap-2">
                {product.strength && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Strength: {product.strength}
                  </span>
                )}
                {product.dosageForm && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Form: {product.dosageForm}
                  </span>
                )}
              </div>

              {/* PRICE AREA */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  ₹{price}
                </span>
                {hasDiscount && (
                  <span className="text-base text-slate-400 line-through">
                    MRP ₹{mrp}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Inclusive of all taxes (GST {Math.round((product.taxRate || 0.12) * 100)}%). Server-authoritative checkout.
              </p>

              {/* PRESCRIPTION WARNING (If Rx) */}
              {isPrescription && (
                <div className="mt-5 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                  <i className="bx bx-shield-quarter text-xl text-amber-700 flex-shrink-0 mt-0.5"></i>
                  <div className="text-xs">
                    <strong className="block font-bold mb-0.5">
                      Doctor Prescription Required
                    </strong>
                    <span>
                      This medicine requires a valid prescription signed by a registered medical practitioner. Upload your prescription during checkout or consult a verified doctor.
                    </span>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Link
                        to="/app/patient/doctors"
                        className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-bold text-[11px] transition-colors"
                      >
                        Consult Doctor Online
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* STOCK STATUS */}
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
                {inStock ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <i className="bx bx-check-circle text-lg"></i>
                    <span>In Stock (Available for fast dispatch)</span>
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <i className="bx bx-x-circle text-lg"></i>
                    <span>Currently Out of Stock</span>
                  </span>
                )}
              </div>
            </div>

            {/* QUANTITY & ADD TO CART ACTION */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Quantity selector */}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 self-start">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm ${
                  justAdded
                    ? "bg-emerald-600 text-white"
                    : inStock
                    ? "bg-teal-700 hover:bg-teal-800 text-white active:scale-[0.98]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {justAdded ? (
                  <>
                    <i className="bx bx-check text-xl"></i>
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-cart-add text-xl"></i>
                    <span>Add {quantity} to Cart (₹{price * quantity})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* METADATA & CLINICAL SPECIFICATIONS */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Product Specifications & Verification
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Manufacturer</span>
              <strong className="text-slate-800 font-semibold">
                {product.manufacturer || "Licensed Pharmaceutical Lab"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">SKU Identifier</span>
              <strong className="text-slate-800 font-semibold font-mono">
                {product.sku || "N/A"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">HSN Code</span>
              <strong className="text-slate-800 font-semibold font-mono">
                {product.hsnCode || "3004"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Batch Number</span>
              <strong className="text-slate-800 font-semibold font-mono">
                {product.batchNumber || "B-2026-A1"}
              </strong>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h3 className="font-bold text-slate-900 mb-1">Product Description</h3>
            <p>{product.description || "Licensed medical pharmaceutical product."}</p>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Related in {product.category || "Healthcare"}
              </h2>
              <Link
                to={`/products/medicines`}
                className="text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <span>View More</span>
                <i className="bx bx-right-arrow-alt"></i>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
              {relatedProducts.map((rel) => (
                <CommerceProductCard key={rel._id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
