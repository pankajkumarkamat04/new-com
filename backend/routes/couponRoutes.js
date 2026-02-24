import express from 'express';
import * as couponController from '../controllers/couponController.js';
import { protectAdmin, protectUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/validate', protectUser, couponController.validateCoupon);

router.get('/', protectAdmin, couponController.listCoupons);
router.get('/:id', protectAdmin, couponController.getCoupon);
router.post('/', protectAdmin, couponController.createCoupon);
router.put('/:id', protectAdmin, couponController.updateCoupon);
router.delete('/:id', protectAdmin, couponController.deleteCoupon);

export default router;
