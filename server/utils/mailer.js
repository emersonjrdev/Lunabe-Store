import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOrderEmail(to, order) {
  if (!to) return;

  const html = `
    <h2>Obrigado por comprar na Lunabe Pijamas!</h2>
    <p>Seu pedido foi recebido com sucesso.</p>
    <p><strong>ID do pedido:</strong> ${order._id}</p>
    <p><strong>Total:</strong> R$ ${Number(order.totalAmount).toFixed(2)}</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Confirmação do pedido - Lunabe Pijamas",
    html,
  });
}
