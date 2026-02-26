import express from 'express';
import { runAbandonedCartRecovery } from '../utils/abandonedCartService.js';

const router = express.Router();

/**
 * Abandoned cart recovery - call from external cron (e.g. every hour).
 * Protect with CRON_SECRET: GET /api/cron/abandoned-cart?secret=YOUR_CRON_SECRET
 * Or Header: X-Cron-Secret: YOUR_CRON_SECRET
 */
router.get('/abandoned-cart', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.query.secret || req.get('X-Cron-Secret');
    if (provided !== secret) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  try {
    const result = await runAbandonedCartRecovery();
    res.json({
      success: true,
      data: {
        sent: result.sent,
        skipped: result.skipped,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('[Cron] Abandoned cart recovery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
