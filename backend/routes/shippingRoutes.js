import express from 'express';
import * as shippingController from '../controllers/shippingController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: get shipping options for address (query: country, state, zip, subtotal, itemCount)
router.get('/options', shippingController.getShippingOptions);

// Admin: zones
router.get('/admin/zones', protectAdmin, shippingController.adminListZones);
router.post('/admin/zones', protectAdmin, shippingController.adminCreateZone);
router.put('/admin/zones/:id', protectAdmin, shippingController.adminUpdateZone);
router.delete('/admin/zones/:id', protectAdmin, shippingController.adminDeleteZone);

// Admin: methods (under a zone)
router.get('/admin/zones/:zoneId/methods', protectAdmin, shippingController.adminListMethods);
router.post('/admin/zones/:zoneId/methods', protectAdmin, shippingController.adminCreateMethod);
router.put('/admin/methods/:id', protectAdmin, shippingController.adminUpdateMethod);
router.delete('/admin/methods/:id', protectAdmin, shippingController.adminDeleteMethod);

export default router;
