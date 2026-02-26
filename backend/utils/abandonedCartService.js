/**
 * Abandoned Cart Recovery Service
 * Finds carts abandoned for X hours, sends recovery emails when enabled.
 */

import Cart from '../models/Cart.js';
import Settings from '../models/Settings.js';
import { sendNotification } from './notificationService.js';

/** Hours of inactivity before a cart is considered abandoned */
const ABANDONED_HOURS = 24;

/**
 * Run abandoned cart recovery.
 * Call this from a cron job (e.g. every hour).
 * @returns {Promise<{ sent: number; skipped: number; errors: string[] }>}
 */
export async function runAbandonedCartRecovery() {
  const result = { sent: 0, skipped: 0, errors: [] };

  const settings = await Settings.getSettings();
  if (!settings.abandonedCartEnabled) {
    return result;
  }

  const cutoff = new Date(Date.now() - ABANDONED_HOURS * 60 * 60 * 1000);

  const carts = await Cart.find({
    'items.0': { $exists: true },
    updatedAt: { $lte: cutoff },
    $or: [
      { recoveryEmailSentAt: null },
      { recoveryEmailSentAt: { $exists: false } },
    ],
  })
    .populate('userId', 'name email phone')
    .lean();

  const siteUrl = (settings.siteUrl || '').trim();
  const baseUrl = siteUrl ? siteUrl.replace(/\/$/, '') : '';
  const cartUrl = baseUrl ? `${baseUrl}/cart` : '/cart';

  for (const cart of carts) {
    const user = cart.userId;
    if (!user) {
      result.skipped++;
      continue;
    }

    const email = user.email?.trim();
    if (!email) {
      result.skipped++;
      continue;
    }

    try {
      await sendNotification({
        email,
        phone: user.phone,
        type: 'abandoned_cart',
        data: {
          siteName: settings.siteName || 'ShopNow',
          userName: user.name || 'Customer',
          cartUrl,
          siteUrl: baseUrl,
        },
      });

      await Cart.findByIdAndUpdate(cart._id, {
        $set: { recoveryEmailSentAt: new Date() },
      });
      result.sent++;
    } catch (err) {
      result.errors.push(`Cart ${cart._id}: ${err.message}`);
    }
  }

  return result;
}
