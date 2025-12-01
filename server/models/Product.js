import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price_cents: Number,
  images: [String], // Suporta até 13 imagens
  sizes: [String],
  colors: [String],
  stock: { type: Number, default: 0 }, // Estoque geral (para compatibilidade)
  // Estoque por variante (cor + tamanho): { "P-Rosa": 10, "M-Azul": 5, ... }
  stockByVariant: { 
    type: Map, 
    of: Number,
    default: new Map()
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', ProductSchema);
