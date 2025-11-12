import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===== MIDDLEWARES =====
app.use(cors());
app.use(express.json());

// Apenas para Stripe webhook (caso use)
app.use(
  '/api/orders/webhook',
  bodyParser.raw({ type: 'application/json', verify: (req, res, buf) => { req.rawBody = buf } }),
  orderRoutes
);

// ===== ROTAS PRINCIPAIS =====
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ===== SERVIR UPLOADS =====
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// ===== ROTA DE TESTE =====
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ===== CONEXÃO COM O MONGODB =====
const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB conectado com sucesso');
    app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar no MongoDB:', err);
  });
