import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: false,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true }, // Snapshot price at time of purchase
  qty: { type: Number, required: true, default: 1 },
  supplyDays: { type: Number, default: 15 }, // Estimated days of supply purchased
  prescriptionRef: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true }, // Human readable ID like ORD-9912
    patientId: {
      type: String,
      required: false,
    },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientPhone: { type: String, default: "" },
    prescriptionId: {
      type: String,
      required: false,
    },
    prescriptionRef: { type: String, default: "" },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    deliveryAddress: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      street: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    paymentMethod: {
      type: String,
      enum: ["paypal", "cod", "upi"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["CREATED", "PENDING", "APPROVED", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    paypalOrderId: { type: String, default: "" },
    paypalCaptureId: { type: String, default: "" },
    paypalPayerEmail: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "processing", "dispensed", "delivered", "cancelled"],
      default: "pending",
    },
    pharmacyName: { type: String, default: "MedPlus Prime Pharmacy" },
    supplyDaysEstimate: { type: Number, default: 15 },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
