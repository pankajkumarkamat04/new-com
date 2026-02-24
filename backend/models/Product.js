import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountedPrice: {
    type: Number,
    min: 0,
  },
  category: {
    type: String,
    trim: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  image: {
    type: String,
    trim: true,
  },
  // Additional gallery images (up to 5 suggested)
  images: {
    type: [String],
    default: [],
  },
  // Product-level attribute definitions (e.g. Size → [S,M,L,XL], Color → [Red,Blue])
  attributes: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      terms: [{
        type: String,
        trim: true,
      }],
    },
  ],
  variations: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      discountedPrice: {
        type: Number,
        min: 0,
      },
      stock: {
        type: Number,
        default: 0,
        min: 0,
      },
      image: {
        type: String,
        trim: true,
      },
      images: {
        type: [String],
        default: [],
      },
      // Attribute key/value pairs like Size=M, Color=Red, Material=Cotton
      attributes: [
        {
          name: {
            type: String,
            trim: true,
          },
          value: {
            type: String,
            trim: true,
          },
        },
      ],
      isActive: {
        type: Boolean,
        default: true,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

export default mongoose.model('Product', productSchema);
