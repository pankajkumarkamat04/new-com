import mongoose from 'mongoose';

const shippingZoneSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  // Country codes (ISO 3166-1 alpha-2). Use ['*'] for "all countries"
  countryCodes: [{ type: String, trim: true, uppercase: true }],
  // Optional: restrict by state/region names or codes
  stateCodes: [{ type: String, trim: true }],
  // Optional: restrict by ZIP/postal code prefixes (e.g. "10" for 10xxx)
  zipPrefixes: [{ type: String, trim: true }],
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

shippingZoneSchema.index({ sortOrder: 1 });

export default mongoose.model('ShippingZone', shippingZoneSchema);
