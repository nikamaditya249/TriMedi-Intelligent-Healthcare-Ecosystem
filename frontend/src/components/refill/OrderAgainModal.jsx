import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const OrderAgainModal = ({ isOpen, onClose, refillItem }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");

  const userEmail = user?.email || "patient@trimedi.com";

  useEffect(() => {
    if (!isOpen || !refillItem) return;

    const fetchDraft = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("http://localhost:5001/api/refill/order-again-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prescriptionId: refillItem.prescriptionId,
            medicineName: refillItem.medicineName,
            userEmail,
          }),
        });
        const data = await res.json();
        if (data.success && data.draft) {
          setDraft(data.draft);
        } else {
          setError(data.message || "Failed to validate refill with prescription.");
        }
      } catch (err) {
        setError("Network error validating refill order.");
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [isOpen, refillItem, userEmail]);

  const handleProceedToCheckout = () => {
    if (!draft?.medicine) return;

    // Add item to cart with authoritative server price & prescription reference
    addToCart({
      _id: draft.medicine.productId,
      productId: draft.medicine.productId,
      name: draft.medicine.name,
      price: draft.medicine.authoritativePrice,
      dosage: draft.medicine.dosage,
      prescriptionRef: draft.prescriptionId,
      supplyDays: draft.medicine.quantity || 15,
      quantity: 1,
    });

    onClose();
    navigate("/checkout");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Medication Refill: Order Again" maxWidth="max-w-xl">
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Validating active doctor prescription & authoritative stock pricing...
          </div>
        ) : error ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-center space-y-2">
            <span className="text-2xl">⚠️</span>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Prescription Verification Notice</h4>
            <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : draft ? (
          <>
            {/* Prescription Match Banner */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 text-lg">✓</span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Active Prescription Verified
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Issued by {draft.doctorName || "Dr. Sarah Jenkins"} • Eligible for refill
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Authoritative Price
              </Badge>
            </div>

            {/* Product Summary */}
            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {draft.medicine.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Refill Batch: {draft.medicine.quantity} Tablets (~15 Days Supply)
                </p>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">
                  Dosage: {draft.medicine.dosage}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Unit Price</span>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  ₹{draft.medicine.authoritativePrice}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Authoritative Catalog Price)</span>
                <span>₹{draft.pricing.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated Tax (GST 5%)</span>
                <span>₹{draft.pricing.tax}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Standard Delivery</span>
                <span className={draft.pricing.shipping === 0 ? "text-emerald-600 font-semibold" : ""}>
                  {draft.pricing.shipping === 0 ? "FREE" : `₹${draft.pricing.shipping}`}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Total Amount</span>
                <span className="text-teal-600 dark:text-teal-400">₹{draft.pricing.totalAmount}</span>
              </div>
            </div>

            {/* Safety Notice */}
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              * Note: You will review this order on the secure checkout screen before completing payment via PayPal, COD, or UPI.
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleProceedToCheckout}>
                Proceed to Checkout ➔
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
};

export default OrderAgainModal;
