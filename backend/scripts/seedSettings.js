import 'dotenv/config';
import mongoose from 'mongoose';
import Settings from '../models/Settings.js';

const seedSettings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/new-com');
    console.log('MongoDB Connected');

    const existing = await Settings.findOne({ key: 'site' });
    if (existing) {
      console.log('Settings already exist');
      process.exit(0);
      return;
    }

    await Settings.create({
      key: 'site',
      siteName: 'ShopNow',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      siteTagline: 'Your trusted online shopping destination.',
      contactEmail: '',
      contactPhone: '',
      contactAddress: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      linkedinUrl: '',
    });

    console.log('Settings seeded successfully');
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedSettings();
