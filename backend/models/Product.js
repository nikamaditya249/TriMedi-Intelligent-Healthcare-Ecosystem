import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    genericName: { type: String, default: "" },
    brand: { type: String, default: "TriMedi Pharma" },
    strength: { type: String, default: "" }, // e.g. "500mg", "20mg"
    dosageForm: { type: String, default: "Tablet" }, // Tablet, Syrup, Injection, Ointment, etc.
    category: {
      type: String,
      enum: [
        "Medicine",
        "Fitness",
        "Diabetes",
        "Skin Care",
        "Baby Care",
        "Medical Device",
        "Wellness",
        "Personal Care",
        "Ayurvedic",
      ],
      default: "Medicine",
      index: true,
    },
    subcategory: { type: String, default: "" },
    healthConcern: { type: String, default: "" },
    prescriptionRequired: { type: Boolean, default: false, index: true },
    price: { type: Number, required: true }, // Selling price in INR
    mrp: { type: Number, required: true }, // Maximum Retail Price
    taxRate: { type: Number, default: 0.12 }, // Standard GST: 0.05 or 0.12
    hsnCode: { type: String, default: "3004" }, // Harmonized System of Nomenclature for medicaments
    stockQuantity: { type: Number, default: 100, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    availableQuantity: { type: Number, default: 100, min: 0 },
    lowStockThreshold: { type: Number, default: 15 },
    sku: { type: String, unique: true, sparse: true, index: true },
    batchNumber: { type: String, default: "BATCH-2026-A1" },
    expiryDate: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    active: { type: Boolean, default: true, index: true },
    image: { type: String, default: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
    manufacturer: { type: String, default: "TriMedi Healthcare Labs Ltd." },
    description: { type: String, default: "Standard pharmaceutical medication dispensed under licensed medical oversight." },
  },
  { timestamps: true }
);

// Pre-validate hook to clamp reservedQuantity >= 0
productSchema.pre("validate", function (next) {
  if (this.reservedQuantity === undefined || this.reservedQuantity < 0) {
    this.reservedQuantity = 0;
  }
  next();
});

// Pre-save hook to ensure availableQuantity = stockQuantity - reservedQuantity
productSchema.pre("save", function (next) {
  if (this.reservedQuantity === undefined || this.reservedQuantity < 0) {
    this.reservedQuantity = 0;
  }
  this.availableQuantity = Math.max(0, (this.stockQuantity || 0) - (this.reservedQuantity || 0));
  if (!this.mrp || this.mrp < this.price) {
    this.mrp = Math.round(this.price * 1.15);
  }
  if (!this.sku) {
    this.sku = "SKU-" + (this.name || "MED").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) + "-" + Math.floor(100 + Math.random() * 900);
  }
  next();
});

export default mongoose.models.Product || mongoose.model("Product", productSchema);