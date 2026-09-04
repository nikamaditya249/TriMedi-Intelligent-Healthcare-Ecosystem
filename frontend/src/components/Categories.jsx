function Categories() {
  const categories = [
    {
      name: "Medicine",
      emoji: "💊",
      color: "bg-blue-100",
    },
    {
      name: "Skin Care",
      emoji: "🧴",
      color: "bg-pink-100",
    },
    {
      name: "Diabetes",
      emoji: "🩸",
      color: "bg-red-100",
    },
    {
      name: "Baby Care",
      emoji: "🍼",
      color: "bg-yellow-100",
    },
    {
      name: "Fitness",
      emoji: "🏋️",
      color: "bg-purple-100",
    },
    {
      name: "Supplements",
      emoji: "💪",
      color: "bg-green-100",
    },
  ];

  return (
    <div className="px-6 py-10">
      <h2 className="text-2xl font-bold mb-6">
        Explore Categories
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

        {categories.map((cat, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl text-center shadow-sm cursor-pointer 
            hover:shadow-lg hover:scale-105 transition duration-300 ${cat.color}`}
          >
            <div className="text-4xl mb-3">
              {cat.emoji}
            </div>

            <p className="font-medium">
              {cat.name}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}

export default Categories;