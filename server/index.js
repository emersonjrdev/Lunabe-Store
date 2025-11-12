import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurações básicas
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf } }));

// Webhook Stripe (precisa vir ANTES do express.json normal)
app.use("/api/orders/webhook", orderRoutes);

// Rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check (Render usa pra ver se o servidor está online)
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Conexão com MongoDB
const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
  })
  .catch(err => console.error('❌ Erro na conexão MongoDB:', err));
