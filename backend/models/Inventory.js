import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment'],
    required: true,
  },
  reason: {
    type: String,
    trim: true,
    default: '',
  },
  referenceOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  previousStock: {
    type: Number,
    default: 0,
  },
  newStock: {
    type: Number,
    required: true,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

inventorySchema.index({ productId: 1, createdAt: -1 });
inventorySchema.index({ type: 1 });
inventorySchema.index({ referenceOrderId: 1 });

export default mongoose.model('Inventory', inventorySchema);
