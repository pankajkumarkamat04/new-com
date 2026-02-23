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

// ============ Header Settings Controller ============

export const getHeaderSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const header = settings.header || {};
    const navLinks = Array.isArray(header.navLinks) ? header.navLinks : [
      { label: 'Shop', href: '/shop' },
      { label: 'Electronics', href: '/shop?category=Electronics' },
      { label: 'Fashion', href: '/shop?category=Fashion' },
    ];
    const data = {
      logoImageUrl: header.logoImageUrl || '',
      navLinks,
      showBrowseButton: header.showBrowseButton !== false,
      showCartIcon: header.showCartIcon !== false,
    };
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHeaderSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { logoImageUrl, navLinks, showBrowseButton, showCartIcon } = req.body;

    const headerUpdate = {};
    if (logoImageUrl !== undefined) headerUpdate['header.logoImageUrl'] = String(logoImageUrl).trim();
    if (Array.isArray(navLinks)) {
      headerUpdate['header.navLinks'] = navLinks
        .filter((item) => item && (item.label || item.href))
        .map((item) => ({
          label: String(item.label || '').trim(),
          href: String(item.href || '').trim(),
        }));
    }
    if (showBrowseButton !== undefined) headerUpdate['header.showBrowseButton'] = !!showBrowseButton;
    if (showCartIcon !== undefined) headerUpdate['header.showCartIcon'] = !!showCartIcon;

    const settings = await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: headerUpdate },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    const header = settings.header || {};
    const data = {
      logoImageUrl: header.logoImageUrl || '',
      navLinks: Array.isArray(header.navLinks) ? header.navLinks : [],
      showBrowseButton: header.showBrowseButton !== false,
      showCartIcon: header.showCartIcon !== false,
    };
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Footer Settings Controller ============

const FOOTER_COLUMN_TYPES = ['links', 'about', 'social', 'contact'];

const defaultFooterColumns = () => [
  { type: 'links', title: 'Need Help', content: '', links: [{ label: 'Contact Us', href: '#' }, { label: 'Track Order', href: '#' }, { label: 'FAQs', href: '#' }] },
  { type: 'links', title: 'Company', content: '', links: [{ label: 'About Us', href: '#' }, { label: 'Blogs', href: '#' }] },
  { type: 'links', title: 'More Info', content: '', links: [{ label: 'T&C', href: '#' }, { label: 'Privacy Policy', href: '#' }, { label: 'Shipping Policy', href: '#' }, { label: 'Refund & Return Policy', href: '#' }] },
  { type: 'contact', title: 'Contact', content: '', links: [] },
];

function normalizeFooterColumn(col) {
  const type = col?.type && FOOTER_COLUMN_TYPES.includes(col.type) ? col.type : 'links';
  return {
    type,
    title: String(col?.title || '').trim(),
    content: type === 'about' ? String(col?.content || '').trim() : '',
    links: Array.isArray(col.links)
      ? col.links.filter((l) => l && (l.label || l.href)).map((l) => ({ label: String(l.label || '').trim(), href: String(l.href || '').trim() }))
      : [],
  };
}

function buildDefaultFooterSettings(raw) {
  const columns = Array.isArray(raw?.columns) && raw.columns.length > 0
    ? raw.columns.map(normalizeFooterColumn)
    : defaultFooterColumns();
  return {
    columns,
    copyrightText: raw?.copyrightText != null ? String(raw.copyrightText).trim() : '',
    showSocial: raw?.showSocial !== false,
    variant: raw?.variant === 'light' ? 'light' : 'dark',
  };
}

export const getFooterSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const footer = settings.footer || {};
    const data = buildDefaultFooterSettings(footer);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFooterSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { columns, copyrightText, showSocial, variant } = req.body;
    const footerUpdate = {};
    if (Array.isArray(columns)) {
      footerUpdate['footer.columns'] = columns
        .filter((col) => col && (col.title || (col.type === 'about' && col.content) || (col.links && col.links.length) || ['social', 'contact'].includes(col.type)))
        .map(normalizeFooterColumn);
    }
    if (copyrightText !== undefined) footerUpdate['footer.copyrightText'] = String(copyrightText).trim();
    if (showSocial !== undefined) footerUpdate['footer.showSocial'] = !!showSocial;
    if (variant !== undefined) footerUpdate['footer.variant'] = variant === 'light' ? 'light' : 'dark';

    await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: footerUpdate },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    const settings = await Settings.getSettings();
    const data = buildDefaultFooterSettings(settings.footer || {});
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Checkout Settings Controller ============

const buildDefaultCheckoutSettings = (raw = {}) => {
  const toField = (fieldKey, defaults) => {
    const field = raw[fieldKey] || {};
    return {
      enabled: field.enabled !== false,
      required: field.required === true || (field.required === undefined ? defaults.required : !!field.required),
      label: (field.label || defaults.label),
    };
  };

  const base = {
    name: toField('name', { label: 'Full Name', required: true }),
    address: toField('address', { label: 'Address', required: true }),
    city: toField('city', { label: 'City', required: true }),
    state: toField('state', { label: 'State / Province', required: false }),
    zip: toField('zip', { label: 'ZIP / Postal Code', required: true }),
    phone: toField('phone', { label: 'Phone', required: true }),
  };

  const customFields = Array.isArray(raw.customFields)
    ? raw.customFields
      .filter((f) => f && (f.key || f.label))
      .map((f) => ({
        key: String(f.key || '').trim(),
        label: String(f.label || '').trim() || String(f.key || '').trim(),
        enabled: f.enabled !== false,
        required: !!f.required,
      }))
    : [];

  return {
    ...base,
    customFields,
  };
};

export const getCheckoutSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const checkout = settings.checkout || {};
    const data = buildDefaultCheckoutSettings(checkout);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCheckoutSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowedFields = ['name', 'address', 'city', 'state', 'zip', 'phone'];
    const updates = {};

    for (const field of allowedFields) {
      const value = req.body[field];
      if (value && typeof value === 'object') {
        if (value.enabled !== undefined) {
          updates[`checkout.${field}.enabled`] = !!value.enabled;
        }
        if (value.required !== undefined) {
          updates[`checkout.${field}.required`] = !!value.required;
        }
        if (value.label !== undefined) {
          updates[`checkout.${field}.label`] = String(value.label || '').trim();
        }
      }
    }

    if (Array.isArray(req.body.customFields)) {
      updates['checkout.customFields'] = req.body.customFields
        .filter((f) => f && (f.key || f.label))
        .map((f) => ({
          key: String(f.key || '').trim(),
          label: String(f.label || '').trim() || String(f.key || '').trim(),
          enabled: f.enabled !== false,
          required: !!f.required,
        }));
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    const checkout = settings.checkout || {};
    const data = buildDefaultCheckoutSettings(checkout);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ============ Payment Settings ============

const PAYMENT_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY'];

function buildDefaultPaymentSettings(raw) {
  return {
    currency: raw?.currency && PAYMENT_CURRENCIES.includes(String(raw.currency).toUpperCase())
      ? String(raw.currency).toUpperCase()
      : 'INR',
    cod: { enabled: raw?.cod?.enabled !== false },
    razorpay: { enabled: !!raw?.razorpay?.enabled },
    cashfree: { enabled: !!raw?.cashfree?.enabled },
  };
}

export const getPaymentSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const payment = settings.payment || {};
    const data = buildDefaultPaymentSettings(payment);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { currency, cod, razorpay, cashfree } = req.body;
    const updates = {};
    if (currency !== undefined) {
      const c = String(currency).toUpperCase().trim();
      updates['payment.currency'] = PAYMENT_CURRENCIES.includes(c) ? c : 'INR';
    }
    if (cod && typeof cod.enabled !== 'undefined') updates['payment.cod.enabled'] = !!cod.enabled;
    if (razorpay && typeof razorpay.enabled !== 'undefined') updates['payment.razorpay.enabled'] = !!razorpay.enabled;
    if (cashfree && typeof cashfree.enabled !== 'undefined') updates['payment.cashfree.enabled'] = !!cashfree.enabled;

    await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    const settings = await Settings.getSettings();
    const data = buildDefaultPaymentSettings(settings.payment || {});
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Public Combined Settings (General + SEO + Header) ============

export const getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    const general = {
      siteName: settings.siteName || 'ShopNow',
      siteUrl: settings.siteUrl || '',
      siteTagline: settings.siteTagline || 'Your trusted online shopping destination.',
      contactEmail: settings.contactEmail || '',
      contactPhone: settings.contactPhone || '',
      contactAddress: settings.contactAddress || '',
      facebookUrl: settings.facebookUrl || '',
      instagramUrl: settings.instagramUrl || '',
      twitterUrl: settings.twitterUrl || '',
      linkedinUrl: settings.linkedinUrl || '',
    };

    const seo = settings.seo || {};
    const seoData = {
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

    const header = settings.header || {};
    const navLinks = Array.isArray(header.navLinks) && header.navLinks.length > 0 ? header.navLinks : [
      { label: 'Shop', href: '/shop' },
      { label: 'Electronics', href: '/shop?category=Electronics' },
      { label: 'Fashion', href: '/shop?category=Fashion' },
    ];
    const headerData = {
      logoImageUrl: header.logoImageUrl || '',
      navLinks,
      showBrowseButton: header.showBrowseButton !== false,
      showCartIcon: header.showCartIcon !== false,
    };

    const checkoutRaw = settings.checkout || {};
    const checkout = buildDefaultCheckoutSettings(checkoutRaw);

    const paymentRaw = settings.payment || {};
    const payment = buildDefaultPaymentSettings(paymentRaw);

    const footerRaw = settings.footer || {};
    const footer = buildDefaultFooterSettings(footerRaw);

    res.json({
      success: true,
      data: {
        general,
        seo: seoData,
        header: headerData,
        footer,
        checkout,
        payment,
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
