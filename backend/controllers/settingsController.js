import { validationResult } from 'express-validator';
import Settings from '../models/Settings.js';

// ============ Hero Section Controller ============

export const getHero = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const hero = settings.hero || {
      layout: 'single',
      slides: [{ image: '', title: 'Discover Amazing Products', subtitle: 'Shop the latest trends.', buttonText: 'Shop Now', buttonLink: '/shop', showText: true }],
    };
    res.json({ success: true, data: hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHero = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { layout, colorType, color1, color2, slides } = req.body;

    const heroUpdate = {};
    if (layout !== undefined) heroUpdate['hero.layout'] = layout;
    if (colorType !== undefined) heroUpdate['hero.colorType'] = colorType;
    if (color1 !== undefined) heroUpdate['hero.color1'] = String(color1).trim();
    if (color2 !== undefined) heroUpdate['hero.color2'] = String(color2).trim();
    if (Array.isArray(slides)) {
      heroUpdate['hero.slides'] = slides.map((s) => ({
        image: s.image?.trim() || '',
        title: s.title?.trim() || '',
        subtitle: s.subtitle?.trim() || '',
        textColor: s.textColor?.trim() || '',
        buttonText: s.buttonText?.trim() || '',
        buttonLink: s.buttonLink?.trim() || '',
        buttonTextColor: s.buttonTextColor?.trim() || '#ffffff',
        buttonBgColor: s.buttonBgColor?.trim() || '#059669',
        showText: s.showText !== false,
      }));
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: heroUpdate },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.json({ success: true, data: settings.hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Home Page Settings (combined) ============

export const getHomePageSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    const hero = settings.hero || {
      layout: 'single',
      slides: [
        {
          image: '',
          title: 'Discover Amazing Products',
          subtitle: 'Shop the latest trends.',
          buttonText: 'Shop Now',
          buttonLink: '/shop',
          showText: true,
        },
      ],
    };

    const section = settings.homeCategorySettings || {};
    const homeCategorySettings = {
      title: section.title || 'Shop by Category',
      description: section.description || '',
      columns: section.columns || 4,
      limit: section.limit || 8,
      showImage: section.showImage !== false,
    };

    res.json({
      success: true,
      data: {
        hero,
        homeCategorySettings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Home Categories Controller ============

export const getHomeCategories = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const section = settings.homeCategorySettings || {};
    const config = {
      title: section.title || 'Shop by Category',
      description: section.description || '',
      columns: section.columns || 4,
      limit: section.limit || 8,
      showImage: section.showImage !== false,
    };
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHomeCategories = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, columns, limit, showImage } = req.body;
    const sectionUpdate = {};
    if (title !== undefined) sectionUpdate['homeCategorySettings.title'] = String(title).trim();
    if (description !== undefined) sectionUpdate['homeCategorySettings.description'] = String(description).trim();
    if (columns !== undefined) {
      const colNum = Math.max(1, Math.min(6, parseInt(columns, 10) || 4));
      sectionUpdate['homeCategorySettings.columns'] = colNum;
    }
    if (limit !== undefined) {
      const limitNum = Math.max(1, Math.min(24, parseInt(limit, 10) || 8));
      sectionUpdate['homeCategorySettings.limit'] = limitNum;
    }
    if (showImage !== undefined) {
      sectionUpdate['homeCategorySettings.showImage'] = !!showImage;
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'site' },
      {
        $set: {
          ...sectionUpdate,
        },
      },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    const section = settings.homeCategorySettings || {};
    const config = {
      title: section.title || 'Shop by Category',
      description: section.description || '',
      columns: section.columns || 4,
      limit: section.limit || 8,
      showImage: section.showImage !== false,
    };

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ SEO Settings Controller ============

export const getSeoSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const seo = settings.seo || {};
    const data = {
      metaTitle: seo.metaTitle || '',
      metaDescription: seo.metaDescription || '',
      metaKeywords: seo.metaKeywords || '',
      ogTitle: seo.ogTitle || '',
      ogDescription: seo.ogDescription || '',
      ogImage: seo.ogImage || '',
      ogType: seo.ogType || 'website',
      twitterCard: seo.twitterCard || 'summary_large_image',
      twitterTitle: seo.twitterTitle || '',
      twitterDescription: seo.twitterDescription || '',
      twitterImage: seo.twitterImage || '',
      canonicalUrl: seo.canonicalUrl || '',
      robots: seo.robots || 'index, follow',
    };
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSeoSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowed = [
      'metaTitle', 'metaDescription', 'metaKeywords',
      'ogTitle', 'ogDescription', 'ogImage', 'ogType',
      'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
      'canonicalUrl', 'robots',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[`seo.${key}`] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    const seo = settings.seo || {};
    res.json({
      success: true,
      data: {
        metaTitle: seo.metaTitle || '',
        metaDescription: seo.metaDescription || '',
        metaKeywords: seo.metaKeywords || '',
        ogTitle: seo.ogTitle || '',
        ogDescription: seo.ogDescription || '',
        ogImage: seo.ogImage || '',
        ogType: seo.ogType || 'website',
        twitterCard: seo.twitterCard || 'summary_large_image',
        twitterTitle: seo.twitterTitle || '',
        twitterDescription: seo.twitterDescription || '',
        twitterImage: seo.twitterImage || '',
        canonicalUrl: seo.canonicalUrl || '',
        robots: seo.robots || 'index, follow',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ General Settings Controller ============

export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowedFields = [
      'siteName', 'siteUrl', 'siteTagline',
      'contactEmail', 'contactPhone', 'contactAddress',
      'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl',
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
