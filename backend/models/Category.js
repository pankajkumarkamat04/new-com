import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
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

// Unique slug per parent (root = null)
categorySchema.index({ parent: 1, slug: 1 }, { unique: true });
categorySchema.index({ isActive: 1 });

export default mongoose.model('Category', categorySchema);
