import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// rota para criar sessão de pagamento
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;

    // se não houver produtos, retorna erro
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Nenhum item no carrinho." });
    }

    // montar itens no formato do Stripe
    const line_items = items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // em centavos
      },
      quantity: item.quantity,
    }));

    // --- 🔍 LOG PARA DEPURAÇÃO ---
    console.log("✅ FRONTEND_URL:", process.env.FRONTEND_URL);
    const frontendUrl =
      process.env.FRONTEND_URL?.startsWith("http")
        ? process.env.FRONTEND_URL
        : `https://${process.env.FRONTEND_URL || "www.lunabe.com.br"}`;

    console.log("✅ Success URL:", `${frontendUrl}/success`);
    console.log("✅ Cancel URL:", `${frontendUrl}/cancel`);

    // criar sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cancel`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("❌ Erro Stripe:", error.message);
    res.status(500).json({ error: "Erro ao criar sessão de pagamento" });
  }
});

export default router;
