function Hero() {
  return (
    <div className="max-w-7xl mx-auto px-6 mt-6">

      <div className="relative bg-[#0f3d3e] rounded-2xl px-10 py-16 overflow-hidden">

        {/* IMAGE */}
        <img
          src="/hero-product.png"
          alt="medicine"
          className="absolute right-10 top-1/2 -translate-y-1/2 w-[350px] md:w-[420px]"
        />

        {/* CONTENT */}
        <div className="relative z-10 text-white max-w-lg">
          <p className="text-green-400 mb-2">Weekend Discount</p>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Flat <span className="text-green-400">20% Off</span> <br />
            Your First Order
          </h1>

          <ul className="mb-6 space-y-1 text-sm text-gray-200">
            <li>• Fast delivery</li>
            <li>• Trusted medicines</li>
            <li>• Affordable prices</li>
          </ul>

          <button className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg">
            Shop Now
          </button>
        </div>

      </div>
    </div>
  );
}

export default Hero;