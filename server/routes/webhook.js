import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import abacatepayClient from '../utils/abacatepay.js';
import { sendPaymentConfirmationEmail, sendStatusUpdateEmail } from '../utils/mailer.js';
import { reduceStock, restoreStock } from '../utils/stockManager.js';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Webhook endpoint para receber notificações do AbacatePay
router.post('/abacatepay', async (req, res) => {
  try {
    console.log('🔵 ========== WEBHOOK ABACATEPAY RECEBIDO ==========');
    console.log('🔵 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔵 Body:', JSON.stringify(req.body, null, 2));
    
    // Obter assinatura do header (se disponível)
    const signature = req.headers['x-abacatepay-signature'] || req.headers['abacatepay-signature'];
    const webhookData = req.body;

    // Verificar assinatura do webhook (segurança)
    if (signature) {
      const isValid = abacatepayClient.verifyWebhookSignature(signature, webhookData);
      if (!isValid) {
        console.warn('⚠️ Webhook AbacatePay: assinatura inválida');
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    }

    // Processar dados do webhook
    const processed = abacatepayClient.processWebhook(webhookData);
    
    console.log('🔵 Dados processados do webhook:', {
      eventType: processed.eventType,
      paymentId: processed.paymentId,
      sessionId: processed.sessionId,
      status: processed.status,
      amount: processed.amount,
    });

    // Buscar pedido pelo sessionId, paymentId ou metadata.orderId
    let order = null;
    
    // Tentar buscar por sessionId primeiro
    if (processed.sessionId) {
      order = await Order.findOne({ paymentSessionId: processed.sessionId });
      console.log(`🔵 Busca por sessionId (${processed.sessionId}):`, order ? '✅ Encontrado' : '❌ Não encontrado');
    }
    
    // Tentar buscar por paymentId
    if (!order && processed.paymentId) {
      order = await Order.findOne({ abacatepayPaymentId: processed.paymentId });
      console.log(`🔵 Busca por paymentId (${processed.paymentId}):`, order ? '✅ Encontrado' : '❌ Não encontrado');
    }
    
    // Tentar buscar por metadata.orderId (fallback)
    if (!order && processed.metadata && processed.metadata.orderId) {
      order = await Order.findById(processed.metadata.orderId);
      console.log(`🔵 Busca por metadata.orderId (${processed.metadata.orderId}):`, order ? '✅ Encontrado' : '❌ Não encontrado');
    }
    
    // Tentar buscar pelo ID do billing (bill_xxx)
    if (!order && processed.paymentId && processed.paymentId.startsWith('bill_')) {
      // Tentar buscar pelo ID completo ou parte dele
      const possibleOrders = await Order.find({
        $or: [
          { paymentSessionId: processed.paymentId },
          { abacatepayPaymentId: processed.paymentId },
          { paymentSessionId: { $regex: processed.paymentId } }
        ]
      });
      if (possibleOrders.length > 0) {
        order = possibleOrders[0];
        console.log(`🔵 Busca por billing ID (${processed.paymentId}): ✅ Encontrado`);
      }
    }

    if (!order) {
      console.warn('❌ Pedido não encontrado para webhook:', {
        sessionId: processed.sessionId,
        paymentId: processed.paymentId,
        metadata: processed.metadata,
        rawData: webhookData,
      });
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    console.log(`✅ Pedido encontrado: ${order._id}, Status atual: ${order.status}`);

    // Funções reduceStock e restoreStock agora estão em utils/stockManager.js
    // e usam transações atômicas para garantir consistência

    const previousStatus = order.status;
    
    // Atualizar status do pedido baseado no evento
    switch (processed.eventType) {
      case 'payment.paid':
      case 'payment.approved':
      case 'payment.completed':
        order.status = 'Pago';
        order.paidAt = processed.paidAt || new Date();
        
        // Reduzir estoque apenas uma vez (evitar duplicação)
        if (!order.stockReduced) {
          await reduceStock(order.items);
          order.stockReduced = true;
          console.log(`Estoque reduzido para pedido ${order._id}`);
        }
        
        // Enviar email de confirmação de pagamento
        try {
          await sendPaymentConfirmationEmail(order.email, order);
        } catch (emailErr) {
          console.error('Erro ao enviar email de confirmação:', emailErr);
        }
        break;
      
      case 'payment.pending':
        order.status = 'Aguardando pagamento';
        break;
      
      case 'payment.cancelled':
      case 'payment.canceled':
        order.status = 'Cancelado';
        
        // Restaurar estoque se já foi reduzido
        if (order.stockReduced) {
          await restoreStock(order.items);
          order.stockReduced = false;
          console.log(`Estoque restaurado para pedido cancelado ${order._id}`);
        }
        
        // Enviar email de cancelamento
        try {
          await sendStatusUpdateEmail(order.email, order, 'Cancelado');
        } catch (emailErr) {
          console.error('Erro ao enviar email de cancelamento:', emailErr);
        }
        break;
      
      case 'payment.refunded':
        order.status = 'Reembolsado';
        
        // Restaurar estoque se já foi reduzido
        if (order.stockReduced) {
          await restoreStock(order.items);
          order.stockReduced = false;
          console.log(`Estoque restaurado para pedido reembolsado ${order._id}`);
        }
        
        // Enviar email de reembolso
        try {
          await sendStatusUpdateEmail(order.email, order, 'Reembolsado');
        } catch (emailErr) {
          console.error('Erro ao enviar email de reembolso:', emailErr);
        }
        break;
      
      case 'payment.failed':
      case 'payment.rejected':
        order.status = 'Falha no pagamento';
        
        // Restaurar estoque se já foi reduzido
        if (order.stockReduced) {
          await restoreStock(order.items);
          order.stockReduced = false;
          console.log(`Estoque restaurado para pedido com falha ${order._id}`);
        }
        break;
      
      default:
        console.log('Evento não tratado:', processed.eventType);
    }
    
    // Enviar email se status mudou (exceto para os casos já tratados acima)
    if (previousStatus !== order.status && 
        !['Pago', 'Cancelado', 'Reembolsado'].includes(order.status)) {
      try {
        await sendStatusUpdateEmail(order.email, order, order.status);
      } catch (emailErr) {
        console.error('Erro ao enviar email de atualização:', emailErr);
      }
    }

    // Salvar dados adicionais do pagamento
    if (processed.paymentId) {
      order.abacatepayPaymentId = processed.paymentId;
    }
    
    if (processed.metadata) {
      order.abacatepayMetadata = processed.metadata;
    }

    await order.save();

    console.log(`✅ Pedido ${order._id} atualizado para status: ${order.status}`);
    console.log('🔵 ========== WEBHOOK PROCESSADO COM SUCESSO ==========');

    // Retornar sucesso para o AbacatePay
    res.status(200).json({ 
      received: true, 
      orderId: order._id.toString(),
      status: order.status 
    });
  } catch (error) {
    console.error('Erro ao processar webhook AbacatePay:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

// Webhook endpoint para receber notificações do Link de Pagamento da Rede
router.post('/rede-payment-link', async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('🔵 Webhook Rede Payment Link recebido:', {
      headers: req.headers,
      body: webhookData,
    });

    // O Link de Pagamento pode enviar diferentes tipos de notificações
    const paymentLinkId = webhookData.paymentLinkId || webhookData.id;
    const reference = webhookData.reference || webhookData.orderId;
    const status = webhookData.status || webhookData.paymentStatus;
    const eventType = webhookData.eventType || webhookData.type;

    if (!paymentLinkId && !reference) {
      console.warn('⚠️ Webhook Rede Payment Link sem identificador de pedido');
      return res.status(400).json({ error: 'Dados insuficientes no webhook' });
    }

    // Buscar pedido pelo paymentLinkId ou reference
    let order = null;
    if (paymentLinkId) {
      order = await Order.findOne({ paymentLinkId: paymentLinkId });
    }
    
    if (!order && reference) {
      order = await Order.findById(reference);
    }

    if (!order) {
      console.warn('⚠️ Pedido não encontrado para webhook Rede Payment Link:', {
        paymentLinkId,
        reference,
      });
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const previousStatus = order.status;

    // Atualizar status baseado na notificação
    if (status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED' || eventType === 'payment.paid') {
      order.status = 'Pago';
      order.paidAt = new Date();
      
      // Reduzir estoque apenas uma vez
      if (!order.stockReduced) {
        await reduceStock(order.items);
        order.stockReduced = true;
        console.log(`✅ Estoque reduzido para pedido ${order._id}`);
      }
      
      // Enviar email de confirmação
      try {
        await sendPaymentConfirmationEmail(order.email, order);
      } catch (emailErr) {
        console.error('Erro ao enviar email de confirmação:', emailErr);
      }
    } else if (status === 'CANCELLED' || status === 'CANCELED' || eventType === 'payment.cancelled') {
      order.status = 'Cancelado';
      
      // Restaurar estoque se já foi reduzido
      if (order.stockReduced) {
        await restoreStock(order.items);
        order.stockReduced = false;
        console.log(`✅ Estoque restaurado para pedido cancelado ${order._id}`);
      }
    } else if (status === 'PENDING' || status === 'WAITING' || eventType === 'payment.pending') {
      order.status = 'Aguardando pagamento';
    } else if (status === 'FAILED' || status === 'REJECTED' || eventType === 'payment.failed') {
      order.status = 'Falha no pagamento';
      
      // Restaurar estoque se já foi reduzido
      if (order.stockReduced) {
        await restoreStock(order.items);
        order.stockReduced = false;
      }
    }

    await order.save();

    console.log(`✅ Pedido ${order._id} atualizado para status: ${order.status}`);

    // Retornar sucesso para a Rede
    res.status(200).json({ received: true, orderId: order._id.toString() });
  } catch (error) {
    console.error('❌ Erro ao processar webhook Rede Payment Link:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

// Webhook endpoint para receber notificações da Red-e (PIX direto)
router.post('/rede-pix', async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('🔵 Webhook Red-e PIX recebido:', {
      headers: req.headers,
      body: webhookData,
    });

    // A Red-e pode enviar diferentes tipos de notificações
    // Verificar se tem chargeId ou reference para identificar o pedido
    const chargeId = webhookData.chargeId || webhookData.id || webhookData.transactionId;
    const reference = webhookData.reference || webhookData.orderId;
    const status = webhookData.status || webhookData.paymentStatus;

    if (!chargeId && !reference) {
      console.warn('⚠️ Webhook Red-e sem identificador de pedido');
      return res.status(400).json({ error: 'Dados insuficientes no webhook' });
    }

    // Buscar pedido pelo chargeId (pixTxId) ou reference
    let order = null;
    if (chargeId) {
      order = await Order.findOne({ pixTxId: chargeId });
    }
    
    if (!order && reference) {
      order = await Order.findById(reference);
    }

    if (!order) {
      console.warn('⚠️ Pedido não encontrado para webhook Red-e:', {
        chargeId,
        reference,
      });
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const previousStatus = order.status;

    // Atualizar status baseado na notificação
    if (status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED') {
      order.status = 'Pago';
      order.paidAt = new Date();
      
      // Reduzir estoque apenas uma vez
      if (!order.stockReduced) {
        await reduceStock(order.items);
        order.stockReduced = true;
        console.log(`✅ Estoque reduzido para pedido ${order._id}`);
      }
      
      // Enviar email de confirmação
      try {
        await sendPaymentConfirmationEmail(order.email, order);
      } catch (emailErr) {
        console.error('Erro ao enviar email de confirmação:', emailErr);
      }
    } else if (status === 'CANCELLED' || status === 'CANCELED') {
      order.status = 'Cancelado';
      
      // Restaurar estoque se já foi reduzido
      if (order.stockReduced) {
        await restoreStock(order.items);
        order.stockReduced = false;
        console.log(`✅ Estoque restaurado para pedido cancelado ${order._id}`);
      }
    } else if (status === 'PENDING' || status === 'WAITING') {
      order.status = 'Aguardando pagamento';
    } else if (status === 'FAILED' || status === 'REJECTED') {
      order.status = 'Falha no pagamento';
      
      // Restaurar estoque se já foi reduzido
      if (order.stockReduced) {
        await restoreStock(order.items);
        order.stockReduced = false;
      }
    }

    await order.save();

    console.log(`✅ Pedido ${order._id} atualizado para status: ${order.status}`);

    // Retornar sucesso para a Red-e
    res.status(200).json({ received: true, orderId: order._id.toString() });
  } catch (error) {
    console.error('❌ Erro ao processar webhook Red-e PIX:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

// Endpoint legado (deprecated)
router.post('/webhook', (req, res) => {
  res.status(410).json({ error: 'Stripe webhooks are deprecated. Use /api/webhooks/abacatepay for AbacatePay webhooks' });
});

export default router;
