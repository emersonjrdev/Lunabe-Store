import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Verificar se email está configurado
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

if (!isEmailConfigured) {
  console.warn('⚠️ ========== EMAIL NÃO CONFIGURADO ==========');
  console.warn('⚠️ EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configurado' : '❌ Não configurado');
  console.warn('⚠️ EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ Não configurado');
  console.warn('⚠️ Para habilitar envio de emails, configure no Render:');
  console.warn('⚠️   - EMAIL_USER: seu email Gmail');
  console.warn('⚠️   - EMAIL_PASS: senha de app do Gmail (não a senha normal)');
  console.warn('⚠️   - EMAIL_FROM: email remetente (opcional, usa EMAIL_USER se não configurado)');
  console.warn('⚠️ =========================================');
}

const transporter = isEmailConfigured ? nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Adicionar configurações adicionais para melhor compatibilidade
  tls: {
    rejectUnauthorized: false
  }
}) : null;

// Verificar conexão do transporter ao inicializar (apenas uma vez)
if (transporter) {
  transporter.verify().then(() => {
    console.log('✅ Servidor de email configurado e pronto para enviar emails');
    console.log('🔵 Email remetente:', process.env.EMAIL_FROM || process.env.EMAIL_USER);
  }).catch((error) => {
    console.error('❌ Erro ao verificar configuração de email:', error.message);
    console.error('❌ Verifique se EMAIL_USER e EMAIL_PASS estão corretos');
    console.error('❌ Para Gmail, use uma "Senha de App" (não a senha normal)');
  });
}

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
  if (!to) {
    console.warn('⚠️ Tentativa de enviar email sem destinatário');
    return;
  }
  
  if (!transporter) {
    console.warn('⚠️ Email não configurado - pulando envio de email de pedido');
    console.warn('⚠️ Configure EMAIL_USER e EMAIL_PASS no Render para habilitar emails');
    return;
  }

  try {
    console.log('🔵 ========== ENVIAR EMAIL DE PEDIDO ==========');
    console.log('🔵 Destinatário:', to);
    console.log('🔵 Pedido ID:', order._id);
    console.log('🔵 Status:', order.status);
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

    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    console.log('🔵 Remetente:', emailFrom);
    
    const result = await transporter.sendMail({
      from: emailFrom,
      to,
      subject: "Pedido Recebido - Lunabe Pijamas",
      html,
    });
    
    console.log('✅ Email de confirmação de pedido enviado com sucesso');
    console.log('🔵 Message ID:', result.messageId);
    console.log('🔵 Destinatário:', to);
    console.log('🔵 =========================================');
  } catch (error) {
    console.error('❌ ========== ERRO AO ENVIAR EMAIL DE PEDIDO ==========');
    console.error('❌ Erro:', error.message);
    console.error('❌ Destinatário:', to);
    console.error('❌ Código do erro:', error.code);
    if (error.response) {
      console.error('❌ Resposta do servidor:', error.response);
    }
    console.error('❌ =========================================');
    // Não lançar erro para não quebrar o fluxo do pedido
  }
}

// Email de confirmação de pagamento
export async function sendPaymentConfirmationEmail(to, order) {
  if (!to) {
    console.warn('⚠️ Tentativa de enviar email de pagamento sem destinatário');
    return;
  }
  
  if (!transporter) {
    console.warn('⚠️ Email não configurado - pulando envio de email de pagamento');
    console.warn('⚠️ Configure EMAIL_USER e EMAIL_PASS no Render para habilitar emails');
    return;
  }

  try {
    console.log('🔵 ========== ENVIAR EMAIL DE PAGAMENTO ==========');
    console.log('🔵 Destinatário:', to);
    console.log('🔵 Pedido ID:', order._id);
    console.log('🔵 Status:', order.status);
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

    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    console.log('🔵 Remetente:', emailFrom);
    
    const result = await transporter.sendMail({
      from: emailFrom,
      to,
      subject: "Pagamento Confirmado - Lunabe Pijamas",
      html,
    });
    
    console.log('✅ Email de confirmação de pagamento enviado com sucesso');
    console.log('🔵 Message ID:', result.messageId);
    console.log('🔵 Destinatário:', to);
    console.log('🔵 =========================================');
  } catch (error) {
    console.error('❌ ========== ERRO AO ENVIAR EMAIL DE PAGAMENTO ==========');
    console.error('❌ Erro:', error.message);
    console.error('❌ Destinatário:', to);
    console.error('❌ Código do erro:', error.code);
    if (error.response) {
      console.error('❌ Resposta do servidor:', error.response);
    }
    console.error('❌ =========================================');
    // Não lançar erro para não quebrar o fluxo do webhook
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
