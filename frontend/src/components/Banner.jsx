function Banner() {
  return (
    <div className="max-w-7xl mx-auto px-6">

      <div className="bg-gradient-to-r from-green-100 to-green-50 p-8 rounded-2xl flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold mb-2">
            Get Health Essentials at Best Price
          </h2>
          <p className="text-gray-600 mb-4">
            Trusted products delivered to your home
          </p>

          <button className="bg-green-500 text-white px-5 py-2 rounded-lg">
            Explore Now
          </button>
        </div>

        <img
          src="/hero-product.png"
          className="w-40 hidden md:block"
        />

      </div>

    </div>
  );
}

export default Banner;