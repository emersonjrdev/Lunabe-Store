// models/Order.js
import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price_cents: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: String,
  color: String,
  size: String
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderItemSchema],
  total_cents: { type: Number, required: true },
  discount_cents: { type: Number, default: 0 },
  shipping_cents: { type: Number, default: 0 },
  currency: { type: String, default: 'BRL' },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  customerEmail: { type: String, required: true },
  customerName: String,
  stripeSessionId: String,
  paidAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  trackingNumber: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Atualizar updatedAt antes de salvar
OrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Order', OrderSchema);