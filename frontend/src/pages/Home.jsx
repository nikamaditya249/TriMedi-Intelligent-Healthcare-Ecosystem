import Deals from "../components/Deals";
import Categories from "../components/Categories";
import Footer from "../components/Footer";

function Home({ search }) {
  return (
    <div>

      {/* HERO */}
      <div className="bg-[#0f3d3e] text-white rounded-xl mx-6 mt-6 p-10 flex justify-between items-center">
        
        <div>
          <p className="text-green-400 mb-2">Weekend Discount</p>

          <h1 className="text-4xl font-bold mb-4">
            Flat 20% Off <br /> Your First Order
          </h1>

          <ul className="mb-4 text-sm">
            <li>• Fast delivery</li>
            <li>• Trusted medicines</li>
            <li>• Affordable prices</li>
          </ul>

          <button className="bg-green-500 px-6 py-2 rounded-lg">
            Shop Now
          </button>
        </div>

        <img
          src="/hero.png"
          alt="hero"
          className="w-64 object-contain"
        />
      </div>

      <Categories />
      <Deals search={search} />
      <Footer />

    </div>
  );
}

export default Home;   // ✅ THIS LINE IS MOST IMPORTANT