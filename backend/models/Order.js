import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  variationName: { type: String, trim: true, default: '' },
  variationAttributes: [{
    name: { type: String, trim: true },
    value: { type: String, trim: true },
  }],
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  shippingAddress: {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, trim: true },
    customFields: [{
      key: { type: String, trim: true },
      label: { type: String, trim: true },
      value: { type: String, trim: true },
    }],
  },
  couponCode: { type: String, trim: true },
  discountAmount: { type: Number, default: 0, min: 0 },
  shippingMethodId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingMethod' },
  shippingMethodName: { type: String, trim: true },
  shippingAmount: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed'],
  },
  paymentMethod: { type: String, trim: true, default: 'cod' },
  paymentGatewayOrderId: { type: String, trim: true, default: '' },
  paymentGatewayPaymentId: { type: String, trim: true, default: '' },
  paymentStatus: { type: String, trim: true, enum: ['paid', 'pending', 'cod', 'failed'], default: 'pending' },
  paidAt: { type: Date, default: null },
}, {
  timestamps: true,
});

orderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
