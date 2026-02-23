import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  showOnHomepage: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

categorySchema.index({ isActive: 1 });

export default mongoose.model('Category', categorySchema);
