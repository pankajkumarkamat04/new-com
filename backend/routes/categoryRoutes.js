import express from 'express';
import { body } from 'express-validator';
import * as categoryController from '../controllers/categoryController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

const createCategoryValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

const updateCategoryValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes (protected)
router.post('/', protectAdmin, createCategoryValidation, categoryController.createCategory);
router.put('/:id', protectAdmin, updateCategoryValidation, categoryController.updateCategory);
router.delete('/:id', protectAdmin, categoryController.deleteCategory);

export default router;
