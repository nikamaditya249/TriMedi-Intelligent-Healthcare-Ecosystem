import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

function Deals({ search }) {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch("http://localhost:5001/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("API returned non-array data:", data);
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setProducts([]);
      });
  }, []);

  // ✅ SEARCH FILTER
  const filtered = Array.isArray(products)
    ? products.filter((p) =>
        p.name?.toLowerCase().includes(search?.toLowerCase() || "")
      )
    : [];

  // ✅ LIMIT TO ONLY 4 DEALS
  const deals = filtered.slice(0, 4);

  return (
    <div className="px-6 py-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Deals of the Day
        </h2>

        {/* 👉 VIEW ALL BUTTON */}
        <button
          onClick={() => window.location.href = "/products"}
          className="text-green-600 font-medium hover:underline"
        >
          View All →
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {deals.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-xl shadow-md p-5 hover:shadow-xl transition"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-contain mb-4"
            />

            <h3 className="text-lg font-semibold">
              {product.name}
            </h3>

            <p className="text-gray-600 mb-4">
              ₹{product.price}
            </p>

            <button
              onClick={() => addToCart(product)}
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Deals;