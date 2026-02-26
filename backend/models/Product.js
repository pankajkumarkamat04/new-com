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
  stockManagement: {
    type: String,
    enum: ['manual', 'inventory'],
    default: 'manual',
  },
  sku: {
    type: String,
    trim: true,
    default: '',
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
  defaultVariationIndex: {
    type: Number,
    default: 0,
    min: 0,
  },
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
      stockManagement: {
        type: String,
        enum: ['manual', 'inventory'],
        default: 'manual',
      },
      sku: {
        type: String,
        trim: true,
        default: '',
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
productSchema.index({ sku: 1 }, { sparse: true });

function generateSku(prefix = 'PRD') {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${t}${r}`;
}

productSchema.statics.generateProductSku = function () {
  return generateSku('PRD');
};

productSchema.statics.generateVariationSku = function (productSku, index) {
  return `${productSku}-V${String(index + 1).padStart(2, '0')}`;
};

export default mongoose.model('Product', productSchema);
