import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { createOrderAgainDraft } from "../../api";

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
        const data = await createOrderAgainDraft({
          prescriptionId: refillItem.prescriptionId,
          medicineName: refillItem.medicineName,
          userEmail,
        });
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
          <div className="py-12 text-center text-xs text-[#52627A]">
            Validating active doctor prescription & authoritative stock pricing...
          </div>
        ) : error ? (
          <div className="p-4 bg-[#FFF7E6] border border-[#FDE68A] rounded-xl text-center space-y-2">
            <span className="text-2xl">⚠️</span>
            <h4 className="text-sm font-bold text-[#B7791F]">Prescription Verification Notice</h4>
            <p className="text-xs text-[#718096]">{error}</p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : draft ? (
          <>
            {/* Prescription Match Banner */}
            <div className="p-3 bg-[#E8F7F4] border border-[#9AD9D1] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#087F73] text-lg font-bold">✓</span>
                <div>
                  <h4 className="text-xs font-bold text-[#087F73]">
                    Active Prescription Verified
                  </h4>
                  <p className="text-[11px] text-[#06665D]">
                    Issued by {draft.doctorName || "Dr. Sarah Jenkins"} • Eligible for refill
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Authoritative Price
              </Badge>
            </div>

            {/* Product Summary */}
            <div className="p-4 border border-[#D9E2EC] rounded-xl bg-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#172033]">
                  {draft.medicine.name}
                </h4>
                <p className="text-xs text-[#52627A] mt-0.5">
                  Refill Batch: {draft.medicine.quantity} Tablets (~15 Days Supply)
                </p>
                <p className="text-[11px] text-[#087F73] font-semibold mt-1">
                  Dosage: {draft.medicine.dosage}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#718096]">Unit Price</span>
                <p className="text-base font-bold text-[#172033]">
                  ₹{draft.medicine.authoritativePrice}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-3.5 border border-[#D9E2EC] bg-[#F1F5F9] rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-[#52627A]">
                <span>Subtotal (Authoritative Catalog Price)</span>
                <span className="font-medium text-[#172033]">₹{draft.pricing.subtotal}</span>
              </div>
              <div className="flex justify-between text-[#52627A]">
                <span>Estimated Tax (GST)</span>
                <span className="font-medium text-[#172033]">₹{draft.pricing.totalTax ?? draft.pricing.tax ?? ((draft.pricing.cgst || 0) + (draft.pricing.sgst || 0))}</span>
              </div>
              <div className="flex justify-between text-[#52627A]">
                <span>Standard Delivery</span>
                <span className={draft.pricing.shipping === 0 ? "text-[#087F73] font-bold" : "text-[#172033]"}>
                  {draft.pricing.shipping === 0 ? "FREE" : `₹${draft.pricing.shipping}`}
                </span>
              </div>
              <div className="border-t border-[#D9E2EC] pt-2 flex justify-between font-bold text-[#172033]">
                <span>Total Amount</span>
                <span className="text-[#087F73] text-sm">₹{draft.pricing.totalAmount}</span>
              </div>
            </div>

            {/* Safety Notice */}
            <p className="text-[11px] text-[#718096] leading-relaxed italic">
              * Note: You will review this order on the secure checkout screen before completing payment via PayPal, COD, or UPI.
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#D9E2EC]">
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
