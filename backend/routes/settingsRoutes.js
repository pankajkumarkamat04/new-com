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
  body('logoImageUrl').optional().trim(),
  body('faviconUrl').optional().trim(),
  body('contactEmail').optional({ values: 'falsy' }).trim().isEmail().withMessage('Valid email required'),
  body('contactPhone').optional().trim(),
  body('contactAddress').optional().trim(),
  body('facebookUrl').optional().trim(),
  body('instagramUrl').optional().trim(),
  body('twitterUrl').optional().trim(),
  body('linkedinUrl').optional().trim(),
  body('companyGstin').optional().trim(),
];

const updateModuleValidation = [
  body('couponEnabled').optional().isBoolean().withMessage('couponEnabled must be boolean'),
  body('shippingEnabled').optional().isBoolean().withMessage('shippingEnabled must be boolean'),
  body('blogEnabled').optional().isBoolean().withMessage('blogEnabled must be boolean'),
  body('abandonedCartEnabled').optional().isBoolean().withMessage('abandonedCartEnabled must be boolean'),
  body('salesReportEnabled').optional().isBoolean().withMessage('salesReportEnabled must be boolean'),
  body('googleAnalyticsEnabled').optional().isBoolean().withMessage('googleAnalyticsEnabled must be boolean'),
  body('googleAnalyticsId').optional().trim(),
  body('facebookPixelEnabled').optional().isBoolean().withMessage('facebookPixelEnabled must be boolean'),
  body('facebookPixelId').optional().trim(),
  body('taxEnabled').optional().isBoolean().withMessage('taxEnabled must be boolean'),
  body('defaultTaxPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('defaultTaxPercentage must be between 0 and 100'),
  body('whatsappChat').optional().isObject(),
  body('whatsappChat.enabled').optional().isBoolean(),
  body('whatsappChat.position').optional().isIn(['left', 'right']),
  body('whatsappChat.phoneNumber').optional().trim(),
];

const updateSeoValidation = [
  body('metaTitle').optional().trim(),
  body('metaDescription').optional().trim(),
  body('metaKeywords').optional().trim(),
  body('ogTitle').optional().trim(),
  body('ogDescription').optional().trim(),
  body('ogImage').optional().trim(),
  body('ogType').optional().trim(),
  body('twitterCard').optional().trim(),
  body('twitterTitle').optional().trim(),
  body('twitterDescription').optional().trim(),
  body('twitterImage').optional().trim(),
  body('canonicalUrl').optional().trim(),
  body('robots').optional().trim(),
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

const updateHeaderValidation = [
  body('logoSource').optional().isIn(['general', 'custom']).withMessage('logoSource must be general or custom'),
  body('logoImageUrl').optional().trim(),
  body('navLinks').optional().isArray().withMessage('navLinks must be array'),
  body('navLinks.*.label').optional().trim(),
  body('navLinks.*.href').optional().trim(),
  body('showBrowseButton').optional().isBoolean().withMessage('showBrowseButton must be boolean'),
  body('showCartIcon').optional().isBoolean().withMessage('showCartIcon must be boolean'),
];

const updateFooterValidation = [
  body('columns').optional().isArray().withMessage('columns must be array'),
  body('columns.*.type').optional().isIn(['links', 'about', 'social', 'contact']).withMessage('column type must be links, about, social, or contact'),
  body('columns.*.title').optional().trim(),
  body('columns.*.content').optional().trim(),
  body('columns.*.links').optional().isArray(),
  body('columns.*.links.*.label').optional().trim(),
  body('columns.*.links.*.href').optional().trim(),
  body('copyrightText').optional().trim(),
  body('showSocial').optional().isBoolean().withMessage('showSocial must be boolean'),
  body('variant').optional().isIn(['light', 'dark']).withMessage('variant must be light or dark'),
  body('backgroundColor').optional().trim(),
];

const updateCheckoutValidation = [
  body('name.enabled').optional().isBoolean().withMessage('name.enabled must be boolean'),
  body('name.required').optional().isBoolean().withMessage('name.required must be boolean'),
  body('name.label').optional().trim(),
  body('address.enabled').optional().isBoolean().withMessage('address.enabled must be boolean'),
  body('address.required').optional().isBoolean().withMessage('address.required must be boolean'),
  body('address.label').optional().trim(),
  body('city.enabled').optional().isBoolean().withMessage('city.enabled must be boolean'),
  body('city.required').optional().isBoolean().withMessage('city.required must be boolean'),
  body('city.label').optional().trim(),
  body('state.enabled').optional().isBoolean().withMessage('state.enabled must be boolean'),
  body('state.required').optional().isBoolean().withMessage('state.required must be boolean'),
  body('state.label').optional().trim(),
  body('zip.enabled').optional().isBoolean().withMessage('zip.enabled must be boolean'),
  body('zip.required').optional().isBoolean().withMessage('zip.required must be boolean'),
  body('zip.label').optional().trim(),
  body('phone.enabled').optional().isBoolean().withMessage('phone.enabled must be boolean'),
  body('phone.required').optional().isBoolean().withMessage('phone.required must be boolean'),
  body('phone.label').optional().trim(),
  body('customFields').optional().isArray().withMessage('customFields must be array'),
  body('customFields.*.key').optional().trim(),
  body('customFields.*.label').optional().trim(),
  body('customFields.*.enabled').optional().isBoolean().withMessage('customFields.enabled must be boolean'),
  body('customFields.*.required').optional().isBoolean().withMessage('customFields.required must be boolean'),
];

const updatePaymentValidation = [
  body('currency').optional().trim().isIn(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']).withMessage('Invalid currency'),
  body('cod.enabled').optional().isBoolean().withMessage('cod.enabled must be boolean'),
  body('razorpay.enabled').optional().isBoolean().withMessage('razorpay.enabled must be boolean'),
  body('razorpay.keyId').optional().trim(),
  body('razorpay.keySecret').optional().trim(),
  body('cashfree.enabled').optional().isBoolean().withMessage('cashfree.enabled must be boolean'),
  body('cashfree.appId').optional().trim(),
  body('cashfree.secretKey').optional().trim(),
  body('cashfree.env').optional().trim().isIn(['sandbox', 'production']).withMessage('cashfree.env must be sandbox or production'),
];

const updateNotificationValidation = [
  body('email').optional().isObject(),
  body('email.enabled').optional().isBoolean(),
  body('email.smtpHost').optional().trim(),
  body('email.smtpPort').optional().isInt({ min: 1, max: 65535 }),
  body('email.smtpSecure').optional().isBoolean(),
  body('email.smtpUser').optional().trim(),
  body('email.smtpPass').optional(),
  body('email.fromEmail').optional().trim(),
  body('email.fromName').optional().trim(),
  body('sms').optional().isObject(),
  body('sms.enabled').optional().isBoolean(),
  body('sms.provider').optional().trim(),
  body('sms.apiKey').optional().trim(),
  body('sms.apiSecret').optional(),
  body('sms.fromNumber').optional().trim(),
  body('whatsapp').optional().isObject(),
  body('whatsapp.enabled').optional().isBoolean(),
  body('whatsapp.provider').optional().trim(),
  body('whatsapp.apiKey').optional().trim(),
  body('whatsapp.apiSecret').optional(),
  body('whatsapp.phoneNumberId').optional().trim(),
  body('whatsapp.fromNumber').optional().trim(),
];

// Public - get full settings document (mostly for admin/tools)
router.get('/', settingsController.getSettings);

// Public - combined basic settings (general, seo, header)
router.get('/public', settingsController.getPublicSettings);

// Home page combined settings (hero, homeCategories, etc.)
router.get('/homepage', settingsController.getHomePageSettings);

// Hero section - public get, admin update
router.get('/hero', settingsController.getHero);
router.put('/hero', protectAdmin, updateHeroValidation, settingsController.updateHero);

// Home categories - public get, admin update
router.get('/home-categories', settingsController.getHomeCategories);
router.put('/home-categories', protectAdmin, updateHomeCategoriesValidation, settingsController.updateHomeCategories);

// SEO - public get, admin update
router.get('/seo', settingsController.getSeoSettings);
router.put('/seo', protectAdmin, updateSeoValidation, settingsController.updateSeoSettings);

// Header - public get, admin update
router.get('/header', settingsController.getHeaderSettings);
router.put('/header', protectAdmin, updateHeaderValidation, settingsController.updateHeaderSettings);

// Footer - public get (via /public), admin get/update
router.get('/footer', settingsController.getFooterSettings);
router.put('/footer', protectAdmin, updateFooterValidation, settingsController.updateFooterSettings);

// Checkout - public get, admin update
router.get('/checkout', settingsController.getCheckoutSettings);
router.put('/checkout', protectAdmin, updateCheckoutValidation, settingsController.updateCheckoutSettings);

// Payment - public get (via /public), admin get/update
router.get('/payment', settingsController.getPaymentSettings);
router.put('/payment', protectAdmin, updatePaymentValidation, settingsController.updatePaymentSettings);

// Notification - admin get/update
router.get('/notifications', protectAdmin, settingsController.getNotificationSettings);
router.put('/notifications', protectAdmin, updateNotificationValidation, settingsController.updateNotificationSettings);

// Login - public get, admin update
router.get('/login', settingsController.getLoginSettings);
router.put('/login', protectAdmin, [
  body('loginIdentifier').optional().isIn(['email', 'phone']),
  body('loginMethod').optional().isIn(['password', 'otp']),
], settingsController.updateLoginSettings);

// Module settings - admin get/update
router.get('/modules', protectAdmin, settingsController.getModuleSettings);
router.put('/modules', protectAdmin, updateModuleValidation, settingsController.updateModuleSettings);

// Admin - update general settings
router.put('/', protectAdmin, updateSettingsValidation, settingsController.updateSettings);

export default router;
