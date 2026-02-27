import mongoose from 'mongoose';

const shippingMethodSchema = new mongoose.Schema({
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingZone', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  // flat = fixed amount per order; per_item = rateValue * quantity; per_order = same as flat
  rateType: { type: String, enum: ['flat', 'per_item', 'per_order'], default: 'flat' },
  rateValue: { type: Number, required: true, min: 0 },
  // Optional: free shipping when order subtotal >= this amount
  minOrderForFree: { type: Number, min: 0, default: 0 },
  estimatedDaysMin: { type: Number, min: 0 },
  estimatedDaysMax: { type: Number, min: 0 },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

shippingMethodSchema.index({ zoneId: 1, sortOrder: 1 });

export default mongoose.model('ShippingMethod', shippingMethodSchema);
