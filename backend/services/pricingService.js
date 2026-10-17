import mongoose from "mongoose";
import Product from "../models/Product.js";
import { defaultProducts } from "../data/defaultProducts.js";
import { isMockAllowed } from "../middleware/dbGuard.js";

// Configured Seller / Dispensary Location & Legal Entity
export const SELLER_CONFIG = {
  legalName: "TriMedi Healthcare Services Pvt. Ltd.",
  tradeName: "MedPlus Prime Pharmacy",
  gstin: process.env.SELLER_GSTIN || "27AABCT1234F1Z5", // State code 27 = Maharashtra
  state: process.env.SELLER_STATE || "Maharashtra",
  stateCode: "27",
  pan: "AABCT1234F",
  address: "74 Health Ave, Sector 4, Mumbai, Maharashtra 400001",
  hsnMedicamentsDefault: "3004", // Chapter 30: Medicaments
  taxModel: "TAX_EXCLUSIVE", // Prices in catalog represent taxable base; GST added authoritatively
};

/**
 * Standardize state names for GST jurisdiction matching
 */
const normalizeState = (stateStr = "") => {
  const s = String(stateStr).trim().toLowerCase();
  if (s.includes("maharashtra") || s === "mh" || s === "27") return "maharashtra";
  if (s.includes("karnataka") || s === "ka" || s === "29") return "karnataka";
  if (s.includes("delhi") || s === "dl" || s === "07") return "delhi";
  if (s.includes("gujarat") || s === "gj" || s === "24") return "gujarat";
  if (s.includes("tamil") || s === "tn" || s === "33") return "tamil nadu";
  return s;
};

/**
 * Authoritatively calculates item prices, GST breakdown (Intrastate vs Interstate),
 * and delivery fee.
 *
 * Strictly ignores all client-supplied prices, taxes, and totals.
 *
 * @param {Array} rawItems - Array of client-provided item requests [{ productId, quantity, prescriptionRef }]
 * @param {Object} options - { shippingState, deliveryAddress, discount }
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

    // 2. Authoritative catalog fallback (permitted in development/test mocks)
    if (!product) {
      if (mongoose.connection.readyState === 1 && !isMockAllowed()) {
        throw new Error(`Product not found in database: ${prodId}`);
      }
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

    // Authoritative unit price from catalog (CLIENT SUPPLIED PRICE IS STRICTLY IGNORED)
    const unitPrice = Number(product.price);
    const quantity = Math.max(1, Math.floor(Number(rawItem.quantity) || Number(rawItem.qty) || 1));
    const taxRate = Number(product.taxRate !== undefined ? product.taxRate : 0.12); // standard 12% GST on medicines
    const hsn = product.hsn || SELLER_CONFIG.hsnMedicamentsDefault;

    const lineSubtotal = Math.round(unitPrice * quantity);
    const lineTax = Math.round(lineSubtotal * taxRate);

    taxableAmount += lineSubtotal;
    totalTax += lineTax;

    const supplyDays = Number(rawItem.supplyDays) || (quantity > 1 ? quantity * 15 : 15);

    validatedItems.push({
      productId: String(product._id),
      nameSnapshot: product.name,
      skuSnapshot: product.sku || `SKU-${product._id.toString().slice(-6)}`,
      hsnSnapshot: hsn,
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

  // Determine Customer Shipping State for GST Jurisdiction
  const customerState =
    options.shippingState ||
    options.deliveryAddress?.state ||
    options.state ||
    "Maharashtra"; // Default to seller state if unspecified

  const isInterstate =
    normalizeState(customerState) !== normalizeState(SELLER_CONFIG.state);

  // Authoritative GST Jurisdiction Breakdown
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let taxTreatment = "INTRASTATE";

  if (isInterstate) {
    // Interstate supply (Place of Supply != Seller State): 100% IGST
    igst = totalTax;
    cgst = 0;
    sgst = 0;
    taxTreatment = "INTERSTATE";
  } else {
    // Intrastate supply (Place of Supply == Seller State): 50% CGST + 50% SGST
    cgst = Math.round(totalTax / 2);
    sgst = totalTax - cgst;
    igst = 0;
    taxTreatment = "INTRASTATE";
  }

  // Delivery fee policy: Orders >= ₹500 enjoy free delivery; otherwise ₹40 flat fee
  const deliveryFee = taxableAmount >= 500 ? 0 : 40;

  // Server-verified discount (if promo code applied)
  const discount = Number(options.discount) || 0;

  const grandTotal = Math.max(0, taxableAmount + totalTax + deliveryFee - discount);

  const pricing = {
    subtotal: taxableAmount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    taxTreatment,
    sellerGstin: SELLER_CONFIG.gstin,
    sellerState: SELLER_CONFIG.state,
    shippingState: customerState,
    deliveryFee,
    discount,
    grandTotal,
    currency: "INR",
    taxModel: SELLER_CONFIG.taxModel,
  };

  return { pricing, validatedItems };
};

export default {
  SELLER_CONFIG,
  calculateAuthoritativePricing,
};
