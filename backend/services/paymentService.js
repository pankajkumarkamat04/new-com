import Settings from '../models/Settings.js';

// Lazy load SDKs to avoid startup errors if not installed
let Razorpay;
let Cashfree;

async function getRazorpay() {
  if (!Razorpay) {
    const mod = await import('razorpay');
    Razorpay = mod.default;
  }
  return Razorpay;
}

async function getCashfreeSDK() {
  if (!Cashfree) {
    const mod = await import('cashfree-pg');
    Cashfree = mod;
  }
  return Cashfree;
}

async function getPaymentSettings() {
  const settings = await Settings.getSettings();
  const raw = settings.payment || {};
  return {
    currency: raw.currency || 'INR',
    razorpay: {
      enabled: !!raw.razorpay?.enabled,
      keyId: (raw.razorpay?.keyId && String(raw.razorpay.keyId).trim()) || '',
      keySecret: (raw.razorpay?.keySecret && String(raw.razorpay.keySecret).trim()) || '',
    },
    cashfree: {
      enabled: !!raw.cashfree?.enabled,
      appId: (raw.cashfree?.appId && String(raw.cashfree.appId).trim()) || '',
      secretKey: (raw.cashfree?.secretKey && String(raw.cashfree.secretKey).trim()) || '',
      env: raw.cashfree?.env === 'production' ? 'production' : 'sandbox',
    },
  };
}

/**
 * Create a Razorpay order. Amount in main currency unit (e.g. INR); converted to paise (×100).
 * Returns { orderId, keyId } or throws.
 */
export async function createRazorpayOrder(amount, currency = 'INR', receipt = '') {
  const config = await getPaymentSettings();
  if (!config.razorpay.enabled || !config.razorpay.keyId || !config.razorpay.keySecret) {
    throw new Error('Razorpay is not configured. Add Key ID and Key Secret in Payment Settings.');
  }
  const RazorpaySDK = await getRazorpay();
  const instance = new RazorpaySDK({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
  const amountPaise = Math.round(parseFloat(amount) * 100);
  if (amountPaise < 100) throw new Error('Amount must be at least 1 INR (100 paise).');
  const order = await instance.orders.create({
    amount: amountPaise,
    currency: (currency || 'INR').toUpperCase(),
    receipt: receipt || `rcpt_${Date.now()}`,
  });
  return {
    orderId: order.id,
    keyId: config.razorpay.keyId,
    amountInPaise: amountPaise,
  };
}

/**
 * Verify Razorpay payment signature and optionally that order amount matches.
 */
export async function verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, signature, expectedAmountPaise) {
  const config = await getPaymentSettings();
  if (!config.razorpay.keySecret) throw new Error('Razorpay is not configured.');
  const crypto = await import('crypto');
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac('sha256', config.razorpay.keySecret).update(body).digest('hex');
  if (expected !== signature) return { valid: false, message: 'Invalid signature' };
  if (expectedAmountPaise != null) {
    const RazorpaySDK = await getRazorpay();
    const instance = new RazorpaySDK({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
    const order = await instance.orders.fetch(razorpayOrderId);
    const orderAmount = order.amount;
    if (Number(orderAmount) !== Number(expectedAmountPaise)) {
      return { valid: false, message: 'Order amount mismatch' };
    }
  }
  return { valid: true };
}

/**
 * Create Cashfree order session. Amount in main currency (e.g. 500.50).
 * Returns { orderId, paymentSessionId }.
 */
export async function createCashfreeOrder(orderId, amount, currency, customerDetails, returnUrl) {
  const config = await getPaymentSettings();
  if (!config.cashfree.enabled || !config.cashfree.appId || !config.cashfree.secretKey) {
    throw new Error('Cashfree is not configured. Add App ID and Secret Key in Payment Settings.');
  }
  const mod = await getCashfreeSDK();
  const { Cashfree, CFEnvironment } = mod;
  const env = config.cashfree.env === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  const cashfree = new Cashfree(env, config.cashfree.appId, config.cashfree.secretKey);
  const request = {
    order_id: orderId,
    order_amount: parseFloat(amount),
    order_currency: (currency || 'INR').toUpperCase(),
    customer_details: {
      customer_id: (customerDetails?.customer_id || customerDetails?.customerId || `cust_${Date.now()}`).toString(),
      customer_phone: (customerDetails?.customer_phone || customerDetails?.phone || '9999999999').toString(),
      customer_name: (customerDetails?.customer_name || customerDetails?.name || 'Customer').toString().slice(0, 100),
      customer_email: (customerDetails?.customer_email || customerDetails?.email || 'customer@example.com').toString(),
    },
    order_meta: {
      return_url: returnUrl || 'https://example.com/checkout/success?cf_order_id={order_id}',
    },
  };
  const response = await cashfree.PGCreateOrder(request);
  const data = response?.data;
  const paymentSessionId = data?.payment_session_id;
  if (!paymentSessionId) throw new Error('Cashfree did not return payment session');
  return {
    orderId: request.order_id,
    paymentSessionId,
  };
}

/**
 * Verify Cashfree order is paid by fetching order status.
 */
export async function verifyCashfreePayment(cfOrderId) {
  const config = await getPaymentSettings();
  if (!config.cashfree.appId || !config.cashfree.secretKey) throw new Error('Cashfree is not configured.');
  const mod = await getCashfreeSDK();
  const { Cashfree, CFEnvironment } = mod;
  const env = config.cashfree.env === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  const cashfree = new Cashfree(env, config.cashfree.appId, config.cashfree.secretKey);
  const response = await cashfree.PGFetchOrder(cfOrderId);
  const data = response?.data;
  const status = (data?.order_status ?? '').toLowerCase();
  const paid = status === 'paid' || status === 'active';
  return { paid, orderStatus: status, amount: data?.order_amount };
}
