import express from 'express';
import * as reportsController from '../controllers/reportsController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin only: sales report (query: dateFrom, dateTo, status, groupBy)
router.get('/sales', protectAdmin, reportsController.getSalesReport);

export default router;
