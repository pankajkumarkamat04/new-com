import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'ShopNow',
    trim: true,
  },
  siteUrl: {
    type: String,
    default: '',
    trim: true,
  },
  siteTagline: {
    type: String,
    default: 'Your trusted online shopping destination.',
    trim: true,
  },
  contactEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },
  contactPhone: {
    type: String,
    default: '',
    trim: true,
  },
  contactAddress: {
    type: String,
    default: '',
    trim: true,
  },
  facebookUrl: {
    type: String,
    default: '',
    trim: true,
  },
  instagramUrl: {
    type: String,
    default: '',
    trim: true,
  },
  twitterUrl: {
    type: String,
    default: '',
    trim: true,
  },
  linkedinUrl: {
    type: String,
    default: '',
    trim: true,
  },
  key: {
    type: String,
    default: 'site',
    unique: true,
  },
  hero: {
    layout: {
      type: String,
      enum: ['carousel', 'single', 'color'],
      default: 'single',
    },
    colorType: {
      type: String,
      enum: ['single', 'gradient'],
      default: 'gradient',
    },
    color1: { type: String, trim: true, default: '#059669' },
    color2: { type: String, trim: true, default: '#047857' },
    slides: [{
      image: { type: String, trim: true, default: '' },
      title: { type: String, trim: true, default: '' },
      subtitle: { type: String, trim: true, default: '' },
      textColor: { type: String, trim: true, default: '' },
      buttonText: { type: String, trim: true, default: '' },
      buttonLink: { type: String, trim: true, default: '' },
      buttonTextColor: { type: String, trim: true, default: '#ffffff' },
      buttonBgColor: { type: String, trim: true, default: '#059669' },
      showText: { type: Boolean, default: true },
    }],
  },
  homeCategorySettings: {
    title: { type: String, trim: true, default: 'Shop by Category' },
    description: { type: String, trim: true, default: '' },
    columns: { type: Number, min: 1, max: 6, default: 4 },
    limit: { type: Number, min: 1, max: 24, default: 8 },
    showImage: { type: Boolean, default: true },
  },
  seo: {
    metaTitle: { type: String, trim: true, default: '' },
    metaDescription: { type: String, trim: true, default: '' },
    metaKeywords: { type: String, trim: true, default: '' },
    ogTitle: { type: String, trim: true, default: '' },
    ogDescription: { type: String, trim: true, default: '' },
    ogImage: { type: String, trim: true, default: '' },
    ogType: { type: String, trim: true, default: 'website' },
    twitterCard: { type: String, trim: true, default: 'summary_large_image' },
    twitterTitle: { type: String, trim: true, default: '' },
    twitterDescription: { type: String, trim: true, default: '' },
    twitterImage: { type: String, trim: true, default: '' },
    canonicalUrl: { type: String, trim: true, default: '' },
    robots: { type: String, trim: true, default: 'index, follow' },
  },
}, {
  timestamps: true,
  collection: 'settings',
});

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: 'site' });
  if (!settings) {
    settings = await this.create({ key: 'site' });
  }
  return settings;
};

export default mongoose.model('Settings', settingsSchema);
