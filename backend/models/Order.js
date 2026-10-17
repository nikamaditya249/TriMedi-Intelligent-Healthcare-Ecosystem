import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: false },
    nameSnapshot: { type: String, required: true },
    skuSnapshot: { type: String, default: "" },
    unitPrice: { type: Number, required: true }, // Authoritative unit price at time of purchase
    quantity: { type: Number, required: true, default: 1 },
    taxRate: { type: Number, default: 0.12 }, // GST rate (e.g., 0.05 or 0.12)
    taxAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true }, // unitPrice * quantity
    supplyDays: { type: Number, default: 15 },
    prescriptionRequired: { type: Boolean, default: false },
    prescriptionRef: { type: String, default: "" },
    // Backward compatibility aliases
    name: { type: String },
    price: { type: Number },
    qty: { type: Number },
  },
  { _id: true }
);

// Pre-save for item backward-compatibility
orderItemSchema.pre("validate", function (next) {
  if (!this.nameSnapshot && this.name) this.nameSnapshot = this.name;
  if (!this.name && this.nameSnapshot) this.name = this.nameSnapshot;
  if (this.unitPrice === undefined && this.price !== undefined) this.unitPrice = this.price;
  if (this.price === undefined && this.unitPrice !== undefined) this.price = this.unitPrice;
  if (!this.quantity && this.qty) this.quantity = this.qty;
  if (!this.qty && this.quantity) this.qty = this.quantity;
  if (this.lineTotal === undefined && this.unitPrice !== undefined && this.quantity !== undefined) {
    this.lineTotal = Math.round(this.unitPrice * this.quantity);
  }
  next();
});

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: String, default: "system" },
    role: { type: String, default: "system" },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const refundSchema = new mongoose.Schema(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "PROCESSED", "FAILED"], default: "PROCESSED" },
    reason: { type: String, default: "Order cancellation / pharmacy rejection" },
    providerRefundRef: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, index: true }, // e.g. ORD-9912
    patientId: { type: String, index: true, required: false },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true, index: true },
    patientPhone: { type: String, default: "" },

    // Prescription Linkage & Clinical Safety
    prescriptionId: { type: String, default: "", index: true },
    prescriptionRef: { type: String, default: "" },
    prescriptionVerified: { type: Boolean, default: false },

    // Items
    items: [orderItemSchema],

    // Authoritative Server-Side Pricing Breakdown (INR & GST)
    pricing: {
      subtotal: { type: Number, required: true },
      taxableAmount: { type: Number, required: true },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      totalTax: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
      currency: { type: String, default: "INR" },
    },
    // Backward-compatible alias for existing queries
    totalAmount: { type: Number, required: true },

    deliveryAddress: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      street: { type: String, default: "" },
      city: { type: String, default: "Mumbai" },
      state: { type: String, default: "Maharashtra" },
      pincode: { type: String, default: "400001" },
    },

    // Payment Engine
    paymentMethod: {
      type: String,
      enum: ["razorpay", "paypal", "cod", "upi"],
      default: "razorpay",
    },
    paymentStatus: {
      type: String,
      enum: ["CREATED", "PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    paymentDetails: {
      provider: { type: String, enum: ["razorpay", "paypal", "cod"], default: "razorpay" },
      paymentId: { type: String, default: "" }, // rzp_payment_id or paypal captureId
      orderId: { type: String, default: "" }, // rzp_order_id or paypal orderId
      signature: { type: String, default: "" },
      signatureVerified: { type: Boolean, default: false },
      amountPaid: { type: Number, default: 0 },
      paidAt: { type: Date, default: null },
      refunds: [refundSchema],
    },

    // Legacy PayPal fields for backward compatibility
    paypalOrderId: { type: String, default: "" },
    paypalCaptureId: { type: String, default: "" },
    paypalPayerEmail: { type: String, default: "" },

    // Authoritative Pharmacy Fulfillment State Machine
    status: {
      type: String,
      enum: [
        "NEW",
        "PRESCRIPTION_REVIEW",
        "ACCEPTED",
        "PREPARING",
        "PACKED",
        "DISPATCHED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
        // Backward-compatible legacy strings
        "pending",
        "processing",
        "dispensed",
        "shipped",
        "delivered",
        "cancelled",
        "Delivered",
        "Processing",
        "Dispensed",
      ],
      default: "NEW",
      index: true,
    },
    statusHistory: [statusHistorySchema],

    // Fulfillment & Dispensary
    pharmacyId: { type: String, default: "pharm_default_medplus", index: true },
    pharmacyName: { type: String, default: "MedPlus Prime Pharmacy" },
    supplyDaysEstimate: { type: Number, default: 15 },

    // Stock Reservation & Concurrency Tracking
    stockReserved: { type: Boolean, default: false },
    stockCommitted: { type: Boolean, default: false },

    // Idempotency & Operational Safety
    idempotencyKey: { type: String, sparse: true, index: true },
    rejectionReason: { type: String, default: "" },
    cancelReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// Pre-save synchronization
orderSchema.pre("validate", function (next) {
  if (!this.orderId) {
    this.orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  }
  if (this.pricing && this.pricing.grandTotal !== undefined) {
    this.totalAmount = this.pricing.grandTotal;
  } else if (this.totalAmount !== undefined) {
    this.pricing = {
      subtotal: this.pricing?.subtotal !== undefined ? this.pricing.subtotal : this.totalAmount,
      taxableAmount: this.pricing?.taxableAmount !== undefined ? this.pricing.taxableAmount : this.totalAmount,
      cgst: this.pricing?.cgst || 0,
      sgst: this.pricing?.sgst || 0,
      igst: this.pricing?.igst || 0,
      totalTax: this.pricing?.totalTax || 0,
      deliveryFee: this.pricing?.deliveryFee || 0,
      discount: this.pricing?.discount || 0,
      grandTotal: this.totalAmount,
      currency: "INR",
    };
  }
  next();
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);

