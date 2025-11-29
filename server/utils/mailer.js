import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Verificar se email está configurado
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

const transporter = isEmailConfigured ? nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
}) : null;

// Função auxiliar para formatar itens do pedido
function formatOrderItems(items) {
  if (!items || items.length === 0) return '<p>Nenhum item</p>';
  return items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${item.name || 'Produto sem nome'}</strong><br>
        <small>Quantidade: ${item.quantity || 1}</small>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
        R$ ${Number(item.price || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');
}

// Email de confirmação de pedido criado
export async function sendOrderEmail(to, order) {
  if (!to || !transporter) {
    if (!transporter) console.warn('Email não configurado - pulando envio');
    return;
  }

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .total { font-size: 18px; font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Pedido Recebido!</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <p>Seu pedido foi recebido com sucesso e está aguardando pagamento.</p>
            
            <div class="order-info">
              <h3>Detalhes do Pedido</h3>
              <p><strong>ID do Pedido:</strong> ${order._id}</p>
              <p><strong>Status:</strong> ${order.status || 'Aguardando pagamento'}</p>
              <p><strong>Data:</strong> ${new Date(order.createdAt).toLocaleString('pt-BR')}</p>
              
              <h4>Itens do Pedido:</h4>
              <table>
                ${formatOrderItems(order.items)}
                <tr>
                  <td style="padding: 8px; border-top: 2px solid #667eea;"><strong>Total</strong></td>
                  <td style="padding: 8px; border-top: 2px solid #667eea; text-align: right;" class="total">
                    R$ ${Number(order.total || 0).toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
            
            <p>Você receberá uma confirmação por email assim que o pagamento for processado.</p>
            <p>Obrigado por comprar na <strong>Lunabe Pijamas</strong>!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: "Pedido Recebido - Lunabe Pijamas",
      html,
    });
    
    console.log(`Email de confirmação enviado para ${to}`);
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
  }
}

// Email de confirmação de pagamento
export async function sendPaymentConfirmationEmail(to, order) {
  if (!to || !transporter) {
    if (!transporter) console.warn('Email não configurado - pulando envio');
    return;
  }

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .total { font-size: 18px; font-weight: bold; color: #10b981; }
          .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <div class="success-badge">Seu pagamento foi confirmado com sucesso!</div>
            
            <div class="order-info">
              <h3>Detalhes do Pedido</h3>
              <p><strong>ID do Pedido:</strong> ${order._id}</p>
              <p><strong>Status:</strong> ${order.status || 'Pago'}</p>
              <p><strong>Data do Pagamento:</strong> ${order.paidAt ? new Date(order.paidAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}</p>
              
              <h4>Itens do Pedido:</h4>
              <table>
                ${formatOrderItems(order.items)}
                <tr>
                  <td style="padding: 8px; border-top: 2px solid #10b981;"><strong>Total Pago</strong></td>
                  <td style="padding: 8px; border-top: 2px solid #10b981; text-align: right;" class="total">
                    R$ ${Number(order.total || 0).toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
            
            ${order.trackingCode ? `
              <div class="order-info">
                <h3>📦 Código de Rastreamento</h3>
                <p><strong>${order.trackingCode}</strong></p>
                <p>Você pode acompanhar seu pedido usando este código.</p>
              </div>
            ` : '<p>Seu pedido será processado e enviado em breve. Você receberá o código de rastreamento por email.</p>'}
            
            <p>Obrigado por comprar na <strong>Lunabe Pijamas</strong>!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: "Pagamento Confirmado - Lunabe Pijamas",
      html,
    });
    
    console.log(`Email de confirmação de pagamento enviado para ${to}`);
  } catch (error) {
    console.error('Erro ao enviar email de confirmação de pagamento:', error);
  }
}

// Email de atualização de status
export async function sendStatusUpdateEmail(to, order, status) {
  if (!to || !transporter) {
    if (!transporter) console.warn('Email não configurado - pulando envio');
    return;
  }

  try {
    const statusMessages = {
      'Enviado': 'Seu pedido foi enviado! 🚀',
      'Em trânsito': 'Seu pedido está a caminho! 📦',
      'Entregue': 'Seu pedido foi entregue! 🎉',
      'Cancelado': 'Seu pedido foi cancelado',
      'Reembolsado': 'Seu pedido foi reembolsado',
    };

    const statusMessage = statusMessages[status] || `Status atualizado: ${status}`;
    const isPositive = ['Enviado', 'Em trânsito', 'Entregue'].includes(status);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isPositive ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusMessage}</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <p>O status do seu pedido foi atualizado:</p>
            
            <div class="order-info">
              <h3>Detalhes do Pedido</h3>
              <p><strong>ID do Pedido:</strong> ${order._id}</p>
              <p><strong>Novo Status:</strong> ${status}</p>
              ${order.trackingCode ? `<p><strong>Código de Rastreamento:</strong> ${order.trackingCode}</p>` : ''}
            </div>
            
            <p>Obrigado por comprar na <strong>Lunabe Pijamas</strong>!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: `Atualização do Pedido - ${status} - Lunabe Pijamas`,
      html,
    });
    
    console.log(`Email de atualização de status enviado para ${to}`);
  } catch (error) {
    console.error('Erro ao enviar email de atualização:', error);
  }
}
