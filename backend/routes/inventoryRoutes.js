import express from 'express';
import { body } from 'express-validator';
import * as inventoryController from '../controllers/inventoryController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protectAdmin, inventoryController.listInventory);
router.get('/product/:productId', protectAdmin, inventoryController.getInventoryByProduct);

router.post(
  '/add',
  protectAdmin,
  [
    body('productId').notEmpty().withMessage('Product ID required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('reason').optional().trim(),
    body('notes').optional().trim(),
  ],
  inventoryController.addStock
);

router.post(
  '/adjust',
  protectAdmin,
  [
    body('productId').notEmpty().withMessage('Product ID required'),
    body('quantity').isInt().withMessage('Quantity required'),
    body('reason').optional().trim(),
    body('notes').optional().trim(),
  ],
  inventoryController.adjustStock
);

export default router;
