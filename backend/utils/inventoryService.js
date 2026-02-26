/**
 * Inventory service - updates Product stock and creates Inventory records.
 */

import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';

/**
 * Apply inventory change: update product stock and create inventory record.
 * @param {Object} opts
 * @param {string} opts.productId - Product ID
 * @param {number} opts.quantityChange - Positive for in, negative for out
 * @param {string} opts.type - 'in' | 'out' | 'adjustment'
 * @param {string} [opts.reason] - Reason for change
 * @param {string} [opts.referenceOrderId] - Order ID for sales
 * @param {string} [opts.notes] - Additional notes
 * @returns {Promise<{ success: boolean, newStock?: number, error?: string }>}
 */
export async function applyInventoryChange(opts) {
  const { productId, quantityChange, type, reason = '', referenceOrderId, notes = '' } = opts;

  const product = await Product.findById(productId);
  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  const previousStock = product.stock ?? 0;
  let newStock = previousStock + quantityChange;

  if (newStock < 0) {
    return { success: false, error: `Insufficient stock. Available: ${previousStock}, requested: ${Math.abs(quantityChange)}` };
  }

  product.stock = newStock;
  await product.save();

  await Inventory.create({
    productId,
    quantity: quantityChange,
    type,
    reason: reason || (type === 'in' ? 'Stock added' : type === 'out' ? 'Order' : 'Adjustment'),
    referenceOrderId: referenceOrderId || undefined,
    previousStock,
    newStock,
    notes,
  });

  return { success: true, newStock };
}
