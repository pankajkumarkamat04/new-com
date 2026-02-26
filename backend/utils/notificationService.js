/**
 * Notification service - sends Email, SMS, WhatsApp based on admin settings.
 * Runs asynchronously (fire-and-forget) - does not block main operations.
 */

import nodemailer from 'nodemailer';
import Settings from '../models/Settings.js';

async function getNotificationSettings() {
  const settings = await Settings.getSettings();
  return settings.notifications || {};
}

async function sendEmail(to, subject, text, html) {
  const cfg = (await getNotificationSettings()).email;
  if (!cfg?.enabled || !cfg.smtpHost || !cfg.fromEmail) {
    return { ok: false, reason: 'Email not configured' };
  }
  try {
    const transport = nodemailer.createTransport({
      host: cfg.smtpHost,
      port: cfg.smtpPort || 587,
      secure: !!cfg.smtpSecure,
      auth: cfg.smtpUser && cfg.smtpPass ? { user: cfg.smtpUser, pass: cfg.smtpPass } : undefined,
    });
    await transport.sendMail({
      from: cfg.fromName ? `"${cfg.fromName}" <${cfg.fromEmail}>` : cfg.fromEmail,
      to,
      subject: subject || 'Notification',
      text: text || '',
      html: html || text || '',
    });
    return { ok: true };
  } catch (err) {
    console.error('[Notification] Email send error:', err.message);
    return { ok: false, error: err.message };
  }
}

async function sendSms(to, body) {
  const cfg = (await getNotificationSettings()).sms;
  if (!cfg?.enabled || !cfg.apiKey || !cfg.fromNumber) {
    return { ok: false, reason: 'SMS not configured' };
  }
  try {
    const accountSid = cfg.apiKey;
    const authToken = cfg.apiSecret;
    const from = cfg.fromNumber;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const encoded = new URLSearchParams({
      To: to,
      From: from,
      Body: body || '',
    });
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encoded.toString(),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Twilio SMS: ${res.status} ${errBody}`);
    }
    return { ok: true };
  } catch (err) {
    console.error('[Notification] SMS send error:', err.message);
    return { ok: false, error: err.message };
  }
}

async function sendWhatsApp(to, body) {
  const cfg = (await getNotificationSettings()).whatsapp;
  if (!cfg?.enabled || !cfg.apiKey) {
    return { ok: false, reason: 'WhatsApp not configured' };
  }
  try {
    const accountSid = cfg.apiKey;
    const authToken = cfg.apiSecret;
    const from = cfg.phoneNumberId ? `whatsapp:${cfg.phoneNumberId}` : (cfg.fromNumber ? `whatsapp:${cfg.fromNumber}` : null);
    if (!from) {
      return { ok: false, reason: 'WhatsApp from number/ID not set' };
    }
    const toNum = to.startsWith('whatsapp:') ? to : `whatsapp:${to.replace(/^\+/, '')}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const encoded = new URLSearchParams({
      To: toNum,
      From: from,
      Body: body || '',
    });
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encoded.toString(),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Twilio WhatsApp: ${res.status} ${errBody}`);
    }
    return { ok: true };
  } catch (err) {
    console.error('[Notification] WhatsApp send error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Fire-and-forget: send notifications to user based on enabled channels.
 * @param {Object} opts
 * @param {string} [opts.email] - recipient email
 * @param {string} [opts.phone] - recipient phone (E.164, e.g. +1234567890)
 * @param {string} opts.type - 'signup' | 'order_placed' | 'order_status' | 'abandoned_cart'
 * @param {Object} [opts.data] - extra data (user, order, newStatus, siteName, etc.)
 */
export function sendNotification(opts) {
  const { email, phone, type, data = {} } = opts;
  const siteName = data.siteName || 'ShopNow';

  const run = async () => {
    const settings = await Settings.getSettings();
    const notif = settings.notifications || {};
    const ns = settings.siteName || siteName;

    const buildSubject = () => {
      if (type === 'signup') return `Welcome to ${ns}`;
      if (type === 'order_placed') return `Order Confirmation - ${ns}`;
      if (type === 'order_status') return `Order Update - ${ns}`;
      if (type === 'abandoned_cart') return `You left items in your cart - ${ns}`;
      return `${ns} - Notification`;
    };

    const buildBody = () => {
      if (type === 'signup') {
        const name = data.userName || 'User';
        return `Hi ${name}, welcome to ${ns}! Thank you for signing up.`;
      }
      if (type === 'order_placed') {
        const orderId = data.orderId || 'N/A';
        const total = data.total != null ? data.total : '';
        const currency = data.currency || 'INR';
        return `Your order #${orderId} has been placed successfully. Total: ${currency} ${total}. Thank you for shopping with ${ns}!`;
      }
      if (type === 'order_status') {
        const orderId = data.orderId || 'N/A';
        const newStatus = data.newStatus || '';
        return `Your order #${orderId} status has been updated to: ${newStatus}.`;
      }
      if (type === 'abandoned_cart') {
        const name = data.userName || 'Customer';
        const cartUrl = data.cartUrl || (data.siteUrl ? `${data.siteUrl.replace(/\/$/, '')}/cart` : '/cart');
        return `Hi ${name}, you left some items in your cart at ${ns}. Complete your purchase: ${cartUrl}`;
      }
      return 'You have a new notification.';
    };

    const body = buildBody();
    const subject = buildSubject();

    const promises = [];

    if (email && notif.email?.enabled) {
      promises.push(
        sendEmail(email, subject, body, `<p>${body.replace(/\n/g, '<br>')}</p>`)
          .catch((e) => console.error('[Notification] Email error:', e))
      );
    }
    if (phone && notif.sms?.enabled) {
      promises.push(
        sendSms(phone, body).catch((e) => console.error('[Notification] SMS error:', e))
      );
    }
    if (phone && notif.whatsapp?.enabled) {
      promises.push(
        sendWhatsApp(phone, body).catch((e) => console.error('[Notification] WhatsApp error:', e))
      );
    }

    await Promise.allSettled(promises);
  };

  if (!email && !phone) return;
  setImmediate(() => run().catch((e) => console.error('[Notification] run error:', e)));
}
