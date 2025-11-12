// routes/orders.js
import express from "express";
import Stripe from "stripe";
import Order from "../models/Order.js"; // modelo do pedido
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Criar sessão de checkout
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `https://www.lunabe.com.br/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.lunabe.com.br/cancel`,
      customer_email: customerEmail,
    });

    // 🔹 Salva o pedido "pendente" no banco
    const order = new Order({
      email: customerEmail,
      stripeSessionId: session.id,
      items,
      total: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      status: "Aguardando pagamento",
    });
    await order.save();

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Erro Stripe:", err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
