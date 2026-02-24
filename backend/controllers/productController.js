import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { redisGetJson, redisSetJson, redisDel, redisDeleteByPattern } from '../utils/redisClient.js';

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
    const product = await Product.create(req.body);

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
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
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
