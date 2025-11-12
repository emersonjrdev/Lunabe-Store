import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import { sendOrderEmail } from "../utils/mailer.js";

dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// === CRIAR SESSÃO DE PAGAMENTO ===
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: { name: item.name || item.title },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      customer_email: customerEmail,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("❌ Erro ao criar sessão:", error);
    res.status(500).json({ error: "Erro ao criar sessão de pagamento" });
  }
});

// === WEBHOOK DO STRIPE ===
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const orderData = {
          userEmail: session.customer_email,
          totalAmount: (session.amount_total || 0) / 100,
          status: "paid",
          stripeSessionId: session.id,
          createdAt: new Date(),
        };

        const order = await Order.create(orderData);
        await sendOrderEmail(order.userEmail, order);
        console.log("✅ Pedido salvo:", order._id);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Erro no webhook:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// === ROTA PADRÃO PARA TESTE ===
router.get("/", (req, res) => {
  res.json({ message: "Rota de pedidos ativa ✅" });
});

export default router;
