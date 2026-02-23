import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { protectUser } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require user auth
router.get('/', protectUser, cartController.getCart);
router.post('/', protectUser, cartController.addToCart);
router.put('/', protectUser, cartController.updateCartItem);
router.post('/merge', protectUser, cartController.mergeCart);
router.delete('/items/:productId', protectUser, cartController.removeFromCart);
router.delete('/', protectUser, cartController.clearCart);

export default router;
