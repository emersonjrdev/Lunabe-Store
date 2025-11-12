import express from "express";
import Stripe from "stripe";
import Order from "../models/Order.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ Necessário para capturar o corpo bruto (antes de JSON.parse)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log("Erro webhook:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Quando o pagamento for concluído com sucesso
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const order = await Order.findOne({ stripeSessionId: session.id });
      if (order) {
        order.status = "Pagamento aprovado";
        await order.save();
      }
    }

    res.json({ received: true });
  }
);

export default router;
