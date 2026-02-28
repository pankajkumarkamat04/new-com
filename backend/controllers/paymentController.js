import * as paymentService from '../services/paymentService.js';

/**
 * POST /payment/create-razorpay-order
 * Body: { amount, currency?, receipt? }
 * Returns: { orderId, keyId, amountInPaise }
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = '' } = req.body;
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num < 1) {
      return res.status(400).json({ success: false, message: 'Valid amount (≥ 1) is required.' });
    }
    const result = await paymentService.createRazorpayOrder(num, currency, receipt);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create Razorpay order' });
  }
};

/**
 * POST /payment/create-cashfree-session
 * Body: { orderId, amount, currency?, customerDetails?, returnUrl? }
 * Returns: { orderId, paymentSessionId }
 */
export const createCashfreeSession = async (req, res) => {
  try {
    const { orderId, amount, currency = 'INR', customerDetails, returnUrl } = req.body;
    if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
      return res.status(400).json({ success: false, message: 'orderId is required.' });
    }
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }
    const result = await paymentService.createCashfreeOrder(
      orderId.trim(),
      num,
      currency,
      customerDetails || {},
      returnUrl
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create Cashfree session' });
  }
};
