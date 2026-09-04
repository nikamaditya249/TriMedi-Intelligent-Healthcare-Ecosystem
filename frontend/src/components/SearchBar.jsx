import { useState } from "react";

const products = [
  "Paracetamol",
  "Vitamin C",
  "Protein Powder",
  "Insulin",
  "Face Wash",
  "Baby Lotion",
  "Pain Relief Spray",
  "Cough Syrup",
  "Antiseptic Cream",
  "Moisturizer",
  "Sunscreen",
  "Lip Balm",
  "Shampoo",
  "Conditioner",
  "Toothpaste",
  "Naxdom 500mg",
  "Ciplox 250mg",
  "Dolo 650mg",
  "Crocin 500mg",
  "Vicks Vaporub",
];

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value === "") {
      setResults([]);
    } else {
      const filtered = products.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search medicines..."
        className="w-full px-4 py-2 border rounded-lg"
      />

      {results.length > 0 && (
        <div className="absolute bg-white border w-full mt-1 rounded shadow z-50">
          {results.map((item, index) => (
            <p
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;