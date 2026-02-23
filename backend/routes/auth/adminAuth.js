import express from 'express';
import { body } from 'express-validator';
import * as adminAuthController from '../../controllers/auth/adminAuthController.js';
import { protectAdmin } from '../../middleware/auth.js';

const router = express.Router();

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone required'),
  body().custom((val, { req }) => {
    if (!req.body.email && !req.body.phone) throw new Error('Either email or phone is required');
    return true;
  }),
];

const otpRequestValidation = [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone required'),
  body().custom((val, { req }) => {
    if (!req.body.email && !req.body.phone) throw new Error('Either email or phone is required');
    return true;
  }),
];

const otpLoginValidation = [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone required'),
  body().custom((val, { req }) => {
    if (!req.body.email && !req.body.phone) throw new Error('Either email or phone is required');
    return true;
  }),
  body('otp').notEmpty().isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP required'),
];

router.get('/me', protectAdmin, adminAuthController.getMe);
router.post('/signup', signupValidation, adminAuthController.signup);
router.post('/login/password', [...loginValidation, body('password').notEmpty()], adminAuthController.loginPassword);
router.post('/login/otp/request', otpRequestValidation, adminAuthController.requestOtp);
router.post('/login/otp', otpLoginValidation, adminAuthController.loginOtp);

export default router;
