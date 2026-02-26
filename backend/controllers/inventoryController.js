import { validationResult } from 'express-validator';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import { redisDel, redisDeleteByPattern } from '../utils/redisClient.js';

export const listInventory = async (req, res) => {
  try {
    const { productId, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (productId) query.productId = productId;
    if (type && ['in', 'out', 'adjustment'].includes(type)) query.type = type;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [items, total] = await Promise.all([
      Inventory.find(query)
        .populate('productId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Inventory.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page, 10),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInventoryByProduct = async (req, res) => {
  try {
    const items = await Inventory.find({ productId: req.params.productId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const product = await Product.findById(req.params.productId).select('name stock').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: {
        product: { _id: product._id, name: product.name, stock: product.stock },
        movements: items,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { productId, quantity, reason, notes, sku } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10));

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let previousStock;
    let newStock;
    const skuVal = (sku && String(sku).trim()) || null;

    if (skuVal) {
      // Add to specific SKU (product or variation)
      if (product.sku === skuVal && product.stockManagement === 'inventory') {
        previousStock = product.stock || 0;
        newStock = previousStock + qty;
        await Product.findByIdAndUpdate(productId, { $set: { stock: newStock } });
      } else {
        const varIdx = (product.variations || []).findIndex(
          (v) => v.sku === skuVal && v.stockManagement === 'inventory'
        );
        if (varIdx < 0) {
          return res.status(400).json({ success: false, message: 'Invalid SKU for this product' });
        }
        previousStock = product.variations[varIdx].stock || 0;
        newStock = previousStock + qty;
        const key = `variations.${varIdx}.stock`;
        await Product.findByIdAndUpdate(productId, { $set: { [key]: newStock } });
      }
    } else {
      // Legacy: add to product-level stock
      previousStock = product.stock || 0;
      newStock = previousStock + qty;
      await Product.findByIdAndUpdate(productId, { $set: { stock: newStock } });
    }

    await Inventory.create({
      productId,
      quantity: qty,
      type: 'in',
      reason: reason || 'Stock added',
      previousStock,
      newStock,
      notes: notes || '',
      sku: skuVal || '',
    });

    await redisDel(`products:item:${productId}`);
    await redisDeleteByPattern('products:list:');

    const updated = await Product.findById(productId).lean();
    res.status(201).json({
      success: true,
      data: updated,
      message: `Added ${qty} units${skuVal ? ` to ${skuVal}` : ''}. New stock: ${newStock}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { productId, quantity, reason, notes } = req.body;
    const qty = parseInt(quantity, 10);
    if (qty === 0) {
      return res.status(400).json({ success: false, message: 'Quantity cannot be zero' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.stock || 0;
    const newStock = Math.max(0, previousStock + qty);
    const type = qty > 0 ? 'in' : 'out';

    await Product.findByIdAndUpdate(productId, { $set: { stock: newStock } });
    await Inventory.create({
      productId,
      quantity: qty,
      type: 'adjustment',
      reason: reason || 'Manual adjustment',
      previousStock,
      newStock,
      notes: notes || '',
    });

    await redisDel(`products:item:${productId}`);
    await redisDeleteByPattern('products:list:');

    const updated = await Product.findById(productId).lean();
    res.json({
      success: true,
      data: updated,
      message: `Adjusted by ${qty > 0 ? '+' : ''}${qty}. New stock: ${newStock}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
