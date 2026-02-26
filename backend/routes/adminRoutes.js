import express from 'express';
import { body } from 'express-validator';
import * as adminController from '../controllers/adminController.js';
import { protectSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'superadmin']).withMessage('Role must be admin or superadmin'),
];

const updateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'superadmin']).withMessage('Role must be admin or superadmin'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

router.get('/', protectSuperAdmin, adminController.listAdmins);
router.post('/', protectSuperAdmin, createValidation, adminController.createAdmin);
router.put('/:id', protectSuperAdmin, updateValidation, adminController.updateAdmin);
router.delete('/:id', protectSuperAdmin, adminController.deleteAdmin);

export default router;
