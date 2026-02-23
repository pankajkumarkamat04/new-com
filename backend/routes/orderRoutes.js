import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { protectUser, protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/', protectUser, orderController.placeOrder);
router.get('/', protectUser, orderController.getMyOrders);

// Admin routes (before /:id so "admin" is not captured as id)
router.get('/admin', protectAdmin, orderController.adminListOrders);
router.get('/admin/:id', protectAdmin, orderController.adminGetOrder);
router.put('/admin/:id/status', protectAdmin, orderController.adminUpdateOrderStatus);

router.get('/:id', protectUser, orderController.getOrderById);

export default router;
