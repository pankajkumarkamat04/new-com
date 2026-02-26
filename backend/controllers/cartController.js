import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price image isActive stock tax variations')
      .lean();

    if (!cart) {
      return res.json({ success: true, data: { items: [], userId: req.user._id } });
    }

    // Filter out inactive or deleted products, map to cart item format
    const validItems = cart.items
      .filter((item) => item.productId && item.productId.isActive)
      .map((item) => {
        const prod = item.productId;
        const price = item.price ?? prod.price;
        return {
          productId: prod._id.toString(),
          product: { ...(prod.toObject?.() || prod), price },
          quantity: item.quantity,
          variationName: item.variationName || '',
          variationAttributes: item.variationAttributes || [],
          price,
        };
      });

    res.json({ success: true, data: { items: validItems } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variationName, variationAttributes, price } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const vName = variationName && String(variationName).trim() ? String(variationName).trim() : '';
    const vAttrs = Array.isArray(variationAttributes)
      ? variationAttributes.filter((a) => a && (a.name || a.value)).map((a) => ({ name: String(a.name || '').trim(), value: String(a.value || '').trim() }))
      : [];
    const effectivePrice = typeof price === 'number' && price >= 0 ? price : product.price;

    const newItem = {
      productId,
      quantity: qty,
      ...(vName && { variationName: vName }),
      ...(vAttrs.length > 0 && { variationAttributes: vAttrs }),
      ...(effectivePrice !== product.price && { price: effectivePrice }),
    };

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [newItem],
      });
    } else {
      const existingIndex = cart.items.findIndex((i) => {
        const sameProduct = i.productId.toString() === productId;
        const sameVar = (i.variationName || '') === vName;
        return sameProduct && sameVar;
      });
      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += qty;
      } else {
        cart.items.push(newItem);
      }
      cart.recoveryEmailSentAt = null;
      await cart.save();
    }

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'name price image isActive stock tax variations')
      .lean();

    const items = (populated?.items || [])
      .filter((i) => i.productId && i.productId.isActive)
      .map((i) => ({
        productId: i.productId._id.toString(),
        product: { ...i.productId, price: i.price ?? i.productId.price },
        quantity: i.quantity,
        variationName: i.variationName || '',
        variationAttributes: i.variationAttributes || [],
        price: i.price,
      }));

    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity, variationName } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const vName = variationName != null ? String(variationName).trim() : '';
    const index = cart.items.findIndex((i) => i.productId.toString() === productId && (i.variationName || '') === vName);

    if (index >= 0) {
      if (qty === 0) {
        cart.items.splice(index, 1);
      } else {
        cart.items[index].quantity = qty;
      }
      cart.recoveryEmailSentAt = null;
      await cart.save();
    }

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'name price image isActive stock tax variations')
      .lean();

    const items = (populated?.items || [])
      .filter((i) => i.productId && i.productId.isActive)
      .map((i) => ({
        productId: i.productId._id.toString(),
        product: { ...i.productId, price: i.price ?? i.productId.price },
        quantity: i.quantity,
        variationName: i.variationName || '',
        variationAttributes: i.variationAttributes || [],
        price: i.price,
      }));

    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const variationName = (req.query.variationName != null ? String(req.query.variationName) : '').trim();
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.json({ success: true, data: { items: [] } });
    }

    cart.items = cart.items.filter((i) => !(i.productId.toString() === productId && (i.variationName || '') === variationName));
    cart.recoveryEmailSentAt = null;
    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'name price image isActive stock tax variations')
      .lean();

    const items = (populated?.items || [])
      .filter((i) => i.productId && i.productId.isActive)
      .map((i) => ({
        productId: i.productId._id.toString(),
        product: { ...i.productId, price: i.price ?? i.productId.price },
        quantity: i.quantity,
        variationName: i.variationName || '',
        variationAttributes: i.variationAttributes || [],
        price: i.price,
      }));

    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const mergeCart = async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity, variationName?, variationAttributes?, price? }]
    if (!Array.isArray(items) || items.length === 0) {
      const cart = await Cart.findOne({ userId: req.user._id })
        .populate('items.productId', 'name price image isActive stock tax variations')
        .lean();
      return res.json({ success: true, data: cart || { items: [] } });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    const seen = new Set();

    for (const item of items) {
      const pid = item.productId;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const vName = (item.variationName && String(item.variationName).trim()) || '';
      const vAttrs = Array.isArray(item.variationAttributes)
        ? item.variationAttributes.filter((a) => a && (a.name || a.value)).map((a) => ({ name: String(a.name || '').trim(), value: String(a.value || '').trim() }))
        : [];
      const lineKey = `${pid}::${vName}`;
      if (!pid || seen.has(lineKey)) continue;

      const product = await Product.findById(pid);
      if (!product || !product.isActive) continue;

      seen.add(lineKey);
      const effectivePrice = typeof item.price === 'number' && item.price >= 0 ? item.price : product.price;
      const newItem = {
        productId: pid,
        quantity: qty,
        ...(vName && { variationName: vName }),
        ...(vAttrs.length > 0 && { variationAttributes: vAttrs }),
        ...(effectivePrice !== product.price && { price: effectivePrice }),
      };

      if (!cart) {
        cart = await Cart.create({
          userId: req.user._id,
          items: [newItem],
        });
      } else {
        const existingIndex = cart.items.findIndex((i) => i.productId.toString() === pid && (i.variationName || '') === vName);
        if (existingIndex >= 0) {
          cart.items[existingIndex].quantity += qty;
        } else {
          cart.items.push(newItem);
        }
      }
    }

    if (cart && cart.items.length > 0) {
      cart.recoveryEmailSentAt = null;
      await cart.save();
    }

    let resultItems = [];
    if (cart) {
      const populated = await Cart.findById(cart._id)
        .populate('items.productId', 'name price image isActive stock tax variations')
        .lean();
      resultItems = (populated?.items || [])
        .filter((i) => i.productId && i.productId.isActive)
        .map((i) => ({
          productId: i.productId._id.toString(),
          product: { ...i.productId, price: i.price ?? i.productId.price },
          quantity: i.quantity,
          variationName: i.variationName || '',
          variationAttributes: i.variationAttributes || [],
          price: i.price,
        }));
    }

    res.json({ success: true, data: { items: resultItems } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { items: [] } },
      { new: true }
    );
    res.json({ success: true, data: { items: [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
