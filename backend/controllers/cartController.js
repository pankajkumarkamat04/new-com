import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price image isActive stock')
      .lean();

    if (!cart) {
      return res.json({ success: true, data: { items: [], userId: req.user._id } });
    }

    // Filter out inactive or deleted products, map to cart item format
    const validItems = cart.items
      .filter((item) => item.productId && item.productId.isActive)
      .map((item) => ({
        productId: item.productId._id,
        product: item.productId,
        quantity: item.quantity,
      }));

    res.json({ success: true, data: { items: validItems } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [{ productId, quantity: qty }],
      });
    } else {
      const existingIndex = cart.items.findIndex(
        (i) => i.productId.toString() === productId
      );
      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += qty;
      } else {
        cart.items.push({ productId, quantity: qty });
      }
      await cart.save();
    }

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'name price image isActive stock')
      .lean();

    const items = (populated?.items || [])
      .filter((i) => i.productId && i.productId.isActive)
      .map((i) => ({ productId: i.productId._id.toString(), product: i.productId, quantity: i.quantity }));

    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const index = cart.items.findIndex((i) => i.productId.toString() === productId);

    if (index >= 0) {
      if (qty === 0) {
        cart.items.splice(index, 1);
      } else {
        cart.items[index].quantity = qty;
      }
      await cart.save();
    }

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'name price image isActive stock')
      .lean();

    const items = (populated?.items || [])
      .filter((i) => i.productId && i.productId.isActive)
      .map((i) => ({ productId: i.productId._id.toString(), product: i.productId, quantity: i.quantity }));

    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.json({ success: true, data: { items: [] } });
    }

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate('items.productId', 'name price image isActive stock')
      .lean();

    const items = (populated?.items || [])
      .filter((i) => i.productId && i.productId.isActive)
      .map((i) => ({ productId: i.productId._id.toString(), product: i.productId, quantity: i.quantity }));

    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const mergeCart = async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]
    if (!Array.isArray(items) || items.length === 0) {
      const cart = await Cart.findOne({ userId: req.user._id })
        .populate('items.productId', 'name price image isActive stock')
        .lean();
      return res.json({ success: true, data: cart || { items: [] } });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    const productIds = new Set();

    for (const item of items) {
      const pid = item.productId;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (!pid || productIds.has(pid)) continue;

      const product = await Product.findById(pid);
      if (!product || !product.isActive) continue;

      productIds.add(pid);

      if (!cart) {
        cart = await Cart.create({
          userId: req.user._id,
          items: [{ productId: pid, quantity: qty }],
        });
      } else {
        const existingIndex = cart.items.findIndex((i) => i.productId.toString() === pid);
        if (existingIndex >= 0) {
          cart.items[existingIndex].quantity += qty;
        } else {
          cart.items.push({ productId: pid, quantity: qty });
        }
      }
    }

    if (cart && cart.items.length > 0) {
      await cart.save();
    }

    let resultItems = [];
    if (cart) {
      const populated = await Cart.findById(cart._id)
        .populate('items.productId', 'name price image isActive stock')
        .lean();
      resultItems = (populated?.items || [])
        .filter((i) => i.productId && i.productId.isActive)
        .map((i) => ({ productId: i.productId._id.toString(), product: i.productId, quantity: i.quantity }));
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
