import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  // session id returned by the payment provider (previously stripeSessionId)
  paymentSessionId: { type: String, required: true },
  // kept for backwards compatibility in case older records still contain stripeSessionId
  stripeSessionId: { type: String },
  // Método de pagamento
  paymentMethod: { type: String }, // 'rede', 'itau-pix'
  // PIX Itaú fields
  pixQrCode: { type: String }, // QR Code PIX (código copia-e-cola)
  pixChave: { type: String }, // Chave PIX
  pixValor: { type: Number }, // Valor do PIX
  // Red-e fields (cartão)
  redeOrderId: { type: String }, // ID do pedido no Red-e
  // Campos legados (mantidos para compatibilidade)
  abacatepayPaymentId: { type: String },
  abacatepayQrCode: { type: String },
  abacatepayQrCodeBase64: { type: String },
  abacatepayMetadata: { type: mongoose.Schema.Types.Mixed },
  items: [
    {
      productId: String, // ID do produto no banco
      name: String,
      price: Number,
      quantity: Number,
      image: String, // URL da imagem do produto
    },
  ],
  total: Number,
  // shipping address captured at checkout
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    name: String,
    phone: String
  },
  trackingCode: { type: String, default: null },
  status: { type: String, default: "Aguardando pagamento" },
  paidAt: { type: Date }, // data/hora do pagamento confirmado
  deliveryType: { type: String, default: 'delivery' }, // 'delivery' ou 'pickup'
  pickupAddress: { type: String }, // Endereço da loja para retirada
  pickupSchedule: { type: Date }, // Horário agendado para retirada
  stockReservations: [{ // Informações de estoque reservado (usado no webhook)
    productId: { type: String },
    quantity: { type: Number },
    availableStock: { type: Number },
  }],
  stockReduced: { type: Boolean, default: false }, // Flag para evitar redução duplicada
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
