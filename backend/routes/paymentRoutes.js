import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protectUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-razorpay-order', protectUser, paymentController.createRazorpayOrder);
router.post('/create-cashfree-session', protectUser, paymentController.createCashfreeSession);

export default router;
