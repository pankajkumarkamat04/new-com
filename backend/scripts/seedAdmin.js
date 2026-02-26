import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

const SEED_ADMIN = {
  name: process.env.SEED_ADMIN_NAME || 'Admin',
  email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
  phone: process.env.SEED_ADMIN_PHONE || '',
  password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
};

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:supersecret@localhost:27018/new-com?authSource=admin');
    console.log('MongoDB Connected for seeding');

    const existing = await Admin.findOne({ email: SEED_ADMIN.email.toLowerCase() });
    if (existing) {
      console.log('Admin already exists:', SEED_ADMIN.email);
      process.exit(0);
      return;
    }

    await Admin.create({
      name: SEED_ADMIN.name,
      email: SEED_ADMIN.email.toLowerCase(),
      phone: SEED_ADMIN.phone || undefined,
      password: SEED_ADMIN.password,
      role: 'superadmin',
    });

    console.log('Admin seeded successfully:', SEED_ADMIN.email);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();
