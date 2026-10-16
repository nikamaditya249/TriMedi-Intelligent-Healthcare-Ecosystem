import mongoose from "mongoose";
import Product from "../models/Product.js";
import { defaultProducts } from "../data/defaultProducts.js";

/**
 * Authoritatively calculates item prices, GST breakdown, and delivery fee.
 * Strictly ignores all client-supplied prices, taxes, and totals.
 *
 * @param {Array} rawItems - Array of client-provided item requests [{ productId, quantity, prescriptionRef }]
 * @param {Object} options - Optional discount or coupon rules
 * @returns {Promise<{ pricing: Object, validatedItems: Array }>}
 */
export const calculateAuthoritativePricing = async (rawItems = [], options = {}) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Cannot calculate pricing for an empty item list");
  }

  const validatedItems = [];
  let taxableAmount = 0;
  let totalTax = 0;

  for (const rawItem of rawItems) {
    const prodId = rawItem.productId || rawItem._id;
    let product = null;

    // 1. Query live database if connected
    if (mongoose.connection.readyState === 1 && prodId && mongoose.isValidObjectId(prodId)) {
      try {
        product = await Product.findById(prodId).lean();
      } catch (e) {
        // format error
      }
    }

    // 2. Fallback to authoritative catalog
    if (!product) {
      product = defaultProducts.find(
        (p) =>
          String(p._id) === String(prodId) ||
          (rawItem.name && p.name.toLowerCase() === rawItem.name.toLowerCase()) ||
          (p.sku && rawItem.sku && p.sku === rawItem.sku)
      );
    }

    if (!product) {
      throw new Error(`Product not found in authoritative catalog: ${rawItem.name || prodId}`);
    }

    // Check product active state
    if (product.active === false) {
      throw new Error(`Product "${product.name}" is no longer active in the pharmacy catalog`);
    }

    // Authoritative unit price from catalog (CLIENT SUPPLIED PRICE IS COMPLETELY IGNORED)
    const unitPrice = Number(product.price);
    const quantity = Math.max(1, Math.floor(Number(rawItem.quantity) || Number(rawItem.qty) || 1));
    const taxRate = Number(product.taxRate !== undefined ? product.taxRate : 0.12); // e.g. 12% GST

    const lineSubtotal = Math.round(unitPrice * quantity);
    const lineTax = Math.round(lineSubtotal * taxRate);

    taxableAmount += lineSubtotal;
    totalTax += lineTax;

    const supplyDays = Number(rawItem.supplyDays) || (quantity > 1 ? quantity * 15 : 15);

    validatedItems.push({
      productId: String(product._id),
      nameSnapshot: product.name,
      skuSnapshot: product.sku || `SKU-${product._id.toString().slice(-6)}`,
      unitPrice,
      quantity,
      taxRate,
      taxAmount: lineTax,
      lineTotal: lineSubtotal,
      supplyDays,
      prescriptionRequired: Boolean(product.prescriptionRequired),
      prescriptionRef: rawItem.prescriptionRef || "",
      // Backward-compatibility aliases
      name: product.name,
      price: unitPrice,
      qty: quantity,
    });
  }

  // GST Breakdown: Intrastate split into CGST (50%) and SGST (50%)
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;
  const igst = 0;

  // Delivery fee policy: Orders >= ₹500 enjoy free delivery; otherwise ₹40 flat fee
  const deliveryFee = taxableAmount >= 500 ? 0 : 40;

  // Discount (if validated promo code applied server-side)
  const discount = Number(options.discount) || 0;

  const grandTotal = Math.max(0, taxableAmount + totalTax + deliveryFee - discount);

  const pricing = {
    subtotal: taxableAmount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    deliveryFee,
    discount,
    grandTotal,
    currency: "INR",
  };

  return { pricing, validatedItems };
};

export default {
  calculateAuthoritativePricing,
};
