import express from 'express';
import { body } from 'express-validator';
import * as settingsController from '../controllers/settingsController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

const updateHeroValidation = [
  body('layout').optional().isIn(['carousel', 'single', 'color']).withMessage('Invalid layout'),
  body('colorType').optional().isIn(['single', 'gradient']).withMessage('Invalid colorType'),
  body('color1').optional().trim(),
  body('color2').optional().trim(),
  body('slides').optional().isArray().withMessage('slides must be array'),
  body('slides.*.image').optional().trim(),
  body('slides.*.title').optional().trim(),
  body('slides.*.subtitle').optional().trim(),
  body('slides.*.textColor').optional().trim(),
  body('slides.*.buttonText').optional().trim(),
  body('slides.*.buttonLink').optional().trim(),
  body('slides.*.buttonTextColor').optional().trim(),
  body('slides.*.buttonBgColor').optional().trim(),
  body('slides.*.showText').optional().isBoolean().withMessage('showText must be boolean'),
];

const updateSettingsValidation = [
  body('siteName').optional().trim(),
  body('siteUrl').optional().trim(),
  body('siteTagline').optional().trim(),
  body('contactEmail').optional({ values: 'falsy' }).trim().isEmail().withMessage('Valid email required'),
  body('contactPhone').optional().trim(),
  body('contactAddress').optional().trim(),
  body('facebookUrl').optional().trim(),
  body('instagramUrl').optional().trim(),
  body('twitterUrl').optional().trim(),
  body('linkedinUrl').optional().trim(),
];

const updateHomeCategoriesValidation = [
  body('categories').optional().isArray().withMessage('categories must be array'),
  body('categories.*').optional().isString().trim(),
  body('title').optional().trim(),
  body('description').optional().trim(),
  body('columns').optional().isInt({ min: 1, max: 6 }).withMessage('columns must be between 1 and 6'),
  body('limit').optional().isInt({ min: 1, max: 24 }).withMessage('limit must be between 1 and 24'),
  body('showImage').optional().isBoolean().withMessage('showImage must be boolean'),
];

// Public - get settings (for header, footer, etc.)
router.get('/', settingsController.getSettings);

// Home page combined settings (hero, homeCategories, etc.)
router.get('/homepage', settingsController.getHomePageSettings);

// Hero section - public get, admin update
router.get('/hero', settingsController.getHero);
router.put('/hero', protectAdmin, updateHeroValidation, settingsController.updateHero);

// Home categories - public get, admin update
router.get('/home-categories', settingsController.getHomeCategories);
router.put('/home-categories', protectAdmin, updateHomeCategoriesValidation, settingsController.updateHomeCategories);

// Admin - update settings
router.put('/', protectAdmin, updateSettingsValidation, settingsController.updateSettings);

export default router;
