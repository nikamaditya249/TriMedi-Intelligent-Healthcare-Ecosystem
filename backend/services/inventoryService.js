import mongoose from "mongoose";
import Product from "../models/Product.js";
import { defaultProducts } from "../data/defaultProducts.js";
import { logClinicalAudit } from "./auditService.js";
import eventBus from "./eventBus.js";

// Concurrency lock for in-memory / fallback store operations
let inMemoryLock = Promise.resolve();
const acquireLock = () => {
  let release;
  const p = new Promise((resolve) => {
    release = resolve;
  });
  const lock = inMemoryLock.then(() => release);
  inMemoryLock = inMemoryLock.then(() => p);
  return lock;
};

/**
 * Reserve stock atomically for order checkout
 * Ensures no two users can reserve the same last unit (concurrency safe).
 *
 * @param {Array} items - List of order items [{ productId, quantity }]
 * @param {String} orderId - Associated TriMedi order ID
 * @param {Object} actor - Authenticated user identity
 * @returns {Promise<{ success: boolean, reservedItems: Array }>}
 */
export const reserveStock = async (items = [], orderId = "DRAFT", actor = null) => {
  const reservedProducts = [];

  try {
    if (mongoose.connection.readyState === 1) {
      // 1. Database-backed atomic conditional update
      for (const item of items) {
        const prodId = item.productId || item._id;
        const requestedQty = Math.max(1, Number(item.quantity) || Number(item.qty) || 1);

        if (!mongoose.isValidObjectId(prodId)) {
          continue; // In-memory/fallback product check below
        }

        // Atomic update: only increment reservedQuantity if (stockQuantity - reservedQuantity) >= requestedQty
        const updated = await Product.findOneAndUpdate(
          {
            _id: prodId,
            $expr: {
              $gte: [{ $subtract: ["$stockQuantity", "$reservedQuantity"] }, requestedQty],
            },
            active: true,
          },
          {
            $inc: { reservedQuantity: requestedQty },
          },
          { new: true }
        );

        if (!updated) {
          // Insufficient stock or concurrency conflict! Roll back previously reserved items in this order
          for (const reserved of reservedProducts) {
            await Product.findByIdAndUpdate(reserved.productId, {
              $inc: { reservedQuantity: -reserved.quantity },
            });
          }

          const product = await Product.findById(prodId).lean();
          const available = product ? Math.max(0, product.stockQuantity - product.reservedQuantity) : 0;
          throw new Error(
            `Insufficient stock for "${product?.name || item.name || "medication"}". Requested: ${requestedQty}, Available: ${available}`
          );
        }

        reservedProducts.push({
          productId: updated._id.toString(),
          name: updated.name,
          quantity: requestedQty,
        });

        // Trigger low-stock alert if available drops below threshold
        const newAvailable = Math.max(0, updated.stockQuantity - updated.reservedQuantity);
        if (newAvailable <= updated.lowStockThreshold) {
          eventBus.emit("INVENTORY_LOW_STOCK", {
            productId: updated._id.toString(),
            name: updated.name,
            sku: updated.sku,
            available: newAvailable,
            threshold: updated.lowStockThreshold,
          });
        }
      }

      await logClinicalAudit({
        actor,
        action: "STOCK_RESERVED",
        resourceType: "INVENTORY",
        resourceId: orderId,
        details: { items: reservedProducts },
      });

      return { success: true, reservedItems: reservedProducts };
    }

    // 2. Resilient In-Memory with serialized concurrency lock
    const release = await acquireLock();
    try {
      for (const item of items) {
        const prodId = String(item.productId || item._id);
        const requestedQty = Math.max(1, Number(item.quantity) || Number(item.qty) || 1);

        const prod = defaultProducts.find((p) => String(p._id) === prodId || p.name.toLowerCase() === (item.name || "").toLowerCase());
        if (!prod) continue;

        const available = (prod.stockQuantity || 100) - (prod.reservedQuantity || 0);
        if (available < requestedQty) {
          // Roll back previously reserved in this batch
          for (const reserved of reservedProducts) {
            const rollbackProd = defaultProducts.find((p) => String(p._id) === reserved.productId);
            if (rollbackProd) {
              rollbackProd.reservedQuantity = Math.max(0, (rollbackProd.reservedQuantity || 0) - reserved.quantity);
              rollbackProd.availableQuantity = rollbackProd.stockQuantity - rollbackProd.reservedQuantity;
            }
          }
          throw new Error(
            `Insufficient stock for "${prod.name}". Requested: ${requestedQty}, Available: ${available}`
          );
        }

        prod.reservedQuantity = (prod.reservedQuantity || 0) + requestedQty;
        prod.availableQuantity = Math.max(0, prod.stockQuantity - prod.reservedQuantity);
        reservedProducts.push({
          productId: String(prod._id),
          name: prod.name,
          quantity: requestedQty,
        });
      }

      await logClinicalAudit({
        actor,
        action: "STOCK_RESERVED",
        resourceType: "INVENTORY",
        resourceId: orderId,
        details: { items: reservedProducts },
      });

      return { success: true, reservedItems: reservedProducts };
    } finally {
      release();
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Commit stock permanently upon verified payment confirmation
 * Decrements both stockQuantity and reservedQuantity.
 */
export const commitStock = async (items = [], orderId = "", actor = null) => {
  try {
    if (mongoose.connection.readyState === 1) {
      for (const item of items) {
        const prodId = item.productId || item._id;
        const qty = Math.max(1, Number(item.quantity) || Number(item.qty) || 1);

        if (mongoose.isValidObjectId(prodId)) {
          await Product.findOneAndUpdate(
            { _id: prodId },
            {
              $inc: {
                stockQuantity: -qty,
                reservedQuantity: -qty,
              },
            }
          );
        }
      }
    } else {
      const release = await acquireLock();
      try {
        for (const item of items) {
          const prodId = String(item.productId || item._id);
          const qty = Math.max(1, Number(item.quantity) || Number(item.qty) || 1);
          const prod = defaultProducts.find((p) => String(p._id) === prodId || p.name.toLowerCase() === (item.name || "").toLowerCase());
          if (prod) {
            prod.stockQuantity = Math.max(0, (prod.stockQuantity || 100) - qty);
            prod.reservedQuantity = Math.max(0, (prod.reservedQuantity || 0) - qty);
            prod.availableQuantity = Math.max(0, prod.stockQuantity - prod.reservedQuantity);
          }
        }
      } finally {
        release();
      }
    }

    await logClinicalAudit({
      actor,
      action: "STOCK_COMMITTED",
      resourceType: "INVENTORY",
      resourceId: orderId,
      details: { itemsCount: items.length },
    });

    return { success: true };
  } catch (err) {
    console.error("Stock commit error:", err.message);
    throw err;
  }
};

/**
 * Release reserved stock if payment fails, expires, or order is rejected
 * Restores availability.
 */
export const releaseStock = async (items = [], orderId = "", actor = null) => {
  try {
    if (mongoose.connection.readyState === 1) {
      for (const item of items) {
        const prodId = item.productId || item._id;
        const qty = Math.max(1, Number(item.quantity) || Number(item.qty) || 1);

        if (mongoose.isValidObjectId(prodId)) {
          await Product.findOneAndUpdate(
            { _id: prodId },
            {
              $inc: { reservedQuantity: -qty },
            }
          );
        }
      }
    } else {
      const release = await acquireLock();
      try {
        for (const item of items) {
          const prodId = String(item.productId || item._id);
          const qty = Math.max(1, Number(item.quantity) || Number(item.qty) || 1);
          const prod = defaultProducts.find((p) => String(p._id) === prodId || p.name.toLowerCase() === (item.name || "").toLowerCase());
          if (prod) {
            prod.reservedQuantity = Math.max(0, (prod.reservedQuantity || 0) - qty);
            prod.availableQuantity = Math.max(0, (prod.stockQuantity || 100) - prod.reservedQuantity);
          }
        }
      } finally {
        release();
      }
    }

    await logClinicalAudit({
      actor,
      action: "STOCK_RELEASED",
      resourceType: "INVENTORY",
      resourceId: orderId,
      details: { itemsCount: items.length },
    });

    return { success: true };
  } catch (err) {
    console.error("Stock release error:", err.message);
    return { success: false, error: err.message };
  }
};

export default {
  reserveStock,
  commitStock,
  releaseStock,
};
