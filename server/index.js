import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js"; // rota Stripe + pedidos

dotenv.config();

const app = express();

// Para usar "__dirname" em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS — permitir múltiplos origins (produção + desenvolvimento local)
const allowedOrigins = [
  process.env.FRONTEND_URL, // produção (ex: https://www.lunabe.com.br)
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow non-browser requests like curl or server-to-server
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // optionally allow all in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
}));

// Middleware principal
app.use(express.json());
app.use(bodyParser.json());

// Servir uploads (caso use imagens locais)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔹 Rotas principais
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// 🔹 Rota para testar saúde do servidor
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Servidor funcionando! 🚀" });
});

// Tratamento 404 para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// 🔹 Conexão com o MongoDB
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERRO: MONGODB_URI não foi definida no .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB conectado com sucesso");
    app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Erro ao conectar ao MongoDB:", err);
  });
