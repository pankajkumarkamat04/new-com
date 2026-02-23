import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
];

// All routes require admin auth
router.get('/', protectAdmin, userController.listUsers);
router.get('/:id', protectAdmin, userController.getUserById);
router.put('/:id', protectAdmin, updateUserValidation, userController.updateUser);
router.delete('/:id', protectAdmin, userController.deleteUser);

export default router;
