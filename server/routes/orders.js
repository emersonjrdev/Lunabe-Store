import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 👉 Rota que cria a sessão de checkout no Stripe
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    // Converte os produtos no formato que o Stripe entende
    const line_items = items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // em centavos
      },
      quantity: item.quantity,
    }));

    // Cria a sessão de pagamento
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      customer_email: customerEmail,
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    // Retorna a URL pro frontend redirecionar
    res.json({ url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão Stripe:", error);
    res.status(500).json({ error: "Erro ao criar sessão de pagamento" });
  }
});

export default router;
