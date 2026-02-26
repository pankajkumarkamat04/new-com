import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  variationName: { type: String, trim: true, default: '' },
  variationAttributes: [{
    name: { type: String, trim: true },
    value: { type: String, trim: true },
  }],
  price: { type: Number, min: 0 }, // effective price (for variations; otherwise from product)
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  recoveryEmailSentAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Cart', cartSchema);
