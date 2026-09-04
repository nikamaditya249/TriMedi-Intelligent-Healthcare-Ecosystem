import express from "express";
import Razorpay from "razorpay";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: "YOUR_KEY_ID",
  key_secret: "YOUR_KEY_SECRET",
});

// CREATE ORDER
router.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // paisa
    currency: "INR",
    receipt: "order_rcptid_11",
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;