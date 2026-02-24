import express from 'express';
import * as blogController from '../controllers/blogController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes - define before slug route so /admin is not captured by :slug
router.get('/admin', protectAdmin, blogController.adminListPosts);
router.get('/admin/:id', protectAdmin, blogController.adminGetPost);
router.post('/admin', protectAdmin, blogController.adminCreatePost);
router.put('/admin/:id', protectAdmin, blogController.adminUpdatePost);
router.delete('/admin/:id', protectAdmin, blogController.adminDeletePost);

// Public routes
router.get('/', blogController.listPublicPosts);
router.get('/:slug', blogController.getPublicPostBySlug);

export default router;

