import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { redisGetJson, redisSetJson, redisDel, redisDeleteByPattern } from '../utils/redisClient.js';

function processProductBody(body, existingProduct = null) {
  const data = { ...body };

  const hasVariations = Array.isArray(data.variations) && data.variations.length > 0;

  if (hasVariations) {
    // Product has variations: don't generate product-level SKU
    // Use a base SKU only for generating variation SKUs (reuse from existing if possible)
    const extractBase = (sku) => (sku && typeof sku === 'string' ? sku.replace(/-V\d+$/i, '') : null);
    const existingBase = extractBase(existingProduct?.variations?.[0]?.sku) || extractBase(existingProduct?.sku);
    const baseSku = existingBase || Product.generateProductSku();

    data.variations = data.variations.map((v, idx) => {
      const vCopy = { ...v };
      if (vCopy.stockManagement === 'inventory') {
        if (!vCopy.sku || !vCopy.sku.trim()) {
          vCopy.sku = Product.generateVariationSku(baseSku, idx);
        }
      } else {
        vCopy.sku = '';
      }
      return vCopy;
    });

    // Set product.sku to default variation's SKU (for display/inventory reference)
    const defaultIdx = Math.max(
      0,
      Math.min(data.defaultVariationIndex ?? 0, data.variations.length - 1)
    );
    const defaultVar = data.variations[defaultIdx];
    const defaultSku =
      defaultVar?.stockManagement === 'inventory' && defaultVar?.sku
        ? defaultVar.sku
        : data.variations.find((v) => v.stockManagement === 'inventory' && v.sku)?.sku || '';
    data.sku = data.stockManagement === 'manual' ? '' : defaultSku;
  } else {
    // No variations: product-level SKU
    if (data.stockManagement === 'inventory') {
      if (!data.sku || !data.sku.trim()) {
        data.sku = Product.generateProductSku();
      }
    } else {
      data.sku = '';
    }
  }

  return data;
}

export const getProducts = async (req, res) => {
  try {
    const { category, isActive, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.name = { $regex: search, $options: 'i' };

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const cacheKey = `products:list:category=${category || 'all'}:isActive=${isActive ?? 'any'}:search=${search || ''}:page=${pageNum}:limit=${limitNum}`;

    // Try Redis cache first
    const cached = await redisGetJson(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const skip = (pageNum - 1) * limitNum;
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const total = await Product.countDocuments(query);

    const response = {
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };

    // Cache list response for a short time
    await redisSetJson(cacheKey, response, 120);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const cacheKey = `products:item:${id}`;

    // Try Redis cache first
    const cached = await redisGetJson(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const response = { success: true, data: product };

    // Cache individual product
    await redisSetJson(cacheKey, response, 300);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const body = processProductBody(req.body);
    const product = await Product.create(body);

    // Invalidate cached product lists so new product appears
    await redisDeleteByPattern('products:list:');

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const body = processProductBody(req.body, existing);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      body,
      { returnDocument: 'after', runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    // Invalidate caches for this product and any lists
    await redisDel(`products:item:${req.params.id}`);
    await redisDeleteByPattern('products:list:');

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Invalidate caches for this product and any lists
    await redisDel(`products:item:${req.params.id}`);
    await redisDeleteByPattern('products:list:');

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
