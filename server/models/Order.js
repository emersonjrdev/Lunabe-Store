import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  stripeSessionId: { type: String, required: true },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  total: Number,
  status: { type: String, default: "Aguardando pagamento" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
