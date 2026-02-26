import express from 'express';
import { body } from 'express-validator';
import * as productController from '../controllers/productController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('description').optional().trim(),
  body('category').optional().trim(),
  body('stockManagement').optional().isIn(['manual', 'inventory']),
  body('sku').optional().trim(),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('image').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

const updateProductValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Valid price required'),
  body('description').optional().trim(),
  body('category').optional().trim(),
  body('stockManagement').optional().isIn(['manual', 'inventory']),
  body('sku').optional().trim(),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('image').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin routes (protected)
router.post('/', protectAdmin, createProductValidation, productController.createProduct);
router.put('/:id', protectAdmin, updateProductValidation, productController.updateProduct);
router.delete('/:id', protectAdmin, productController.deleteProduct);

export default router;
