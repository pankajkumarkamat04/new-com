import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import Settings from '../models/Settings.js';
import Coupon from '../models/Coupon.js';
import ShippingZone from '../models/ShippingZone.js';
import ShippingMethod from '../models/ShippingMethod.js';
import { redisDel, redisDeleteByPattern } from '../utils/redisClient.js';
import { sendNotification } from '../utils/notificationService.js';

function findZoneForAddress(zones, country, state, zip) {
  const countryUpper = (country || '').trim().toUpperCase();
  const stateTrim = (state || '').trim();
  const zipTrim = (zip || '').trim();
  for (const zone of zones) {
    const codes = zone.countryCodes || [];
    const allCountries = codes.length === 0 || codes.includes('*');
    const countryMatch = allCountries || codes.some((c) => (c || '').toUpperCase() === countryUpper);
    if (!countryMatch) continue;
    if (Array.isArray(zone.stateCodes) && zone.stateCodes.length > 0) {
      const stateMatch = zone.stateCodes.some((s) => (s || '').trim().toLowerCase() === stateTrim.toLowerCase());
      if (!stateMatch) continue;
    }
    if (Array.isArray(zone.zipPrefixes) && zone.zipPrefixes.length > 0 && zipTrim) {
      const zipMatch = zone.zipPrefixes.some((p) => (zipTrim || '').startsWith((p || '').trim()));
      if (!zipMatch) continue;
    }
    return zone;
  }
  return null;
}

function calculateShippingCost(method, subtotal, itemCount) {
  if (method.minOrderForFree > 0 && subtotal >= method.minOrderForFree) return 0;
  const rateValue = method.rateValue ?? 0;
  switch (method.rateType) {
    case 'per_item':
      return Math.round(rateValue * itemCount * 100) / 100;
    case 'per_order':
    case 'flat':
    default:
      return rateValue;
  }
}

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
    const { shippingAddress, paymentMethod: requestedMethod, couponCode: rawCouponCode, shippingMethodId, shippingAmount: requestedShippingAmount } = req.body;
    const { name, address, city, state, zip, phone, country, customFields } = shippingAddress || {};

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
      .populate('items.productId', 'name price isActive stock variations tax');

    if (!cart || !cart.items?.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const settings = await Settings.getSettings();
    const taxEnabled = !!settings.taxEnabled;
    const defaultTaxPct = typeof settings.defaultTaxPercentage === 'number'
      ? Math.max(0, Math.min(100, settings.defaultTaxPercentage))
      : 0;

    const orderItems = [];
    let subtotal = 0;
    let totalTax = 0;

    for (const item of cart.items) {
      if (!item.productId || !item.productId.isActive) continue;
      const price = item.price != null ? item.price : item.productId.price;
      const qty = Math.max(1, item.quantity);
      const displayName = item.variationName
        ? `${item.productId.name} - ${item.variationName}`
        : item.productId.name;
      const lineTotal = price * qty;
      subtotal += lineTotal;

      let itemTax = 0;
      if (taxEnabled) {
        const taxConf = item.productId.tax;
        const useCustom = taxConf && (taxConf.value ?? 0) > 0;
        const taxType = useCustom ? (taxConf.taxType || 'percentage') : 'percentage';
        const taxVal = useCustom ? (taxConf.value || 0) : defaultTaxPct;
        if (taxType === 'percentage') {
          itemTax = (lineTotal * taxVal) / 100;
        } else {
          itemTax = taxVal * qty;
        }
        totalTax += Math.round(itemTax * 100) / 100;
      }

      orderItems.push({
        productId: item.productId._id,
        name: displayName,
        price,
        quantity: qty,
        variationName: item.variationName || '',
        variationAttributes: item.variationAttributes || [],
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items in cart' });
    }

    totalTax = Math.round(totalTax * 100) / 100;

    // Stock check - ensure all products have sufficient inventory
    const cartItemsForOrder = cart.items.filter((i) => i.productId && i.productId.isActive);
    for (let i = 0; i < orderItems.length; i++) {
      const orderItem = orderItems[i];
      const cartItem = cartItemsForOrder[i];
      const product = await Product.findById(orderItem.productId).select('name stock variations');
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${orderItem.name} is no longer available.` });
      }
      let available = product.stock ?? 0;
      if (cartItem.variationName && Array.isArray(product.variations) && product.variations.length > 0) {
        const match = product.variations.find((v) => (v.name || '') === (cartItem.variationName || ''));
        if (match) available = match.stock ?? 0;
      }
      if (available < orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${orderItem.name}. Available: ${available}, requested: ${orderItem.quantity}.`,
        });
      }
    }

    let discountAmount = 0;
    let appliedCouponCode = null;

    let shippingAmount = 0;
    let shippingMethodName = null;
    const settingsForShipping = await Settings.getSettings();
    if (settingsForShipping.shippingEnabled) {
      if (shippingMethodId) {
        const method = await ShippingMethod.findById(shippingMethodId).lean();
        if (!method || !method.isActive) {
          return res.status(400).json({ success: false, message: 'Invalid or inactive shipping method.' });
        }
        const zone = await ShippingZone.findById(method.zoneId).lean();
        if (!zone || !zone.isActive) {
          return res.status(400).json({ success: false, message: 'Shipping zone not found or inactive.' });
        }
        const zones = await ShippingZone.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
        const matchedZone = findZoneForAddress(zones, (country || '').trim() || 'IN', (state || '').trim(), (zip || '').trim());
        if (!matchedZone || String(matchedZone._id) !== String(zone._id)) {
          return res.status(400).json({ success: false, message: 'Selected shipping method does not apply to this address.' });
        }
        const itemCount = orderItems.reduce((s, i) => s + i.quantity, 0);
        const expectedAmount = calculateShippingCost(method, subtotal, itemCount);
        const requested = Math.max(0, parseFloat(requestedShippingAmount) || 0);
        if (Math.abs(requested - expectedAmount) > 0.02) {
          return res.status(400).json({ success: false, message: 'Shipping amount mismatch. Please refresh and try again.' });
        }
        shippingAmount = Math.round(expectedAmount * 100) / 100;
        shippingMethodName = method.name || 'Shipping';
      } else {
        // No zone configured or no method selected: use 0 shipping
        const requested = Math.max(0, parseFloat(requestedShippingAmount) || 0);
        if (requested > 0.02) {
          return res.status(400).json({ success: false, message: 'Shipping amount must be 0 when no method is selected.' });
        }
        shippingAmount = 0;
        shippingMethodName = 'Free Shipping';
      }
    }

    if (rawCouponCode && typeof rawCouponCode === 'string' && rawCouponCode.trim()) {
      if (settings.couponEnabled) {
        const coupon = await Coupon.findOne({ code: rawCouponCode.trim().toUpperCase(), isActive: true });
        if (coupon) {
          const now = new Date();
          const notStarted = coupon.startDate && now < coupon.startDate;
          const expired = coupon.endDate && now > coupon.endDate;
          const limitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
          const belowMin = coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount;

          if (!notStarted && !expired && !limitReached && !belowMin) {
            if (coupon.discountType === 'percentage') {
              discountAmount = (subtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
              }
            } else {
              discountAmount = coupon.discountValue;
            }
            discountAmount = Math.min(Math.round(discountAmount * 100) / 100, subtotal);
            appliedCouponCode = coupon.code;
            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
          }
        }
      }
    }

    const finalTotal = Math.round((subtotal - discountAmount + totalTax + shippingAmount) * 100) / 100;

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
      subtotal,
      ...(totalTax > 0 && { taxAmount: totalTax }),
      total: finalTotal,
      ...(appliedCouponCode && { couponCode: appliedCouponCode }),
      ...(discountAmount > 0 && { discountAmount }),
      ...(settingsForShipping.shippingEnabled && {
        ...(shippingMethodId && { shippingMethodId }),
        shippingMethodName: shippingMethodName || 'Free Shipping',
        shippingAmount: shippingAmount ?? 0,
      }),
      shippingAddress: {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: (state || '').trim(),
        zip: zip.trim(),
        phone: phone.trim(),
        ...((country || '').trim() && { country: String(country).trim() }),
        customFields: normalizedCustomFields,
      },
      status: 'pending',
      paymentMethod,
    });

    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { items: [] } }
    );

    // Decrease stock and create inventory records
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const cartItem = cartItemsForOrder[i];
      let previousStock, newStock;

      if (cartItem.variationName && Array.isArray(cartItem.productId.variations) && cartItem.productId.variations.length > 0) {
        const varIdx = cartItem.productId.variations.findIndex((v) => (v.name || '') === (cartItem.variationName || ''));
        if (varIdx >= 0) {
          const product = await Product.findById(item.productId);
          if (product && product.variations && product.variations[varIdx]) {
            previousStock = product.variations[varIdx].stock ?? 0;
            newStock = Math.max(0, previousStock - item.quantity);
            product.variations[varIdx].stock = newStock;
            await product.save();
            await Inventory.create({
              productId: item.productId,
              quantity: -item.quantity,
              type: 'out',
              reason: 'Order',
              referenceOrderId: order._id,
              previousStock,
              newStock,
              sku: product.variations[varIdx].sku || '',
            });
          }
        } else {
          const product = await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } },
            { new: true }
          );
          if (product) {
            previousStock = (product.stock ?? 0) + item.quantity;
            newStock = product.stock ?? 0;
            await Inventory.create({
              productId: item.productId,
              quantity: -item.quantity,
              type: 'out',
              reason: 'Order',
              referenceOrderId: order._id,
              previousStock,
              newStock,
            });
          }
        }
      } else {
        const product = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (product) {
          previousStock = (product.stock ?? 0) + item.quantity;
          newStock = product.stock ?? 0;
          await Inventory.create({
            productId: item.productId,
            quantity: -item.quantity,
            type: 'out',
            reason: 'Order',
            referenceOrderId: order._id,
            previousStock,
            newStock,
          });
        }
      }
      await redisDel(`products:item:${item.productId}`);
    }
    await redisDeleteByPattern('products:list:');

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
