import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

// Verificar qual método de email está configurado
const hasSendGrid = !!process.env.SENDGRID_API_KEY;
const hasGmail = process.env.EMAIL_USER && process.env.EMAIL_PASS;

// Configurar SendGrid se disponível
if (hasSendGrid) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid configurado para envio de emails');
  console.log('🔵 Email remetente:', process.env.EMAIL_FROM || 'noreply@lunabe.com.br');
} else if (hasGmail) {
  console.log('⚠️ SendGrid não configurado, usando Gmail SMTP (pode ter problemas no Render)');
} else {
  console.warn('⚠️ ========== EMAIL NÃO CONFIGURADO ==========');
  console.warn('⚠️ SENDGRID_API_KEY:', hasSendGrid ? '✅ Configurado' : '❌ Não configurado');
  console.warn('⚠️ EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configurado' : '❌ Não configurado');
  console.warn('⚠️ EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ Não configurado');
  console.warn('⚠️ Para habilitar envio de emails, configure no Render:');
  console.warn('⚠️   OPÇÃO 1 (Recomendado): SENDGRID_API_KEY');
  console.warn('⚠️   OPÇÃO 2: EMAIL_USER e EMAIL_PASS (Gmail SMTP)');
  console.warn('⚠️   EMAIL_FROM: email remetente (opcional)');
  console.warn('⚠️ =========================================');
}

// Configurar Gmail SMTP como fallback
const transporter = hasGmail && !hasSendGrid ? nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  pool: false,
  retry: {
    attempts: 2,
    delay: 1000
  }
}) : null;

// Função auxiliar para formatar itens do pedido
function formatOrderItems(items) {
  if (!items || items.length === 0) return '<p>Nenhum item</p>';
  return items.map(item => {
    const specs = [];
    if (item.selectedSize) specs.push(`Tamanho: ${item.selectedSize}`);
    if (item.selectedColor) specs.push(`Cor: ${item.selectedColor}`);
    const specsText = specs.length > 0 ? `<br><small style="color: #666;">${specs.join(' • ')}</small>` : '';
    
    return `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${item.name || 'Produto sem nome'}</strong><br>
        <small>Quantidade: ${item.quantity || 1}</small>
        ${specsText}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
        R$ ${Number(item.price || 0).toFixed(2)}
      </td>
    </tr>
    `;
  }).join('');
}

// Função auxiliar para enviar email (usa SendGrid ou Gmail SMTP)
async function sendEmail({ to, subject, html }) {
  if (!to) {
    throw new Error('Destinatário não fornecido');
  }

  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@lunabe.com.br';

  // Priorizar SendGrid se disponível
  if (hasSendGrid) {
    console.log('🔵 ========== CONFIGURAÇÃO SENDGRID ==========');
    console.log('🔵 Remetente (from):', emailFrom);
    console.log('🔵 Destinatário (to):', to);
    console.log('🔵 EMAIL_FROM no .env:', process.env.EMAIL_FROM || '❌ Não configurado');
    console.log('🔵 SENDGRID_API_KEY configurada:', hasSendGrid ? '✅ Sim' : '❌ Não');
    console.log('🔵 ===========================================');
    console.log('🔵 Enviando via SendGrid...');
    
    const msg = {
      to,
      from: emailFrom,
      subject,
      html,
    };

    try {
      const result = await sgMail.send(msg);
      console.log('✅ Email enviado via SendGrid');
      console.log('🔵 Status:', result[0]?.statusCode);
      return { messageId: result[0]?.headers['x-message-id'], response: result[0]?.statusCode };
    } catch (error) {
      // Melhorar tratamento de erros do SendGrid
      console.error('❌ Erro ao enviar via SendGrid:');
      console.error('❌ Status:', error.code || error.response?.statusCode);
      console.error('❌ Mensagem:', error.message);
      
      if (error.response) {
        console.error('❌ ========== DETALHES DO ERRO SENDGRID ==========');
        console.error('❌ Status Code:', error.response.statusCode);
        console.error('❌ Body completo:', JSON.stringify(error.response.body, null, 2));
        
        // Erro 403 geralmente é:
        // 1. Email remetente não verificado
        // 2. API Key sem permissões
        // 3. Domínio não autenticado
        if (error.response.statusCode === 403) {
          const errors = error.response.body?.errors || [];
          console.error('❌ ========== ERROS DETALHADOS ==========');
          if (errors.length > 0) {
            errors.forEach((err, index) => {
              console.error(`❌ Erro ${index + 1}:`);
              console.error('❌   Mensagem:', err.message || JSON.stringify(err));
              if (err.field) {
                console.error('❌   Campo:', err.field);
              }
              if (err.help) {
                console.error('❌   Ajuda:', err.help);
              }
              if (err.error_id) {
                console.error('❌   Error ID:', err.error_id);
              }
            });
          } else {
            console.error('❌ Nenhum erro detalhado retornado pelo SendGrid');
            console.error('❌ Body completo:', JSON.stringify(error.response.body, null, 2));
          }
          console.error('❌ ============================================');
          
          console.error('❌ ========== DIAGNÓSTICO ==========');
          console.error('❌ Email remetente usado:', emailFrom);
          console.error('❌ Email destinatário:', to);
          console.error('❌ API Key configurada:', hasSendGrid ? '✅ Sim' : '❌ Não');
          console.error('❌ ============================================');
          
          console.error('❌ ========== SOLUÇÃO PARA ERRO 403 ==========');
          console.error('❌ O erro 403 (Forbidden) geralmente significa:');
          console.error('❌ 1. O email remetente não está verificado no SendGrid');
          console.error('❌ 2. A API Key não tem permissões de "Mail Send"');
          console.error('❌ 3. O domínio não está autenticado no SendGrid');
          console.error('❌');
          console.error('❌ PASSOS PARA RESOLVER:');
          console.error('❌ 1. Acesse: https://app.sendgrid.com');
          console.error('❌ 2. Vá em Settings > Sender Authentication');
          console.error('❌ 3. Verifique se o email "lunabepijamas@gmail.com" está verificado');
          console.error('❌ 4. Se não estiver, clique em "Verify a Single Sender" e verifique o email');
          console.error('❌ 5. Vá em Settings > API Keys e verifique se a API Key tem permissão "Mail Send"');
          console.error('❌ 6. No Render, verifique se EMAIL_FROM está configurado como:');
          console.error('❌    Lunabe Pijamas <lunabepijamas@gmail.com>');
          console.error('❌ ============================================');
        }
      }
      
      throw error;
    }
  }

  // Fallback para Gmail SMTP
  if (transporter) {
    console.log('🔵 Enviando via Gmail SMTP...');
    const result = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html,
    });
    console.log('✅ Email enviado via Gmail SMTP');
    return result;
  }

  throw new Error('Nenhum método de email configurado');
}

// Email de confirmação de pedido criado
export async function sendOrderEmail(to, order) {
  if (!to) {
    console.warn('⚠️ Tentativa de enviar email sem destinatário');
    return;
  }
  
  if (!hasSendGrid && !transporter) {
    console.warn('⚠️ Email não configurado - pulando envio de email de pedido');
    console.warn('⚠️ Configure SENDGRID_API_KEY (recomendado) ou EMAIL_USER/EMAIL_PASS no Render');
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

    const result = await sendEmail({
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
  
  if (!hasSendGrid && !transporter) {
    console.warn('⚠️ Email não configurado - pulando envio de email de pagamento');
    console.warn('⚠️ Configure SENDGRID_API_KEY (recomendado) ou EMAIL_USER/EMAIL_PASS no Render');
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

    const result = await sendEmail({
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
  if (!to) {
    console.warn('⚠️ Tentativa de enviar email sem destinatário');
    return;
  }
  
  if (!hasSendGrid && !transporter) {
    console.warn('⚠️ Email não configurado - pulando envio');
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

    await sendEmail({
      to,
      subject: `Atualização do Pedido - ${status} - Lunabe Pijamas`,
      html,
    });
    
    console.log(`✅ Email de atualização de status enviado para ${to}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email de atualização:', error);
  }
}

// Email de solicitação de devolução para a Lunabê
export async function sendReturnRequestEmail(order, reason) {
  const lunabeEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'lunabepijamas@gmail.com';
  
  if (!hasSendGrid && !transporter) {
    console.warn('⚠️ Email não configurado - pulando envio de email de devolução');
    return;
  }

  try {
    console.log('🔵 ========== ENVIAR EMAIL DE SOLICITAÇÃO DE DEVOLUÇÃO ==========');
    console.log('🔵 Destinatário (Lunabê):', lunabeEmail);
    console.log('🔵 Pedido ID:', order._id);
    console.log('🔵 Cliente:', order.email);
    console.log('🔵 Motivo:', reason);
    
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const paidDate = order.paidAt ? new Date(order.paidAt) : null;
    const daysSincePurchase = paidDate 
      ? Math.floor((new Date() - paidDate) / (1000 * 60 * 60 * 24))
      : null;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
          .alert-box { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 5px; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .total { font-size: 18px; font-weight: bold; color: #f59e0b; }
          .reason-box { background: #fff7ed; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Solicitação de Devolução</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>⚠️ Nova solicitação de devolução recebida!</strong>
            </div>
            
            <div class="order-info">
              <h3>Informações do Cliente</h3>
              <p><strong>Email do Cliente:</strong> ${order.email}</p>
              <p><strong>ID do Pedido:</strong> ${order._id}</p>
              <p><strong>Data do Pedido:</strong> ${orderDate.toLocaleString('pt-BR')}</p>
              ${paidDate ? `<p><strong>Data do Pagamento:</strong> ${paidDate.toLocaleString('pt-BR')}</p>` : ''}
              ${daysSincePurchase !== null ? `<p><strong>Dias desde a compra:</strong> ${daysSincePurchase} dias</p>` : ''}
              <p><strong>Status Atual:</strong> ${order.status || 'N/A'}</p>
            </div>
            
            <div class="reason-box">
              <h3>📝 Motivo da Devolução</h3>
              <p>${reason || 'Não informado'}</p>
            </div>
            
            <div class="order-info">
              <h3>Itens do Pedido</h3>
              <table>
                ${formatOrderItems(order.items)}
                <tr>
                  <td style="padding: 8px; border-top: 2px solid #f59e0b;"><strong>Total</strong></td>
                  <td style="padding: 8px; border-top: 2px solid #f59e0b; text-align: right;" class="total">
                    R$ ${Number(order.total || 0).toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
            
            ${order.address ? `
              <div class="order-info">
                <h3>Endereço de Entrega</h3>
                <p>${order.address.street || ''}</p>
                <p>${order.address.city || ''} - ${order.address.state || ''}</p>
                <p>CEP: ${order.address.zip || ''}</p>
                ${order.address.phone ? `<p>Telefone: ${order.address.phone}</p>` : ''}
              </div>
            ` : order.deliveryType === 'pickup' ? `
              <div class="order-info">
                <h3>Retirada na Loja</h3>
                <p>${order.pickupAddress || 'Endereço não informado'}</p>
              </div>
            ` : ''}
            
            <div class="alert-box">
              <p><strong>⚠️ Ação necessária:</strong></p>
              <p>Por favor, acesse o painel administrativo para revisar e processar esta solicitação de devolução.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: lunabeEmail,
      subject: `🔄 Solicitação de Devolução - Pedido #${order._id?.slice(-8).toUpperCase() || 'N/A'}`,
      html,
    });
    
    console.log('✅ Email de solicitação de devolução enviado com sucesso');
    console.log('🔵 Message ID:', result.messageId);
    console.log('🔵 Destinatário:', lunabeEmail);
    console.log('🔵 =========================================');
  } catch (error) {
    console.error('❌ ========== ERRO AO ENVIAR EMAIL DE DEVOLUÇÃO ==========');
    console.error('❌ Erro:', error.message);
    console.error('❌ Código do erro:', error.code);
    if (error.response) {
      console.error('❌ Resposta do servidor:', error.response);
    }
    console.error('❌ =========================================');
    throw error; // Lançar erro para que o endpoint possa tratar
  }
}
