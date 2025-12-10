import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price_cents: Number,
  images: [String], // Suporta até 13 imagens
  sizes: [String],
  colors: [String],
  category: { 
    type: String, 
    enum: ['feminino', 'masculino', 'infantil', 'familia', 'natal'], 
    default: 'feminino' 
  }, // Categoria do produto
  stock: { type: Number, default: 0 }, // Estoque geral (para compatibilidade)
  // Estoque por variante (cor + tamanho): { "P-Rosa": 10, "M-Azul": 5, ... }
  stockByVariant: { 
    type: Map, 
    of: Number,
    default: new Map()
  },
  // Categoria/Classificação: feminino, masculino, infantil, familia, especial-natal
  category: { 
    type: String, 
    enum: ['feminino', 'masculino', 'infantil', 'familia', 'especial-natal'],
    default: 'feminino'
  },
  createdAt: { type: Date, default: Date.now }
});

// Índices para melhor performance em consultas frequentes
ProductSchema.index({ _id: 1 }); // Índice primário (já existe por padrão, mas explícito)
ProductSchema.index({ name: 'text' }); // Índice de texto para busca
ProductSchema.index({ createdAt: -1 }); // Índice para ordenação por data
ProductSchema.index({ category: 1 }); // Índice para filtro por categoria

export default mongoose.model('Product', ProductSchema);
