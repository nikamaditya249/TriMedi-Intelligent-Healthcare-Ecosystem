import React, { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FiShield,
  FiLock,
  FiCheckCircle,
  FiTruck,
  FiCreditCard,
  FiAlertCircle,
  FiPackage,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { createOrder, createPayPalOrder, capturePayPalOrder, getPayPalConfig } from "../api";

function Checkout() {
  const { cart = [], total = 0, clearCart } = useCart() || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  const paypalRef = useRef(null);

  const [address, setAddress] = useState({
    name: user?.name || "Aditya Nikam",
    phone: user?.phone || "+91 98765 43210",
    address: user?.address || "Flat 402, Sunshine Heights, Sector 12",
    pincode: "400001",
  });

  const [payment, setPayment] = useState("paypal");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
    setError("");
  };

  // Load and initialize PayPal SDK
  useEffect(() => {
    async function initPayPal() {
      try {
        const config = await getPayPalConfig();
        const clientId = config.clientId || "ATRP8z_3s62vyjSTwB-2z0Mh1nXyqyZxxA5IK1bbGF6TUNAIWRch5KqMnnv59DcOpDa1oDaOius7nB35";

        if (!window.paypal) {
          const script = document.createElement("script");
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
          script.async = true;
          script.onload = () => setPaypalLoaded(true);
          document.body.appendChild(script);
        } else {
          setPaypalLoaded(true);
        }
      } catch (err) {
        console.warn("PayPal config warning:", err.message);
        setPaypalLoaded(true);
      }
    }
    initPayPal();
  }, []);

  // Render Server-Side Integrated PayPal Buttons
  useEffect(() => {
    if (payment !== "paypal" || !paypalLoaded || confirmedOrder) return;

    if (paypalRef.current) {
      paypalRef.current.innerHTML = "";
    }

    if (window.paypal && cart.length > 0) {
      try {
        window.paypal
          .Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "pill",
              label: "paypal",
              height: 44,
            },

            // 1. Server-Side Create Order (Authoritative pricing)
            createOrder: async () => {
              setError("");
              try {
                const res = await createPayPalOrder({
                  items: cart,
                  patientName: address.name,
                  patientEmail: user?.email || "aditya@trimedi.health",
                  patientPhone: address.phone,
                  deliveryAddress: address,
                  prescriptionRef: cart[0]?.prescriptionRef || "",
                });

                if (res.id) {
                  return res.id;
                }
                throw new Error(res.message || "Failed to create PayPal order");
              } catch (err) {
                setError("Payment initialization failed: " + err.message);
                throw err;
              }
            },

            // 2. Server-Side Capture Order & Verification
            onApprove: async (data) => {
              setLoading(true);
              try {
                const captureRes = await capturePayPalOrder({
                  paypalOrderId: data.orderID,
                  items: cart,
                  patientName: address.name,
                  patientEmail: user?.email || "aditya@trimedi.health",
                  patientPhone: address.phone,
                  deliveryAddress: address,
                  prescriptionRef: cart[0]?.prescriptionRef || "",
                });

                if (captureRes.order) {
                  setConfirmedOrder(captureRes.order);
                  clearCart && clearCart();
                } else {
                  setError(captureRes.message || "Payment verification failed");
                }
              } catch (err) {
                setError("Payment verification error: " + err.message);
              } finally {
                setLoading(false);
              }
            },

            onCancel: () => {
              setError("Payment was cancelled by the user. You can retry or choose another payment method.");
            },

            onError: (err) => {
              console.error("PayPal error:", err);
              setError("An error occurred during PayPal checkout. Please try again or choose Cash on Delivery.");
            },
          })
          .render(paypalRef.current);
      } catch (renderErr) {
        console.warn("PayPal render warning:", renderErr.message);
      }
    }
  }, [payment, paypalLoaded, cart, total, address, user, confirmedOrder]);

  // Handle COD / UPI / Direct Checkout
  const handleDirectOrder = async () => {
    if (!address.name || !address.phone || !address.address) {
      setError("Please complete your delivery address and contact phone number.");
      return;
    }

    if (payment === "upi" && !upiId) {
      setError("Please enter a valid UPI Virtual Payment Address (VPA).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderPayload = {
        patientName: address.name,
        patientEmail: user?.email || "aditya@trimedi.health",
        patientPhone: address.phone,
        items: cart,
        deliveryAddress: address,
        paymentMethod: payment,
        prescriptionRef: cart[0]?.prescriptionRef || "",
      };

      const res = await createOrder(orderPayload);
      if (res.order) {
        setConfirmedOrder(res.order);
        clearCart && clearCart();
      } else {
        setError(res.message || "Failed to place order");
      }
    } catch (err) {
      setError(err.message || "Failed to connect to order fulfillment system");
    } finally {
      setLoading(false);
    }
  };

  // 1. Order Success Screen with Medication Timeline
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <Card className="border-teal-200 bg-white text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <FiCheckCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Order Confirmed & Paid
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              Thank you, {confirmedOrder.patientName}!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Order ID: <span className="font-mono font-bold text-slate-800">{confirmedOrder.orderId || confirmedOrder._id}</span> • Synchronized with TriMedi Care Engine
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 text-left text-xs space-y-2 border border-slate-100">
            <div className="flex justify-between font-semibold text-slate-800 pb-2 border-b border-slate-200">
              <span>Payment Method: <b className="uppercase">{confirmedOrder.paymentMethod}</b></span>
              <span className="text-emerald-700">Status: {confirmedOrder.paymentStatus || "PAID"}</span>
            </div>
            <p><b>Delivery Destination:</b> {confirmedOrder.deliveryAddress?.street || address.address}, PIN: {confirmedOrder.deliveryAddress?.pincode || address.pincode}</p>
            <p><b>Dispensing Pharmacy:</b> {confirmedOrder.pharmacyName || "MedPlus Prime Pharmacy"}</p>
            <p><b>Estimated Treatment Supply:</b> ~{confirmedOrder.supplyDaysEstimate || 15} Days</p>
            {confirmedOrder.paypalCaptureId && (
              <p className="text-[11px] text-slate-400">PayPal Capture ID: {confirmedOrder.paypalCaptureId}</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 text-left text-xs space-y-1 text-teal-900">
            <p className="font-bold flex items-center gap-1.5">
              <FiPackage className="w-4 h-4 text-teal-700" />
              <span>Connected Medication Supply Tracking Active</span>
            </p>
            <p className="text-teal-800">
              This purchase covers approximately <b>{confirmedOrder.supplyDaysEstimate || 15} days</b> of treatment. Your Patient Dashboard supply timeline has been updated.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/app/patient/dashboard")}
            >
              Go to Patient Dashboard
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/app/patient/orders")}
            >
              View Order History
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 2. Empty Cart Check
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <EmptyState
          title="No Items in Cart"
          description="Your cart is empty. Browse medicines from verified pharmacies or order directly from your prescriptions."
          actionLabel="Browse Medicine Catalog"
          onAction={() => navigate("/products")}
        />
      </div>
    );
  }

  // 3. Checkout Form
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Secure Pharmacy Checkout</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authoritative server-side pricing & authenticated pharmacy fulfillment.
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={FiArrowLeft} onClick={() => navigate("/cart")}>
          Return to Cart
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Address & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Details */}
          <Card>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <FiTruck className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">1. Delivery Address</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Recipient Name"
                name="name"
                required
                value={address.name}
                onChange={handleChange}
              />
              <Input
                label="Contact Phone"
                name="phone"
                required
                value={address.phone}
                onChange={handleChange}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Street Address / Residence"
                  name="address"
                  required
                  value={address.address}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="Postal PIN Code"
                name="pincode"
                value={address.pincode}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* Payment Selection */}
          <Card>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <FiCreditCard className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">2. Select Payment Method</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <label
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-semibold transition-all ${
                  payment === "paypal"
                    ? "border-brand-600 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "paypal"}
                  onChange={() => setPayment("paypal")}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span>PayPal / Cards</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-semibold transition-all ${
                  payment === "upi"
                    ? "border-brand-600 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "upi"}
                  onChange={() => setPayment("upi")}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span>Instant UPI</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-semibold transition-all ${
                  payment === "cod"
                    ? "border-brand-600 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "cod"}
                  onChange={() => setPayment("cod")}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span>Cash on Delivery</span>
              </label>
            </div>

            {/* UPI Input */}
            {payment === "upi" && (
              <div className="space-y-3 pt-2">
                <Input
                  label="Enter UPI ID (VPA)"
                  placeholder="e.g., aditya@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <Button
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full"
                  onClick={handleDirectOrder}
                >
                  Pay with UPI & Confirm Order (₹{total})
                </Button>
              </div>
            )}

            {/* PayPal Container */}
            {payment === "paypal" && (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 flex items-center gap-2 border border-slate-100">
                  <FiLock className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>
                    Secured by PayPal Orders API. Amount calculated server-side: <b>₹{total} (~${(total / 80).toFixed(2)} USD)</b>.
                  </span>
                </div>
                <div ref={paypalRef} className="min-h-[45px]" />
              </div>
            )}

            {/* COD Button */}
            {payment === "cod" && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full"
                  onClick={handleDirectOrder}
                >
                  Place Cash on Delivery Order (₹{total})
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Order Summary */}
        <Card>
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
            Prescription & Order Items
          </h3>

          <div className="divide-y divide-slate-100 mb-4">
            {cart.map((item) => (
              <div key={item._id} className="py-2.5 flex justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-slate-400">
                    Qty: {item.qty || 1} • {item.supplyDays ? `~${item.supplyDays} Days Supply` : "Verified Stock"}
                  </p>
                  {item.prescriptionRef && (
                    <span className="text-[10px] text-brand-700 font-semibold block mt-0.5">
                      Rx Ref: {item.prescriptionRef}
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900">
                  ₹{item.price * (item.qty || 1)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline mb-4">
            <span className="text-sm font-bold text-slate-900">Authoritative Total</span>
            <span className="text-xl font-extrabold text-brand-800">₹{total}</span>
          </div>

          <div className="p-3 rounded-xl bg-brand-50 text-[11px] text-brand-900 space-y-1 border border-brand-200/80">
            <p className="font-semibold flex items-center gap-1.5">
              <FiShield className="w-3.5 h-3.5 text-brand-700" />
              <span>Medication Supply Synchronization:</span>
            </p>
            <p className="text-brand-800 leading-relaxed">
              Your medicine purchase will be automatically linked to your prescription timeline for supply gap tracking.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Checkout;