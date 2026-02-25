import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Coupon from '../models/Coupon.js';
import { sendNotification } from '../utils/notificationService.js';

const getEffectiveCheckoutConfig = async () => {
  const settings = await Settings.getSettings();
  const raw = settings.checkout || {};
  const normalize = (fieldKey, defaults) => {
    const field = raw[fieldKey] || {};
    return {
      enabled: field.enabled !== false,
      required: field.required === true || (field.required === undefined ? defaults.required : !!field.required),
    };
  };
  return {
    name: normalize('name', { required: true }),
    address: normalize('address', { required: true }),
    city: normalize('city', { required: true }),
    state: normalize('state', { required: false }),
    zip: normalize('zip', { required: true }),
    phone: normalize('phone', { required: true }),
  };
};

const getEffectivePaymentConfig = async () => {
  const settings = await Settings.getSettings();
  const raw = settings.payment || {};
  return {
    currency: raw.currency || 'INR',
    cod: raw.cod?.enabled !== false,
    razorpay: !!raw.razorpay?.enabled,
    cashfree: !!raw.cashfree?.enabled,
  };
};

export const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod: requestedMethod, couponCode: rawCouponCode } = req.body;
    const { name, address, city, state, zip, phone, customFields } = shippingAddress || {};

    const checkout = await getEffectiveCheckoutConfig();
    const paymentConfig = await getEffectivePaymentConfig();

    const allowedMethods = [];
    if (paymentConfig.cod) allowedMethods.push('cod');
    if (paymentConfig.razorpay) allowedMethods.push('razorpay');
    if (paymentConfig.cashfree) allowedMethods.push('cashfree');

    const paymentMethod = requestedMethod && typeof requestedMethod === 'string'
      ? requestedMethod.trim().toLowerCase()
      : 'cod';
    if (!allowedMethods.length) {
      return res.status(400).json({ success: false, message: 'No payment methods are enabled. Please contact support.' });
    }
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or disabled payment method. Allowed: ${allowedMethods.join(', ')}`,
      });
    }
    const missing = [];
    if (checkout.name.enabled && checkout.name.required && !name?.trim()) missing.push('name');
    if (checkout.address.enabled && checkout.address.required && !address?.trim()) missing.push('address');
    if (checkout.city.enabled && checkout.city.required && !city?.trim()) missing.push('city');
    if (checkout.zip.enabled && checkout.zip.required && !zip?.trim()) missing.push('zip');
    if (checkout.phone.enabled && checkout.phone.required && !phone?.trim()) missing.push('phone');

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required shipping fields: ' + missing.join(', '),
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price isActive stock');

    if (!cart || !cart.items?.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const orderItems = [];
    let total = 0;

    for (const item of cart.items) {
      if (!item.productId || !item.productId.isActive) continue;
      const price = item.productId.price;
      const qty = Math.max(1, item.quantity);
      orderItems.push({
        productId: item.productId._id,
        name: item.productId.name,
        price,
        quantity: qty,
      });
      total += price * qty;
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items in cart' });
    }

    let discountAmount = 0;
    let appliedCouponCode = null;

    if (rawCouponCode && typeof rawCouponCode === 'string' && rawCouponCode.trim()) {
      const settings = await Settings.getSettings();
      if (settings.couponEnabled) {
        const coupon = await Coupon.findOne({ code: rawCouponCode.trim().toUpperCase(), isActive: true });
        if (coupon) {
          const now = new Date();
          const notStarted = coupon.startDate && now < coupon.startDate;
          const expired = coupon.endDate && now > coupon.endDate;
          const limitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
          const belowMin = coupon.minOrderAmount > 0 && total < coupon.minOrderAmount;

          if (!notStarted && !expired && !limitReached && !belowMin) {
            if (coupon.discountType === 'percentage') {
              discountAmount = (total * coupon.discountValue) / 100;
              if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
              }
            } else {
              discountAmount = coupon.discountValue;
            }
            discountAmount = Math.min(Math.round(discountAmount * 100) / 100, total);
            appliedCouponCode = coupon.code;
            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
          }
        }
      }
    }

    const finalTotal = Math.round((total - discountAmount) * 100) / 100;

    const normalizedCustomFields = Array.isArray(customFields)
      ? customFields
          .filter((f) => f && (f.key || f.label) && f.value)
          .map((f) => ({
            key: String(f.key || '').trim(),
            label: String(f.label || '').trim() || String(f.key || '').trim(),
            value: String(f.value || '').trim(),
          }))
      : [];

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      total: finalTotal,
      ...(appliedCouponCode && { couponCode: appliedCouponCode }),
      ...(discountAmount > 0 && { discountAmount }),
      shippingAddress: {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: (state || '').trim(),
        zip: zip.trim(),
        phone: phone.trim(),
        customFields: normalizedCustomFields,
      },
      status: 'pending',
      paymentMethod,
    });

    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { items: [] } }
    );

    const recipientEmail = req.user.email || undefined;
    const recipientPhone = phone?.trim() || req.user.phone || undefined;

    sendNotification({
      email: recipientEmail,
      phone: recipientPhone,
      type: 'order_placed',
      data: {
        orderId: String(order._id),
        total: finalTotal,
        currency: (await getEffectivePaymentConfig()).currency,
      },
    });

    const populated = await Order.findById(order._id).lean();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: list all orders
export const adminListOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [orders, total] = await Promise.all([
      Order.find(query).populate('userId', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Order.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limitNum);
    res.json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page, 10), limit: limitNum, total, pages },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: get order by id
export const adminGetOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone').lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: update order status
export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status required: ' + allowed.join(', ') });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = order.userId;
    if (user) {
      const recipientEmail = user.email || undefined;
      const recipientPhone = order.shippingAddress?.phone || user.phone || undefined;

      sendNotification({
        email: recipientEmail,
        phone: recipientPhone,
        type: 'order_status',
        data: {
          orderId: String(order._id),
          newStatus: status,
        },
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
