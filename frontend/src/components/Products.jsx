import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

function Products({ search }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
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
      });
  }, []);

  // ✅ FILTER LOGIC
  const filtered = Array.isArray(products)
    ? products.filter((p) => {
        const matchSearch = p.name?.toLowerCase().includes(search?.toLowerCase() || "");
        const matchCategory = category === "All" || p.category === category;
        return matchSearch && matchCategory;
      })
    : [];

  return (
    <div className="p-6">

      {/* ✅ CATEGORY FILTER UI */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {["All", "Medicine", "Skin Care", "Diabetes", "Baby Care", "Fitness"].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full border ${
              category === cat
                ? "bg-green-500 text-white"
                : "bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(p => (
          <div key={p._id} className="bg-white p-4 rounded-xl shadow">
            <img src={p.image} className="h-40 w-full object-contain" />

            <h3 className="font-semibold mt-2">{p.name}</h3>
            <p className="text-gray-500">₹{p.price}</p>

            <button
              onClick={() => addToCart(p)}
              className="w-full bg-red-500 text-white mt-3 py-2 rounded"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;