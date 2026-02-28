import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, trim: true, default: '' },
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true, default: '' },
  zip: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  country: { type: String, trim: true, default: 'IN' },
  customFields: [{
    key: { type: String, trim: true },
    label: { type: String, trim: true },
    value: { type: String, trim: true },
  }],
  isDefault: { type: Boolean, default: false },
}, {
  timestamps: true,
});

addressSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Address', addressSchema);
