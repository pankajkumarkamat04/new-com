import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/Category.js';

const DEFAULT_CATEGORIES = [
  { name: 'Electronics', description: 'Electronic devices and gadgets' },
  { name: 'Fashion', description: 'Clothing and accessories' },
  { name: 'Home', description: 'Home and living products' },
  { name: 'Sports', description: 'Sports and outdoor equipment' },
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/new-com');
    console.log('MongoDB Connected');

    for (const cat of DEFAULT_CATEGORIES) {
      const slug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        await Category.create({
          name: cat.name,
          slug,
          description: cat.description,
          isActive: true,
        });
        console.log('Created category:', cat.name);
      } else {
        console.log('Category already exists:', cat.name);
      }
    }

    console.log('Categories seeded successfully');
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedCategories();
