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
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use("/api/orders/webhook", orderRoutes);
app.use(express.json());
app.use("/api/orders", orderRoutes);

app.use(cors());
app.use(bodyParser.json({verify: (req, res, buf) => { req.rawBody = buf } })); // raw for Stripe webhook
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => res.json({ok:true}));

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> {
    console.log('MongoDB connected');
    app.listen(PORT, ()=> console.log('Server running on port', PORT));
  })
  .catch(err=> { console.error('MongoDB connection error', err) });
