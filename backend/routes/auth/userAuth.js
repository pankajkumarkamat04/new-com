import express from 'express';
import { body } from 'express-validator';
import * as userAuthController from '../../controllers/auth/userAuthController.js';
import { protectUser } from '../../middleware/auth.js';

const router = express.Router();

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body().custom((val, { req }) => {
    if (!req.body.email && !req.body.phone) throw new Error('Either email or phone is required');
    return true;
  }),
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

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email required'),
  body('phone').optional({ values: 'falsy' }).isMobilePhone('any').withMessage('Valid phone required'),
];

router.get('/me', protectUser, userAuthController.getMe);
router.put('/me', protectUser, updateProfileValidation, userAuthController.updateProfile);
router.post('/signup', signupValidation, userAuthController.signup);
router.post('/login/password', [...loginValidation, body('password').notEmpty()], userAuthController.loginPassword);
router.post('/login/otp/request', otpRequestValidation, userAuthController.requestOtp);
router.post('/login/otp', otpLoginValidation, userAuthController.loginOtp);

export default router;
