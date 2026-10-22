import React from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { FiShoppingBag, FiTrash2, FiArrowRight, FiShield } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";

function Cart() {
  const { cart = [], removeFromCart, updateQuantity, total = 0 } = useCart() || {};
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Medicine Cart</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your selected medications before prescription validation and delivery dispatch.
        </p>
      </div>

      {cart.length === 0 ? (
        <EmptyState
          icon={FiShoppingBag}
          title="Your Cart is Empty"
          description="You have not added any medications to your cart yet. Explore our verified pharmacy catalog or order directly from your active prescriptions."
          actionLabel="Browse Medicine Catalog"
          onAction={() => navigate("/products")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-3.5">
            {cart.map((item) => (
              <Card key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200/80 p-2 flex items-center justify-center shrink-0">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-500">Unit Price: ₹{item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity && updateQuantity(item._id, (item.qty || 1) - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-200 rounded-l-md transition-colors text-xs"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-800">
                          {item.qty || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity && updateQuantity(item._id, (item.qty || 1) + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-200 rounded-r-md transition-colors text-xs"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <p className="text-base font-bold text-slate-900">
                    ₹{item.price * (item.qty || 1)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary Box */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items in Cart</span>
                <span className="font-semibold text-slate-900">{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{total}</span>
              </div>
              <div className="flex justify-between">
                <span>Pharmacy Dispensing Fee</span>
                <span className="text-emerald-700 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="text-slate-700 font-medium">Standard (1-2 days)</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-baseline mb-6">
              <span className="text-sm font-bold text-slate-900">Total Payable</span>
              <span className="text-xl font-extrabold text-brand-800">₹{total}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/checkout")}
              icon={FiArrowRight}
              iconPosition="right"
            >
              Proceed to Secure Checkout
            </Button>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <FiShield className="w-3.5 h-3.5 text-brand-700" />
                <span>100% Genuine Medicines • Encrypted Checkout</span>
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Cart;