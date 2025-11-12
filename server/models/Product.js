import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price_cents: Number,
  images: [String],
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', ProductSchema);
