import { validationResult } from 'express-validator';
import Settings from '../models/Settings.js';
import { PUBLIC_SETTINGS_CACHE_KEY, redisGetJson, redisSetJson, redisDel } from '../utils/redisClient.js';

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

    // Invalidate cached public settings so next request rebuilds from DB
    await redisDel(PUBLIC_SETTINGS_CACHE_KEY);

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

    // Invalidate cached public settings so next request rebuilds from DB
    await redisDel(PUBLIC_SETTINGS_CACHE_KEY);

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
      logoSource: header.logoSource === 'custom' ? 'custom' : 'general',
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

    const { logoSource, logoImageUrl, navLinks, showBrowseButton, showCartIcon } = req.body;

    const headerUpdate = {};
    if (logoSource === 'general' || logoSource === 'custom') headerUpdate['header.logoSource'] = logoSource;
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
      logoSource: header.logoSource === 'custom' ? 'custom' : 'general',
      logoImageUrl: header.logoImageUrl || '',
      navLinks: Array.isArray(header.navLinks) ? header.navLinks : [],
      showBrowseButton: header.showBrowseButton !== false,
      showCartIcon: header.showCartIcon !== false,
    };

    // Invalidate cached public settings so next request rebuilds from DB
    await redisDel(PUBLIC_SETTINGS_CACHE_KEY);

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
    backgroundColor: raw?.backgroundColor != null ? String(raw.backgroundColor).trim() : '',
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
    const { columns, copyrightText, showSocial, variant, backgroundColor } = req.body;
    const footerUpdate = {};
    if (Array.isArray(columns)) {
      footerUpdate['footer.columns'] = columns
        .filter((col) => col && (col.title || (col.type === 'about' && col.content) || (col.links && col.links.length) || ['social', 'contact'].includes(col.type)))
        .map(normalizeFooterColumn);
    }
    if (copyrightText !== undefined) footerUpdate['footer.copyrightText'] = String(copyrightText).trim();
    if (showSocial !== undefined) footerUpdate['footer.showSocial'] = !!showSocial;
    if (variant !== undefined) footerUpdate['footer.variant'] = variant === 'light' ? 'light' : 'dark';
    if (backgroundColor !== undefined) {
      footerUpdate['footer.backgroundColor'] = String(backgroundColor || '').trim();
    }

    await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: footerUpdate },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    const settings = await Settings.getSettings();
    const data = buildDefaultFooterSettings(settings.footer || {});
    // Invalidate cached public settings so next request rebuilds from DB
    await redisDel(PUBLIC_SETTINGS_CACHE_KEY);
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

const PAYMENT_MASK = '********';

function buildDefaultPaymentSettings(raw) {
  return {
    currency: raw?.currency && PAYMENT_CURRENCIES.includes(String(raw.currency).toUpperCase())
      ? String(raw.currency).toUpperCase()
      : 'INR',
    cod: { enabled: raw?.cod?.enabled !== false },
    razorpay: {
      enabled: !!raw?.razorpay?.enabled,
      keyId: (raw?.razorpay?.keyId && String(raw.razorpay.keyId).trim()) || '',
      keySecret: (raw?.razorpay?.keySecret && String(raw.razorpay.keySecret).trim()) || '',
    },
    cashfree: {
      enabled: !!raw?.cashfree?.enabled,
      appId: (raw?.cashfree?.appId && String(raw.cashfree.appId).trim()) || '',
      secretKey: (raw?.cashfree?.secretKey && String(raw.cashfree.secretKey).trim()) || '',
      env: (raw?.cashfree?.env === 'production' ? 'production' : 'sandbox'),
    },
  };
}

/** Payment settings safe for public (no secrets); includes razorpay.keyId for checkout. */
function buildPublicPaymentSettings(raw) {
  const full = buildDefaultPaymentSettings(raw);
  return {
    currency: full.currency,
    cod: full.cod,
    razorpay: { enabled: full.razorpay.enabled, keyId: full.razorpay.keyId },
    cashfree: { enabled: full.cashfree.enabled, env: full.cashfree.env },
  };
}

export const getPaymentSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const payment = settings.payment || {};
    const data = buildDefaultPaymentSettings(payment);
    // Mask secrets when sending to client (admin can leave as-is to keep current value)
    if (data.razorpay.keySecret) data.razorpay.keySecret = PAYMENT_MASK;
    if (data.cashfree.secretKey) data.cashfree.secretKey = PAYMENT_MASK;
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
    if (razorpay) {
      if (typeof razorpay.enabled !== 'undefined') updates['payment.razorpay.enabled'] = !!razorpay.enabled;
      if (razorpay.keyId !== undefined) updates['payment.razorpay.keyId'] = String(razorpay.keyId || '').trim();
      if (razorpay.keySecret !== undefined && razorpay.keySecret !== '' && razorpay.keySecret !== PAYMENT_MASK) {
        updates['payment.razorpay.keySecret'] = String(razorpay.keySecret).trim();
      }
    }
    if (cashfree) {
      if (typeof cashfree.enabled !== 'undefined') updates['payment.cashfree.enabled'] = !!cashfree.enabled;
      if (cashfree.appId !== undefined) updates['payment.cashfree.appId'] = String(cashfree.appId || '').trim();
      if (cashfree.secretKey !== undefined && cashfree.secretKey !== '' && cashfree.secretKey !== PAYMENT_MASK) {
        updates['payment.cashfree.secretKey'] = String(cashfree.secretKey).trim();
      }
      if (cashfree.env !== undefined) updates['payment.cashfree.env'] = cashfree.env === 'production' ? 'production' : 'sandbox';
    }

    await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    const settings = await Settings.getSettings();
    const data = buildDefaultPaymentSettings(settings.payment || {});
    if (data.razorpay.keySecret) data.razorpay.keySecret = PAYMENT_MASK;
    if (data.cashfree.secretKey) data.cashfree.secretKey = PAYMENT_MASK;
    await redisDel(PUBLIC_SETTINGS_CACHE_KEY);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Login Settings Controller ============

function buildDefaultLoginSettings(raw) {
  const l = raw || {};
  const id = l.loginIdentifier === 'phone' ? 'phone' : 'email';
  const method = l.loginMethod === 'otp' ? 'otp' : 'password';
  return {
    loginIdentifier: id,
    loginMethod: method,
  };
}

export const getLoginSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const login = settings.login || {};
    const data = buildDefaultLoginSettings(login);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLoginSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { loginIdentifier, loginMethod } = req.body;

    const updates = {};
    if (loginIdentifier === 'email' || loginIdentifier === 'phone') updates['login.loginIdentifier'] = loginIdentifier;
    if (loginMethod === 'password' || loginMethod === 'otp') updates['login.loginMethod'] = loginMethod;

    await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    const updated = await Settings.getSettings();
    const data = buildDefaultLoginSettings(updated.login || {});
    await redisDel(PUBLIC_SETTINGS_CACHE_KEY);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Notification Settings Controller ============

function buildDefaultNotificationSettings(raw) {
  const e = raw?.email || {};
  const s = raw?.sms || {};
  const w = raw?.whatsapp || {};
  return {
    email: {
      enabled: !!e.enabled,
      smtpHost: e.smtpHost || '',
      smtpPort: typeof e.smtpPort === 'number' ? e.smtpPort : 587,
      smtpSecure: !!e.smtpSecure,
      smtpUser: e.smtpUser || '',
      smtpPass: e.smtpPass || '',
      fromEmail: e.fromEmail || '',
      fromName: e.fromName || '',
    },
    sms: {
      enabled: !!s.enabled,
      provider: s.provider || 'twilio',
      apiKey: s.apiKey || '',
      apiSecret: s.apiSecret || '',
      fromNumber: s.fromNumber || '',
    },
    whatsapp: {
      enabled: !!w.enabled,
      provider: w.provider || 'twilio',
      apiKey: w.apiKey || '',
      apiSecret: w.apiSecret || '',
      phoneNumberId: w.phoneNumberId || '',
      fromNumber: w.fromNumber || '',
    },
  };
}

export const getNotificationSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const notifications = settings.notifications || {};
    const data = buildDefaultNotificationSettings(notifications);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email, sms, whatsapp } = req.body;

    const updates = {};
    if (email && typeof email === 'object') {
      if (typeof email.enabled === 'boolean') updates['notifications.email.enabled'] = email.enabled;
      if (email.smtpHost !== undefined) updates['notifications.email.smtpHost'] = String(email.smtpHost || '').trim();
      if (email.smtpPort !== undefined) updates['notifications.email.smtpPort'] = parseInt(email.smtpPort, 10) || 587;
      if (typeof email.smtpSecure === 'boolean') updates['notifications.email.smtpSecure'] = email.smtpSecure;
      if (email.smtpUser !== undefined) updates['notifications.email.smtpUser'] = String(email.smtpUser || '').trim();
      if (email.smtpPass !== undefined) updates['notifications.email.smtpPass'] = email.smtpPass || '';
      if (email.fromEmail !== undefined) updates['notifications.email.fromEmail'] = String(email.fromEmail || '').trim();
      if (email.fromName !== undefined) updates['notifications.email.fromName'] = String(email.fromName || '').trim();
    }
    if (sms && typeof sms === 'object') {
      if (typeof sms.enabled === 'boolean') updates['notifications.sms.enabled'] = sms.enabled;
      if (sms.provider !== undefined) updates['notifications.sms.provider'] = String(sms.provider || 'twilio').trim();
      if (sms.apiKey !== undefined) updates['notifications.sms.apiKey'] = String(sms.apiKey || '').trim();
      if (sms.apiSecret !== undefined) updates['notifications.sms.apiSecret'] = sms.apiSecret || '';
      if (sms.fromNumber !== undefined) updates['notifications.sms.fromNumber'] = String(sms.fromNumber || '').trim();
    }
    if (whatsapp && typeof whatsapp === 'object') {
      if (typeof whatsapp.enabled === 'boolean') updates['notifications.whatsapp.enabled'] = whatsapp.enabled;
      if (whatsapp.provider !== undefined) updates['notifications.whatsapp.provider'] = String(whatsapp.provider || 'twilio').trim();
      if (whatsapp.apiKey !== undefined) updates['notifications.whatsapp.apiKey'] = String(whatsapp.apiKey || '').trim();
      if (whatsapp.apiSecret !== undefined) updates['notifications.whatsapp.apiSecret'] = whatsapp.apiSecret || '';
      if (whatsapp.phoneNumberId !== undefined) updates['notifications.whatsapp.phoneNumberId'] = String(whatsapp.phoneNumberId || '').trim();
      if (whatsapp.fromNumber !== undefined) updates['notifications.whatsapp.fromNumber'] = String(whatsapp.fromNumber || '').trim();
    }

    await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    const settings = await Settings.getSettings();
    const data = buildDefaultNotificationSettings(settings.notifications || {});
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Public Combined Settings (General + SEO + Header) ============

export const getPublicSettings = async (req, res) => {
  try {
    // Try Redis cache first
    const cached = await redisGetJson(PUBLIC_SETTINGS_CACHE_KEY);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

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
      logoImageUrl: settings.logoImageUrl || '',
      faviconUrl: settings.faviconUrl || '',
      couponEnabled: !!settings.couponEnabled,
      blogEnabled: !!settings.blogEnabled,
      abandonedCartEnabled: !!settings.abandonedCartEnabled,
      googleAnalyticsEnabled: !!settings.googleAnalyticsEnabled,
      googleAnalyticsId: (settings.googleAnalyticsId || '').trim(),
      facebookPixelEnabled: !!settings.facebookPixelEnabled,
      facebookPixelId: (settings.facebookPixelId || '').trim(),
      companyGstin: (settings.companyGstin || '').trim(),
      taxEnabled: !!settings.taxEnabled,
      defaultTaxPercentage: typeof settings.defaultTaxPercentage === 'number'
        ? Math.max(0, Math.min(100, settings.defaultTaxPercentage))
        : 0,
      whatsappChat: {
        enabled: !!settings.whatsappChat?.enabled,
        position: settings.whatsappChat?.position === 'left' ? 'left' : 'right',
        phoneNumber: (settings.whatsappChat?.phoneNumber || '').trim(),
      },
      shippingEnabled: !!settings.shippingEnabled,
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
    const logoSource = header.logoSource === 'custom' ? 'custom' : 'general';
    const effectiveLogoUrl = logoSource === 'general'
      ? (settings.logoImageUrl || header.logoImageUrl || '')
      : (header.logoImageUrl || settings.logoImageUrl || '');
    const navLinks = Array.isArray(header.navLinks) && header.navLinks.length > 0 ? header.navLinks : [
      { label: 'Shop', href: '/shop' },
      { label: 'Electronics', href: '/shop?category=Electronics' },
      { label: 'Fashion', href: '/shop?category=Fashion' },
    ];
    const headerData = {
      logoSource,
      logoImageUrl: effectiveLogoUrl,
      customLogoImageUrl: header.logoImageUrl || '',
      navLinks,
      showBrowseButton: header.showBrowseButton !== false,
      showCartIcon: header.showCartIcon !== false,
    };

    const checkoutRaw = settings.checkout || {};
    const checkout = buildDefaultCheckoutSettings(checkoutRaw);

    const paymentRaw = settings.payment || {};
    const payment = buildPublicPaymentSettings(paymentRaw);

    const footerRaw = settings.footer || {};
    const footer = buildDefaultFooterSettings(footerRaw);

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

    const homeSection = settings.homeCategorySettings || {};
    const homeCategorySettings = {
      title: homeSection.title || 'Shop by Category',
      description: homeSection.description || '',
      columns: homeSection.columns || 4,
      limit: homeSection.limit || 8,
      showImage: homeSection.showImage !== false,
    };

    const loginRaw = settings.login || {};
    const loginData = buildDefaultLoginSettings(loginRaw);

    const data = {
      general,
      seo: seoData,
      header: headerData,
      footer,
      checkout,
      payment,
      login: loginData,
      homepage: {
        hero,
        homeCategorySettings,
      },
    };

    // Store in Redis for faster subsequent reads
    await redisSetJson(PUBLIC_SETTINGS_CACHE_KEY, data, 300);

    res.json({
      success: true,
      data,
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
      'logoImageUrl', 'faviconUrl',
      'companyGstin',
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

    // Invalidate cached public settings so next request rebuilds from DB
    await redisDel(PUBLIC_SETTINGS_CACHE_KEY);

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Module Settings Controller ============

function buildDefaultModuleSettings(raw) {
  return {
    couponEnabled: !!raw.couponEnabled,
    shippingEnabled: !!raw.shippingEnabled,
    blogEnabled: !!raw.blogEnabled,
    abandonedCartEnabled: !!raw.abandonedCartEnabled,
    salesReportEnabled: !!raw.salesReportEnabled,
    googleAnalyticsEnabled: !!raw.googleAnalyticsEnabled,
    googleAnalyticsId: (raw.googleAnalyticsId || '').trim(),
    facebookPixelEnabled: !!raw.facebookPixelEnabled,
    facebookPixelId: (raw.facebookPixelId || '').trim(),
    taxEnabled: !!raw.taxEnabled,
    defaultTaxPercentage: typeof raw.defaultTaxPercentage === 'number'
      ? Math.max(0, Math.min(100, raw.defaultTaxPercentage))
      : 0,
    whatsappChat: {
      enabled: !!raw.whatsappChat?.enabled,
      position: raw.whatsappChat?.position === 'left' ? 'left' : 'right',
      phoneNumber: (raw.whatsappChat?.phoneNumber || '').trim(),
    },
  };
}

export const getModuleSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const data = buildDefaultModuleSettings(settings);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateModuleSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const updates = {};

    if (req.body.couponEnabled !== undefined) updates.couponEnabled = !!req.body.couponEnabled;
    if (req.body.shippingEnabled !== undefined) updates.shippingEnabled = !!req.body.shippingEnabled;
    if (req.body.blogEnabled !== undefined) updates.blogEnabled = !!req.body.blogEnabled;
    if (req.body.abandonedCartEnabled !== undefined) updates.abandonedCartEnabled = !!req.body.abandonedCartEnabled;
    if (req.body.salesReportEnabled !== undefined) updates.salesReportEnabled = !!req.body.salesReportEnabled;
    if (req.body.googleAnalyticsEnabled !== undefined) updates.googleAnalyticsEnabled = !!req.body.googleAnalyticsEnabled;
    if (req.body.googleAnalyticsId !== undefined) updates.googleAnalyticsId = String(req.body.googleAnalyticsId || '').trim();
    if (req.body.facebookPixelEnabled !== undefined) updates.facebookPixelEnabled = !!req.body.facebookPixelEnabled;
    if (req.body.facebookPixelId !== undefined) updates.facebookPixelId = String(req.body.facebookPixelId || '').trim();
    if (req.body.taxEnabled !== undefined) updates.taxEnabled = !!req.body.taxEnabled;
    if (req.body.defaultTaxPercentage !== undefined) {
      const v = parseFloat(req.body.defaultTaxPercentage);
      updates.defaultTaxPercentage = isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
    }

    const wc = req.body.whatsappChat;
    if (wc && typeof wc === 'object') {
      if (typeof wc.enabled === 'boolean') updates['whatsappChat.enabled'] = wc.enabled;
      if (wc.position === 'left' || wc.position === 'right') updates['whatsappChat.position'] = wc.position;
      if (wc.phoneNumber !== undefined) updates['whatsappChat.phoneNumber'] = String(wc.phoneNumber || '').trim();
    }

    await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    const settings = await Settings.getSettings();
    const data = buildDefaultModuleSettings(settings);

    // Invalidate cached public settings so next request rebuilds from DB
    await redisDel(PUBLIC_SETTINGS_CACHE_KEY);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

