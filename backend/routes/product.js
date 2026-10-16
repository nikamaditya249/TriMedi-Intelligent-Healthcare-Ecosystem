import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { defaultProducts } from "../data/defaultProducts.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { logClinicalAudit } from "../services/auditService.js";

const router = express.Router();

/* GET ALL PRODUCTS (Public Catalog) */
router.get("/", async (req, res) => {
  const search = (req.query.search || "").trim();
  const category = (req.query.category || "All").trim();
  const prescriptionOnly = req.query.prescriptionRequired === "true";

  // 1. If MongoDB is connected, query DB
  if (mongoose.connection.readyState === 1) {
    try {
      const query = { active: true };
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }
      if (category && category !== "All") {
        query.category = category;
      }
      if (prescriptionOnly) {
        query.prescriptionRequired = true;
      }

      const products = await Product.find(query).sort({ name: 1 });
      if (products && products.length > 0) {
        return res.json(products);
      }
    } catch (err) {
      console.warn("DB query warning, falling back to default products:", err.message);
    }
  }

  // 2. Fallback / Immediate in-memory dataset
  let result = defaultProducts.filter((p) => p.active !== false);
  if (search) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.genericName && p.genericName.toLowerCase().includes(search.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
    );
  }
  if (category && category !== "All") {
    result = result.filter((p) => p.category === category);
  }
  if (prescriptionOnly) {
    result = result.filter((p) => p.prescriptionRequired === true);
  }

  return res.json(result);
});

/* GET INVENTORY TELEMETRY (Pharmacy & Admin Role Protected) */
router.get("/inventory", requireAuth, requireRole(["pharmacy", "admin"]), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const products = await Product.find().sort({ availableQuantity: 1 }).lean();
      const lowStockCount = products.filter(
        (p) => (p.availableQuantity || p.stockQuantity - p.reservedQuantity) <= (p.lowStockThreshold || 15)
      ).length;

      return res.json({
        totalSKUs: products.length,
        lowStockAlerts: lowStockCount,
        products,
      });
    }

    const lowStockCount = defaultProducts.filter(
      (p) => (p.availableQuantity || p.stockQuantity - p.reservedQuantity) <= (p.lowStockThreshold || 15)
    ).length;

    res.json({
      totalSKUs: defaultProducts.length,
      lowStockAlerts: lowStockCount,
      products: defaultProducts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PATCH UPDATE PRODUCT STOCK (Pharmacy & Admin Role Protected) */
router.patch("/:id/stock", requireAuth, requireRole(["pharmacy", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { stockAdjustment, newStockQuantity, lowStockThreshold } = req.body;
    const user = req.user;

    let updatedProduct = null;

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      const prod = await Product.findById(id);
      if (!prod) return res.status(404).json({ message: "Product not found" });

      if (newStockQuantity !== undefined) {
        prod.stockQuantity = Math.max(0, Number(newStockQuantity));
      } else if (stockAdjustment !== undefined) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity + Number(stockAdjustment));
      }

      if (lowStockThreshold !== undefined) {
        prod.lowStockThreshold = Math.max(1, Number(lowStockThreshold));
      }

      prod.availableQuantity = Math.max(0, prod.stockQuantity - prod.reservedQuantity);
      updatedProduct = await prod.save();
    } else {
      const prod = defaultProducts.find((p) => String(p._id) === id);
      if (!prod) return res.status(404).json({ message: "Product not found" });

      if (newStockQuantity !== undefined) {
        prod.stockQuantity = Math.max(0, Number(newStockQuantity));
      } else if (stockAdjustment !== undefined) {
        prod.stockQuantity = Math.max(0, (prod.stockQuantity || 100) + Number(stockAdjustment));
      }
      if (lowStockThreshold !== undefined) {
        prod.lowStockThreshold = Number(lowStockThreshold);
      }
      prod.availableQuantity = Math.max(0, prod.stockQuantity - (prod.reservedQuantity || 0));
      updatedProduct = prod;
    }

    await logClinicalAudit({
      actor: user,
      action: "INVENTORY_STOCK_UPDATED",
      resourceType: "PRODUCT",
      resourceId: String(id),
      details: {
        productName: updatedProduct.name,
        newStock: updatedProduct.stockQuantity,
        available: updatedProduct.availableQuantity,
      },
    });

    res.json({
      message: "Stock updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST ADD PRODUCT (Admin / Pharmacy Protected) */
router.post("/", requireAuth, requireRole(["admin", "pharmacy"]), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const newProduct = new Product(req.body);
      const saved = await newProduct.save();
      return res.status(201).json(saved);
    }
    const fallbackProduct = { _id: String(Date.now()), ...req.body };
    defaultProducts.unshift(fallbackProduct);
    return res.status(201).json(fallbackProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;