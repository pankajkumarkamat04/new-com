import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true, min: 0 },
  shippingAddress: {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    customFields: [{
      key: { type: String, trim: true },
      label: { type: String, trim: true },
      value: { type: String, trim: true },
    }],
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  },
  paymentMethod: { type: String, trim: true, default: 'cod' },
}, {
  timestamps: true,
});

orderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
