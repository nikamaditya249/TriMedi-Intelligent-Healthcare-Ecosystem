import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { defaultProducts } from "../data/defaultProducts.js";

const router = express.Router();

/* GET ALL PRODUCTS */
router.get("/", async (req, res) => {
  const search = (req.query.search || "").trim();
  const category = (req.query.category || "All").trim();

  // 1. If MongoDB is connected, query DB
  if (mongoose.connection.readyState === 1) {
    try {
      const query = {};
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }
      if (category && category !== "All") {
        query.category = category;
      }

      const products = await Product.find(query);
      if (products && products.length > 0) {
        return res.json(products);
      }
    } catch (err) {
      console.warn("DB query warning, falling back to default products:", err.message);
    }
  }

  // 2. Fallback / Immediate in-memory dataset
  let result = defaultProducts;
  if (search) {
    result = result.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (category && category !== "All") {
    result = result.filter((p) => p.category === category);
  }

  return res.json(result);
});

/* ADD PRODUCT */
router.post("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const newProduct = new Product(req.body);
      const saved = await newProduct.save();
      return res.json(saved);
    }
    const fallbackProduct = { _id: String(Date.now()), ...req.body };
    defaultProducts.unshift(fallbackProduct);
    return res.json(fallbackProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;