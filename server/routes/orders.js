// routes/orders.js
import express from "express";
import Stripe from "stripe";
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from "../models/Order.js"; // modelo do pedido
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Criar sessão de checkout
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, customerEmail, address } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const front = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${front}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${front}/cancel`,
      customer_email: customerEmail,
    });

    // 🔹 Salva o pedido "pendente" no banco (guarda também o endereço)
    const order = new Order({
      email: customerEmail,
      stripeSessionId: session.id,
      items,
      total: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      status: "Aguardando pagamento",
      address: address || null,
    });
    await order.save();

    // If we have a registered user with this email, save address on their profile for next time
    try {
      if (address && customerEmail) {
        const user = await User.findOne({ email: customerEmail });
        if (user) {
          user.address = address;
          await user.save();
        }
      }
    } catch (err) {
      console.warn('Could not save user address:', err.message);
    }

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Erro Stripe:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get orders (optionally filtered by email)
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    let filter = {};
    // if querying by email, require valid token and that the token user matches the email
    if (email) {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ error: 'Unauthorized' });
      try {
        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload?.id) return res.status(401).json({ error: 'Unauthorized' });
        const user = await User.findById(payload.id);
        if (!user || user.email !== email) return res.status(401).json({ error: 'Unauthorized' });
        filter.email = email;
      } catch (e) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Get order by stripe session id
router.get('/session/:sessionId', async (req, res) => {
  try {
    const order = await Order.findOne({ stripeSessionId: req.params.sessionId });
    // If the request has an auth header, verify that the authenticated user is the owner
    const auth = req.headers.authorization;
    if (auth) {
      try {
        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload || !payload.id) return res.status(401).json({ error: 'Unauthorized' });
        // load user and compare email (if you need stricter control)
      } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch (err) {
    console.error('Erro ao buscar pedido:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order by id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    // require auth & ensure owner
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const token = auth.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload?.id) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(payload.id);
      if (!user || user.email !== order.email) return res.status(401).json({ error: 'Unauthorized' });
      res.json(order);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (err) {
    console.error('Erro ao buscar pedido por session:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list all orders (requires X-Admin-Key header)
router.get('/all', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Erro ao buscar todos os pedidos:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update tracking code
router.patch('/:id/tracking', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    const { trackingCode } = req.body;
    if (!trackingCode) return res.status(400).json({ error: 'Missing trackingCode' });
    const order = await Order.findByIdAndUpdate(req.params.id, { trackingCode }, { new: true });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch (err) {
    console.error('Erro ao atualizar tracking:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
