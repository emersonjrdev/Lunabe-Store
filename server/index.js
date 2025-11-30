import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js"; // rota de pedidos / checkout (AbacatePay)
import webhookRoutes from "./routes/webhook.js"; // webhooks do AbacatePay

dotenv.config();

const app = express();

// Configurar trust proxy para funcionar corretamente com proxies reversos (Render, etc.)
// Confiar apenas no primeiro proxy (Render) para segurança do rate limiting
// Isso é necessário para express-rate-limit identificar corretamente os IPs
app.set('trust proxy', 1);

// Para usar "__dirname" em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS — permitir múltiplos origins (produção + desenvolvimento local)
const allowedOrigins = [
  process.env.FRONTEND_URL, // produção (ex: https://www.lunabe.com.br)
  'https://www.lunabe.com.br', // garantir que está na lista
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow non-browser requests like curl or server-to-server
    if (!origin) return callback(null, true);
    
    // Log para debug em produção
    if (process.env.NODE_ENV === 'production') {
      console.log('🔵 CORS check - Origin:', origin);
      console.log('🔵 Allowed origins:', allowedOrigins);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    
    // Permitir qualquer origem em desenvolvimento
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    
    // Em produção, ser mais permissivo se FRONTEND_URL não estiver configurado
    if (!process.env.FRONTEND_URL) {
      console.warn('⚠️ FRONTEND_URL não configurado - permitindo origem:', origin);
      return callback(null, true);
    }
    
    console.error('❌ CORS bloqueado - Origin não permitida:', origin);
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
}));

// Rate Limiting - Proteção contra abuso
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP a cada 15 minutos
  message: { error: 'Muitas requisições deste IP, tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP a cada 15 minutos
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true,
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 tentativas de checkout por IP a cada hora
  message: { error: 'Muitas tentativas de checkout. Tente novamente em 1 hora.' },
});

// Aplicar rate limiting geral
app.use('/api/', generalLimiter);

// Middleware principal
app.use(express.json());
app.use(bodyParser.json());

// Servir uploads (caso use imagens locais)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔹 Rotas principais
app.use("/api/auth", authLimiter, authRoutes); // Rate limiting específico para auth
app.use("/api/products", productRoutes);
app.use("/api/orders", checkoutLimiter, orderRoutes); // Rate limiting específico para checkout
app.use("/api/webhooks", webhookRoutes); // webhooks do AbacatePay (sem rate limit - são chamadas externas)

// 🔹 Rota para testar saúde do servidor
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Servidor funcionando! 🚀" });
});

// Tratamento 404 para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// 🔹 Conexão com o MongoDB
const PORT = process.env.PORT || 4001;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERRO: MONGODB_URI não foi definida no .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB conectado com sucesso");
    
    // Função para tentar iniciar o servidor em uma porta
    const startServer = (port) => {
      const server = app.listen(port, () => {
        console.log(`🚀 Servidor rodando na porta ${port}`);
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️  Porta ${port} está ocupada, tentando porta ${port + 1}...`);
          startServer(port + 1);
        } else {
          console.error("❌ Erro ao iniciar servidor:", err);
        }
      });
    };
    
    startServer(PORT);
  })
  .catch((err) => {
    console.error("❌ Erro ao conectar ao MongoDB:", err);
  });
