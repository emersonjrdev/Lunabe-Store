import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import abacatepayClient from '../utils/abacatepay.js';
import { sendPaymentConfirmationEmail, sendStatusUpdateEmail } from '../utils/mailer.js';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Webhook endpoint para receber notificações do AbacatePay
router.post('/abacatepay', async (req, res) => {
  try {
    // Obter assinatura do header (se disponível)
    const signature = req.headers['x-abacatepay-signature'] || req.headers['abacatepay-signature'];
    const webhookData = req.body;

    // Verificar assinatura do webhook (segurança)
    if (signature) {
      const isValid = abacatepayClient.verifyWebhookSignature(signature, webhookData);
      if (!isValid) {
        console.warn('Webhook AbacatePay: assinatura inválida');
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    }

    // Processar dados do webhook
    const processed = abacatepayClient.processWebhook(webhookData);
    
    console.log('Webhook AbacatePay recebido:', {
      eventType: processed.eventType,
      paymentId: processed.paymentId,
      sessionId: processed.sessionId,
      status: processed.status,
    });

    // Buscar pedido pelo sessionId ou paymentId
    let order = null;
    if (processed.sessionId) {
      order = await Order.findOne({ paymentSessionId: processed.sessionId });
    }
    
    if (!order && processed.paymentId) {
      order = await Order.findOne({ abacatepayPaymentId: processed.paymentId });
    }

    if (!order) {
      console.warn('Pedido não encontrado para webhook:', {
        sessionId: processed.sessionId,
        paymentId: processed.paymentId,
      });
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Função auxiliar para reduzir estoque
    const reduceStock = async (orderItems) => {
      for (const item of orderItems) {
        if (item.productId) {
          try {
            const product = await Product.findById(item.productId);
            if (product) {
              const quantity = item.quantity || 1;
              const selectedSize = item.selectedSize;
              const selectedColor = item.selectedColor;
              
              // Se tem stockByVariant e foi selecionado cor/tamanho, reduzir da variante
              if (product.stockByVariant && selectedSize && selectedColor) {
                const variant = `${selectedSize}-${selectedColor}`;
                let stockByVariant = product.stockByVariant;
                
                // Converter Map para objeto se necessário
                if (stockByVariant instanceof Map) {
                  const variantStock = stockByVariant.get(variant) || 0;
                  const newVariantStock = Math.max(0, variantStock - quantity);
                  stockByVariant.set(variant, newVariantStock);
                  product.stockByVariant = stockByVariant;
                  
                  // Atualizar estoque total
                  let totalStock = 0;
                  stockByVariant.forEach((qty) => totalStock += qty);
                  product.stock = totalStock;
                  
                  console.log(`Estoque da variante reduzido: ${product.name} (${variant}) - Novo estoque: ${newVariantStock}`);
                } else if (typeof stockByVariant === 'object' && stockByVariant !== null) {
                  const variantStock = stockByVariant[variant] || 0;
                  const newVariantStock = Math.max(0, variantStock - quantity);
                  stockByVariant[variant] = newVariantStock;
                  
                  // Atualizar estoque total
                  let totalStock = 0;
                  Object.values(stockByVariant).forEach((qty) => totalStock += qty);
                  product.stock = totalStock;
                  
                  console.log(`Estoque da variante reduzido: ${product.name} (${variant}) - Novo estoque: ${newVariantStock}`);
                }
              } else {
                // Fallback para estoque geral
                const newStock = Math.max(0, (product.stock || 0) - quantity);
                product.stock = newStock;
                console.log(`Estoque reduzido: ${product.name} - Novo estoque: ${newStock}`);
              }
              
              await product.save();
            }
          } catch (err) {
            console.error(`Erro ao reduzir estoque do produto ${item.productId}:`, err);
          }
        }
      }
    };

    // Função auxiliar para restaurar estoque
    const restoreStock = async (orderItems) => {
      for (const item of orderItems) {
        if (item.productId) {
          try {
            const product = await Product.findById(item.productId);
            if (product) {
              const quantity = item.quantity || 1;
              const selectedSize = item.selectedSize;
              const selectedColor = item.selectedColor;
              
              // Se tem stockByVariant e foi selecionado cor/tamanho, restaurar na variante
              if (product.stockByVariant && selectedSize && selectedColor) {
                const variant = `${selectedSize}-${selectedColor}`;
                let stockByVariant = product.stockByVariant;
                
                // Converter Map para objeto se necessário
                if (stockByVariant instanceof Map) {
                  const variantStock = stockByVariant.get(variant) || 0;
                  stockByVariant.set(variant, variantStock + quantity);
                  product.stockByVariant = stockByVariant;
                  
                  // Atualizar estoque total
                  let totalStock = 0;
                  stockByVariant.forEach((qty) => totalStock += qty);
                  product.stock = totalStock;
                  
                  console.log(`Estoque da variante restaurado: ${product.name} (${variant}) - Novo estoque: ${variantStock + quantity}`);
                } else if (typeof stockByVariant === 'object' && stockByVariant !== null) {
                  const variantStock = stockByVariant[variant] || 0;
                  stockByVariant[variant] = variantStock + quantity;
                  
                  // Atualizar estoque total
                  let totalStock = 0;
                  Object.values(stockByVariant).forEach((qty) => totalStock += qty);
                  product.stock = totalStock;
                  
                  console.log(`Estoque da variante restaurado: ${product.name} (${variant}) - Novo estoque: ${variantStock + quantity}`);
                }
              } else {
                // Fallback para estoque geral
                product.stock = (product.stock || 0) + quantity;
                console.log(`Estoque restaurado: ${product.name} - Novo estoque: ${product.stock}`);
              }
              
              await product.save();
            }
          } catch (err) {
            console.error(`Erro ao restaurar estoque do produto ${item.productId}:`, err);
          }
        }
      }
    };

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

    console.log(`Pedido ${order._id} atualizado para status: ${order.status}`);

    // Retornar sucesso para o AbacatePay
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook AbacatePay:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

// Endpoint legado (deprecated)
router.post('/webhook', (req, res) => {
  res.status(410).json({ error: 'Stripe webhooks are deprecated. Use /api/webhooks/abacatepay for AbacatePay webhooks' });
});

export default router;
