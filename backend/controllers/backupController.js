import mongoose from 'mongoose';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import Blog from '../models/Blog.js';
import Settings from '../models/Settings.js';
import Media from '../models/Media.js';
import ShippingZone from '../models/ShippingZone.js';
import ShippingMethod from '../models/ShippingMethod.js';
import Inventory from '../models/Inventory.js';

const BACKUP_VERSION = 1;

/** Models in dependency order for restore (no refs first, then refs). select: include normally excluded fields (e.g. password). */
const RESTORE_ORDER = [
  { key: 'settings', Model: Settings },
  { key: 'categories', Model: Category },
  { key: 'users', Model: User, select: '+password' },
  { key: 'admins', Model: Admin, select: '+password' },
  { key: 'products', Model: Product },
  { key: 'shippingzones', Model: ShippingZone },
  { key: 'shippingmethods', Model: ShippingMethod },
  { key: 'coupons', Model: Coupon },
  { key: 'orders', Model: Order },
  { key: 'carts', Model: Cart },
  { key: 'blogs', Model: Blog },
  { key: 'media', Model: Media },
  { key: 'inventories', Model: Inventory },
];

const KEY_TO_ENTRY = Object.fromEntries(RESTORE_ORDER.map((e) => [e.key, e]));

/**
 * Create a full backup of selected collections.
 * GET /api/backup?collections=users,products,categories (optional; default: all)
 * Returns JSON with metadata and data.
 */
export const createBackup = async (req, res) => {
  try {
    const requested = req.query.collections
      ? req.query.collections.split(',').map((c) => c.trim().toLowerCase())
      : null;

    const payload = {
      metadata: {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        collections: [],
      },
      data: {},
    };

    for (const entry of RESTORE_ORDER) {
      const { key, Model, select } = entry;
      if (requested && !requested.includes(key)) continue;

      if (key === 'settings') {
        const settings = await Settings.getSettings();
        payload.data[key] = settings ? [{ ...settings.toObject(), _id: settings._id?.toString() }] : [];
      } else {
        const q = Model.find({});
        if (select) q.select(select);
        const docs = await q.lean();
        payload.data[key] = docs.map((d) => ({
          ...d,
          _id: d._id?.toString(),
        }));
      }
      payload.metadata.collections.push(key);
    }

    const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Restore from backup JSON.
 * POST /api/backup/restore
 * Body: multipart with "file" (JSON file) or JSON body with { data, metadata }.
 * Query: clearBeforeRestore=true (default) to delete existing docs in restored collections.
 */
export const restoreBackup = async (req, res) => {
  try {
    let backup = null;

    if (req.file && req.file.buffer) {
      const raw = req.file.buffer.toString('utf8');
      backup = JSON.parse(raw);
    } else if (req.body && (req.body.data || req.body.metadata)) {
      backup = req.body;
    } else if (req.body && typeof req.body === 'object' && req.body.metadata) {
      backup = req.body;
    }

    if (!backup || !backup.metadata || !backup.data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup: expected JSON with metadata and data',
      });
    }

    const clearBeforeRestore = req.query.clearBeforeRestore !== 'false';
    const results = { inserted: {}, errors: [] };

    for (const key of backup.metadata.collections || Object.keys(backup.data)) {
      const entry = KEY_TO_ENTRY[key];
      if (!entry) {
        results.errors.push({ collection: key, message: 'Unknown collection, skipped' });
        continue;
      }

      const { Model } = entry;
      const docs = Array.isArray(backup.data[key]) ? backup.data[key] : [];

      try {
        if (clearBeforeRestore) await Model.deleteMany({});

        if (docs.length === 0) {
          results.inserted[key] = 0;
          continue;
        }

        const toObjectId = (v) => (v && mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);
        const toInsert = docs.map((d) => {
          const copy = { ...d };
          if (copy._id) copy._id = toObjectId(copy._id);
          if (copy.userId) copy.userId = toObjectId(copy.userId);
          if (copy.productId) copy.productId = toObjectId(copy.productId);
          if (copy.category && typeof copy.category === 'string' && copy.category.length === 24) copy.category = toObjectId(copy.category);
          if (copy.parent) copy.parent = toObjectId(copy.parent);
          if (copy.shippingMethodId) copy.shippingMethodId = toObjectId(copy.shippingMethodId);
          if (copy.zoneId) copy.zoneId = toObjectId(copy.zoneId);
          if (copy.referenceOrderId) copy.referenceOrderId = toObjectId(copy.referenceOrderId);
          if (copy.items && Array.isArray(copy.items)) {
            copy.items = copy.items.map((item) => ({
              ...item,
              productId: item.productId ? toObjectId(item.productId) : item.productId,
            }));
          }
          return copy;
        });

        const result = await Model.insertMany(toInsert);
        results.inserted[key] = result.length;
      } catch (err) {
        results.errors.push({ collection: key, message: err.message });
      }
    }

    res.json({
      success: true,
      message: 'Restore completed',
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
