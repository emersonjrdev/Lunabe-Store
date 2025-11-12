import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Criar sessão de checkout
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    const line_items = items.map(item => ({
      price_data: {
        currency: "brl",
        product_data: { name: item.name || "Produto" },
        unit_amount: Math.round(item.price * 100), // preço em centavos
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'payment',
  line_items: items.map(item => ({
    price_data: {
      currency: 'brl',
      product_data: {
        name: item.name, // 👈 nome do produto (obrigatório)
         description: item.description,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  })),
  success_url: `${process.env.FRONT_URL}/success`,
  cancel_url: `${process.env.FRONT_URL}/cancel`,
});


    console.log("✅ Sessão criada:", session.id);
    res.json({ checkoutUrl: session.url }); // retorna a URL pro frontend
  } catch (error) {
    console.error("❌ Erro Stripe:", error.message);
    res.status(500).json({ error: "Erro ao criar sessão de pagamento" });
  }
});

export default router;
