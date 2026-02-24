import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';

export const listCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Coupon.countDocuments(),
    ]);

    res.json({
      success: true,
      data: coupons,
      pagination: { page: parseInt(page, 10), limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, startDate, endDate, isActive } = req.body;

    if (!code?.trim()) return res.status(400).json({ success: false, message: 'Coupon code is required' });
    if (!discountValue || discountValue <= 0) return res.status(400).json({ success: false, message: 'Discount value must be greater than 0' });

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Coupon code already exists' });

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit: usageLimit || 0,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isActive: isActive !== false,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, startDate, endDate, isActive } = req.body;

    const updates = {};
    if (code !== undefined) {
      const existing = await Coupon.findOne({ code: code.trim().toUpperCase(), _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Coupon code already exists' });
      updates.code = code.trim().toUpperCase();
    }
    if (discountType !== undefined) updates.discountType = discountType;
    if (discountValue !== undefined) updates.discountValue = discountValue;
    if (minOrderAmount !== undefined) updates.minOrderAmount = minOrderAmount;
    if (maxDiscount !== undefined) updates.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) updates.usageLimit = usageLimit;
    if (startDate !== undefined) updates.startDate = startDate || null;
    if (endDate !== undefined) updates.endDate = endDate || null;
    if (isActive !== undefined) updates.isActive = isActive;

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    if (!settings.couponEnabled) {
      return res.status(400).json({ success: false, message: 'Coupons are not enabled' });
    }

    const { code, orderTotal } = req.body;
    if (!code?.trim()) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return res.status(400).json({ success: false, message: 'Coupon is not yet active' });
    }
    if (coupon.endDate && now > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    const total = parseFloat(orderTotal) || 0;
    if (coupon.minOrderAmount > 0 && total < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount is ${coupon.minOrderAmount}` });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (total * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, total);

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: Math.round(discount * 100) / 100,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
