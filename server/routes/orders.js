// routes/orders.js
import express from "express";
// Using AbacatePay API integration
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from "../models/Order.js"; // modelo do pedido
import Product from "../models/Product.js"; // modelo do produto
import dotenv from "dotenv";
// Utilitários de pagamento
import abacatepayClient from '../utils/abacatepay.js';
import { sendOrderEmail, sendPaymentConfirmationEmail, sendStatusUpdateEmail, sendReturnRequestEmail } from '../utils/mailer.js';
import { validateItemsWithStock } from '../utils/orderOptimizer.js';
import { reduceStock } from '../utils/stockManager.js';

dotenv.config();

const router = express.Router();

// Função auxiliar para sanitizar strings
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

// Função auxiliar para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Criar sessão de checkout via AbacatePay (API real)
router.post("/create-checkout-session", async (req, res) => {
  console.log('🔵 Recebida requisição para /create-checkout-session');
  try {
    let { items, customerEmail, address, customerName, customerPhone, cpf, deliveryType, shipping, paymentMethod, pickupSchedule } = req.body;
    console.log('🔵 ========== DADOS RECEBIDOS ==========');
    console.log('🔵 itemsCount:', items?.length);
    console.log('🔵 customerEmail:', customerEmail);
    console.log('🔵 deliveryType:', deliveryType);
    console.log('🔵 pickupSchedule:', pickupSchedule);
    console.log('🔵 pickupScheduleType:', typeof pickupSchedule);
    console.log('🔵 hasAddress:', !!address);
    console.log('🔵 hasCpf:', !!cpf);
    console.log('🔵 =====================================');

    // Validações básicas
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items são obrigatórios' });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: 'Email do cliente é obrigatório' });
    }

    // Sanitizar e validar email
    customerEmail = sanitizeString(customerEmail).toLowerCase();
    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Sanitizar outros campos
    customerName = customerName ? sanitizeString(customerName) : '';
    customerPhone = customerPhone ? sanitizeString(customerPhone) : '';

    // Validar e verificar estoque de forma otimizada (com transações atômicas)
    let validatedItems, stockChecks;
    try {
      const result = await validateItemsWithStock(items);
      validatedItems = result.validatedItems;
      stockChecks = result.stockChecks;
    } catch (validationError) {
      console.error('❌ Erro ao validar itens:', validationError);
      return res.status(400).json({ 
        error: validationError.message || 'Erro ao validar produtos'
      });
    }

    // Sanitizar nomes dos produtos
    validatedItems = validatedItems.map(item => ({
      ...item,
      name: sanitizeString(item.name),
    }));

    // Calcular total usando preços validados do banco
    const total = validatedItems.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);
    const shippingCost = parseFloat(shipping) || 0;
    const totalInCents = Math.round((total + shippingCost) * 100);

    if (totalInCents <= 0) {
      return res.status(400).json({ error: 'Valor total deve ser maior que zero' });
    }

    const front = process.env.FRONTEND_URL || 'http://localhost:5173';
    const backend = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    
    // Garantir que as URLs são válidas (sem trailing slash e sem placeholders)
    const cleanFront = front.replace(/\/$/, '');
    const cleanBackend = backend.replace(/\/$/, '');

    // Criar pedido no banco de dados primeiro (status: Aguardando pagamento)
    // Armazenar informações de estoque no pedido para uso posterior no webhook
    console.log('🔵 ========== CRIANDO PEDIDO ==========');
    console.log('🔵 deliveryType:', deliveryType);
    console.log('🔵 pickupSchedule recebido:', pickupSchedule);
    console.log('🔵 Total calculado:', total);
    console.log('🔵 Frete:', shippingCost);
    console.log('🔵 Total com frete:', total + shippingCost);
    let order;
    try {
      order = new Order({
        email: customerEmail,
        items: validatedItems,
        total: total + shippingCost, // Incluir frete no total
        status: "Aguardando pagamento",
        deliveryType: deliveryType || 'delivery',
        address: deliveryType === 'delivery' && address ? {
          street: sanitizeString(address.street || ''),
          city: sanitizeString(address.city || ''),
          state: sanitizeString(address.state || ''),
          zip: sanitizeString(address.zip || ''),
          country: sanitizeString(address.country || 'Brasil'),
          name: sanitizeString(address.name || customerName),
          phone: sanitizeString(address.phone || customerPhone),
        } : null,
        // Endereço da loja para retirada
        pickupAddress: deliveryType === 'pickup' ? 'Rua José Ribeiro da Silva - Jardim Portão Vermelho, Vargem Grande Paulista/SP, 06735-322' : null,
        // Horário agendado para retirada (converter string para Date se fornecido)
        pickupSchedule: (() => {
          if (deliveryType === 'pickup' && pickupSchedule) {
            console.log('🔵 Salvando pickupSchedule:', pickupSchedule);
            console.log('🔵 Tipo do pickupSchedule:', typeof pickupSchedule);
            const scheduleDate = new Date(pickupSchedule);
            console.log('🔵 Data convertida:', scheduleDate);
            console.log('🔵 Data é válida?', !isNaN(scheduleDate.getTime()));
            return scheduleDate;
          }
          console.log('🔵 pickupSchedule não será salvo (deliveryType:', deliveryType, ', pickupSchedule:', pickupSchedule, ')');
          return null;
        })(),
        paymentSessionId: "pending", // será atualizado após criar sessão no AbacatePay
        // Armazenar informações de estoque para uso no webhook
        stockReservations: stockChecks, // Array de {productId, quantity, availableStock}
      });
      await order.save();
      console.log('✅ Pedido criado no banco:', order._id);
      console.log('🔵 pickupSchedule salvo no pedido:', order.pickupSchedule);
      console.log('🔵 Tipo do pickupSchedule salvo:', typeof order.pickupSchedule);
      if (order.pickupSchedule) {
        console.log('🔵 pickupSchedule como string:', order.pickupSchedule.toString());
        console.log('🔵 pickupSchedule como ISO:', order.pickupSchedule.toISOString());
      }
    } catch (orderError) {
      console.error('❌ Erro ao criar pedido no banco:', orderError);
      console.error('❌ Stack trace:', orderError.stack);
      return res.status(500).json({
        error: 'Erro ao criar pedido',
        details: orderError.message
      });
    }

    // Buscar dados do usuário se existir
    let userData = null;
    try {
      if (customerEmail) {
        const user = await User.findOne({ email: customerEmail });
        if (user) {
          userData = {
            name: user.name || customerName,
            phone: user.phone || customerPhone,
          };
          // Salvar endereço no perfil do usuário se fornecido
          if (address) {
            user.address = address;
            await user.save();
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar/salvar dados do usuário:', err.message);
    }

    // Processar pagamento baseado no método selecionado
    console.log('🔵 Método de pagamento selecionado:', paymentMethod);
    console.log('🔵 Tipo do paymentMethod:', typeof paymentMethod);
    console.log('🔵 Comparação abacatepay:', paymentMethod === 'abacatepay');
    console.log('🔵 Comparação abacatepay-pix:', paymentMethod === 'abacatepay-pix');
    
    if (paymentMethod === 'abacatepay' || paymentMethod === 'abacatepay-pix') {
      // Pagamento via AbacatePay (Cartão ou PIX)
      const isPix = paymentMethod === 'abacatepay-pix';
      console.log(`🔵 Criando sessão de checkout AbacatePay (${isPix ? 'PIX' : 'Cartão'})...`);
      
      try {
        // Verificar credenciais do AbacatePay
        if (!process.env.ABACATEPAY_API_KEY) {
          console.error('❌ ABACATEPAY_API_KEY não configurada!');
          return res.status(500).json({
            error: 'Configuração de pagamento não disponível',
            details: 'As credenciais do AbacatePay não estão configuradas. Por favor, configure ABACATEPAY_API_KEY no servidor.',
            requiresApi: true,
          });
        }
        
        // Preparar URLs de retorno
        const frontendUrl = cleanFront;
        const backendUrl = cleanBackend;
        const webhookUrl = `${backendUrl}/api/webhooks/abacatepay`;
        const successUrl = `${frontendUrl}/checkout/${order._id.toString()}?status=success`;
        const cancelUrl = `${frontendUrl}/carrinho?status=cancelled`;
        
        // Preparar dados do pagamento para AbacatePay
        const orderId = order._id.toString();
        const paymentData = {
          orderId: orderId, // orderId é obrigatório e deve ser passado diretamente
          amount: totalInCents,
          currency: 'BRL',
          customerEmail: customerEmail,
          customerName: customerName || 'Cliente',
          customerPhone: customerPhone || '',
          customerTaxId: cpf || '', // CPF também pode ser passado diretamente
          items: validatedItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price, // em reais, será convertido para centavos no cliente
          })),
          metadata: {
            orderId: orderId,
            customerTaxId: cpf || '',
          },
          successUrl: successUrl,
          cancelUrl: cancelUrl,
          webhookUrl: webhookUrl,
        };
        
        console.log('🔵 Criando sessão de checkout AbacatePay...');
        console.log('🔵 Order ID:', order._id.toString());
        console.log('🔵 Total (centavos):', totalInCents);
        console.log('🔵 Total (reais):', (totalInCents / 100).toFixed(2));
        console.log('🔵 Email do cliente:', customerEmail);
        console.log('🔵 Método:', isPix ? 'PIX' : 'Cartão');
        
        // Criar sessão de checkout no AbacatePay
        let checkoutSession;
        try {
          checkoutSession = await abacatepayClient.createCheckoutSession(paymentData);
          
          console.log('✅ Sessão de checkout AbacatePay criada com sucesso:', {
            sessionId: checkoutSession.sessionId,
            paymentId: checkoutSession.paymentId,
            hasCheckoutUrl: !!checkoutSession.checkoutUrl,
            hasQrCode: !!checkoutSession.qrCode,
            hasQrCodeBase64: !!checkoutSession.qrCodeBase64,
          });
          
          // Se for PIX e não tiver QR Code na resposta inicial, buscar do billing
          if (isPix && !checkoutSession.qrCode && !checkoutSession.qrCodeBase64 && checkoutSession.sessionId) {
            console.log('🔵 QR Code não veio na resposta inicial, buscando do billing...');
            try {
              const billingData = await abacatepayClient.getBilling(checkoutSession.sessionId);
              if (billingData.qrCode || billingData.qrCodeBase64) {
                console.log('✅ QR Code encontrado ao buscar billing:', {
                  hasQrCode: !!billingData.qrCode,
                  hasQrCodeBase64: !!billingData.qrCodeBase64,
                });
                checkoutSession.qrCode = billingData.qrCode || checkoutSession.qrCode;
                checkoutSession.qrCodeBase64 = billingData.qrCodeBase64 || checkoutSession.qrCodeBase64;
              } else {
                console.warn('⚠️ QR Code ainda não disponível no billing. Pode estar sendo gerado.');
              }
            } catch (billingError) {
              console.warn('⚠️ Erro ao buscar billing para QR Code (não crítico):', billingError.message);
              // Não falhar o pedido se não conseguir buscar o QR Code
            }
          }
        } catch (abacatepayError) {
          console.error('❌ ========== ERRO AO CRIAR SESSÃO ABACATEPAY ==========');
          console.error('❌ Mensagem:', abacatepayError.message);
          console.error('❌ Stack:', abacatepayError.stack);
          console.error('❌ Response status:', abacatepayError.response?.status);
          console.error('❌ Response data:', JSON.stringify(abacatepayError.response?.data, null, 2));
          console.error('❌ =========================================');
          
          // Retornar erro detalhado
          const errorDetails = abacatepayError.response?.data || {};
          const errorMessage = abacatepayError.message || 'Erro desconhecido ao criar sessão de pagamento';
          
          return res.status(500).json({
            error: 'Erro ao criar sessão de pagamento no AbacatePay',
            details: errorMessage,
            status: abacatepayError.response?.status,
            apiError: errorDetails,
            suggestion: 'Verifique as credenciais do AbacatePay (ABACATEPAY_API_KEY) e se o formato do payload está correto.',
          });
        }
        
        // Atualizar pedido com dados do AbacatePay
        order.paymentMethod = paymentMethod;
        order.paymentSessionId = checkoutSession.sessionId || checkoutSession.paymentId || order._id.toString();
        order.abacatepayPaymentId = checkoutSession.paymentId || checkoutSession.sessionId;
        
        // Se for PIX, salvar dados do QR Code
        // Se não tiver QR Code mas tiver checkoutUrl, o QR Code será exibido na página do AbacatePay
        if (isPix) {
          if (checkoutSession.qrCode) {
            order.abacatepayQrCode = checkoutSession.qrCode;
          }
          if (checkoutSession.qrCodeBase64) {
            order.abacatepayQrCodeBase64 = checkoutSession.qrCodeBase64;
          }
          // Se não tiver QR Code, salvar a URL do checkout para redirecionar
          if (!checkoutSession.qrCode && !checkoutSession.qrCodeBase64 && checkoutSession.checkoutUrl) {
            console.log('🔵 QR Code não disponível, mas checkoutUrl está disponível:', checkoutSession.checkoutUrl);
            // A URL do checkout do AbacatePay mostrará o QR Code
          }
        }
        
        await order.save();
        console.log('✅ Pedido atualizado com dados do AbacatePay');
        
        // Reduzir estoque quando o pedido é criado
        try {
          await reduceStock(order.items);
          order.stockReduced = true;
          await order.save();
          console.log('✅ Estoque reduzido automaticamente ao criar pedido');
        } catch (stockError) {
          console.error('❌ Erro ao reduzir estoque (não crítico):', stockError);
          // Não falhar o pedido se houver erro ao reduzir estoque
        }
        
        // Enviar email de confirmação
        console.log('🔵 Tentando enviar email de confirmação de pedido...');
        sendOrderEmail(customerEmail, order)
          .then(() => {
            console.log('✅ Email de confirmação de pedido enviado com sucesso');
          })
          .catch(err => {
            console.error('❌ Erro ao enviar email de confirmação:', err.message);
            console.error('❌ Isso não impede o pedido de ser criado');
          });
        
        // Retornar dados do checkout
        return res.json({
          orderId: order._id.toString(),
          paymentMethod: paymentMethod,
          sessionId: checkoutSession.sessionId || checkoutSession.paymentId,
          checkoutUrl: checkoutSession.checkoutUrl, // URL do checkout (se disponível)
          qrCode: checkoutSession.qrCode || null, // QR Code PIX (se PIX)
          qrCodeBase64: checkoutSession.qrCodeBase64 || null, // QR Code em base64 (se PIX)
          amount: totalInCents,
          message: 'Pedido criado. Redirecionando para página de pagamento...',
        });
      } catch (apiError) {
        console.error('❌ ========== ERRO AO CRIAR SESSÃO ABACATEPAY ==========');
        console.error('❌ Mensagem:', apiError.message);
        console.error('❌ Status HTTP:', apiError.response?.status);
        console.error('❌ Status Text:', apiError.response?.statusText);
        console.error('❌ Dados da resposta:', JSON.stringify(apiError.response?.data, null, 2));
        console.error('❌ Stack trace:', apiError.stack);
        console.error('❌ =========================================');
        
        // Retornar erro detalhado para ajudar no diagnóstico
        const errorDetails = apiError.response?.data || {};
        const errorMessage = apiError.message || 'Erro desconhecido ao criar sessão de pagamento';
        
        return res.status(500).json({
          error: 'Erro ao criar sessão de pagamento no AbacatePay',
          details: errorMessage,
          status: apiError.response?.status,
          apiError: errorDetails,
          suggestion: 'Verifique as credenciais do AbacatePay no servidor (ABACATEPAY_API_KEY).',
        });
      }
    } else {
      return res.status(400).json({
        error: 'Método de pagamento inválido',
        details: `Método "${paymentMethod}" não é suportado. Use "abacatepay" (cartão) ou "abacatepay-pix" (PIX).`,
      });
    }
  } catch (err) {
    console.error("❌ Erro geral ao criar sessão de checkout:", err);
    console.error("❌ Stack trace:", err.stack);
    console.error("❌ Tipo do erro:", err.constructor.name);
    console.error("❌ Mensagem completa:", err.message);
    return res.status(500).json({ 
      error: err.message || 'Erro ao processar pedido',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get orders (optionally filtered by email)
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    let filter = {};
    // if querying by email, require valid token and that the token user matches the email
    if (email) {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ error: 'Unauthorized' });
      try {
        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload?.id) return res.status(401).json({ error: 'Unauthorized' });
        const user = await User.findById(payload.id);
        if (!user || user.email !== email) return res.status(401).json({ error: 'Unauthorized' });
        filter.email = email;
      } catch (e) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// IMPORTANTE: Rotas específicas devem vir ANTES de rotas com parâmetros dinâmicos
// Test endpoint para verificar se a rota está funcionando
router.get('/all/test', async (req, res) => {
  try {
    res.json({ 
      message: 'Rota de teste funcionando',
      mongoState: mongoose.connection.readyState,
      hasOrderModel: !!Order,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list all orders (requires X-Admin-Key header)
// DEVE vir ANTES de /:id para não ser capturada como parâmetro
router.get('/all', async (req, res) => {
  let errorOccurred = false;
  try {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_SECRET || 'lunabe25'; // Fallback para compatibilidade
    
    console.log('🔵 Requisição de pedidos admin recebida');
    console.log('🔵 Admin key recebida:', adminKey ? '***' : 'não fornecida');
    console.log('🔵 ADMIN_SECRET configurado:', !!process.env.ADMIN_SECRET);
    
    if (!adminKey) {
      console.warn('❌ Admin key não fornecida');
      return res.status(401).json({ error: 'Unauthorized: Admin key não fornecida' });
    }
    
    if (adminKey !== expectedKey) {
      console.warn('❌ Admin key inválida');
      return res.status(401).json({ error: 'Unauthorized: Admin key inválida' });
    }
    
    console.log('✅ Admin key válida, buscando pedidos...');
    
    // Verificar se o MongoDB está conectado
    const mongoState = mongoose.connection.readyState;
    console.log('🔵 Estado do MongoDB:', mongoState, '(0=disconnected, 1=connected, 2=connecting, 3=disconnecting)');
    
    if (mongoState !== 1) {
      console.error('❌ MongoDB não está conectado. Estado:', mongoState);
      errorOccurred = true;
      return res.status(500).json({ 
        error: 'Database not connected', 
        details: `MongoDB connection state: ${mongoState}` 
      });
    }
    
    console.log('✅ MongoDB conectado, executando query...');
    
    // Tentar buscar pedidos de forma mais simples
    let orders;
    try {
      orders = await Order.find({}).sort({ createdAt: -1 }).limit(1000);
      console.log(`✅ ${orders.length} pedidos encontrados`);
    } catch (queryError) {
      console.error('❌ Erro na query Order.find():', queryError);
      console.error('❌ Stack trace da query:', queryError.stack);
      errorOccurred = true;
      throw queryError;
    }
    
    // Converter para JSON simples de forma segura
    let ordersData;
    try {
      ordersData = orders.map(order => order.toObject ? order.toObject() : order);
      console.log(`✅ ${ordersData.length} pedidos convertidos`);
    } catch (convertError) {
      console.error('❌ Erro ao converter pedidos:', convertError);
      // Se falhar a conversão, tentar enviar direto
      ordersData = orders;
    }
    
    console.log(`✅ Enviando ${ordersData.length} pedidos`);
    res.json(ordersData);
  } catch (err) {
    if (!errorOccurred) {
      console.error('❌ Erro geral ao buscar todos os pedidos:', err);
      console.error('❌ Tipo do erro:', err.constructor?.name || typeof err);
      console.error('❌ Mensagem:', err.message);
      if (err.stack) {
        console.error('❌ Stack trace:', err.stack);
      }
    }
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message || 'Erro desconhecido',
      type: err.constructor?.name || typeof err
    });
  }
});

// Admin: update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_SECRET || 'lunabe25'; // Fallback para compatibilidade
    if (!adminKey || adminKey !== expectedKey) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status' });
    
    // Buscar pedido antes de atualizar para comparar status anterior
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    
    const previousStatus = order.status;
    const isChangingToPaid = status === 'Pago' && previousStatus !== 'Pago';
    
    // Atualizar status
    order.status = status;
    
    // Se mudou para "Pago", atualizar paidAt e enviar email
    if (isChangingToPaid) {
      order.paidAt = new Date();
      console.log('🔵 Status mudou para "Pago" - enviando email de confirmação...');
      
      // Enviar email de confirmação de pagamento
      sendPaymentConfirmationEmail(order.email, order).catch(err => {
        console.error('❌ Erro ao enviar email de confirmação de pagamento (não crítico):', err);
      });
    }
    
    // Se mudou para outro status (não "Pago"), enviar email de atualização
    if (previousStatus !== status && status !== 'Pago') {
      console.log(`🔵 Status mudou de "${previousStatus}" para "${status}" - enviando email de atualização...`);
      sendStatusUpdateEmail(order.email, order, status).catch(err => {
        console.error('❌ Erro ao enviar email de atualização (não crítico):', err);
      });
    }
    
    await order.save();
    
    console.log(`✅ Pedido ${order._id} atualizado: ${previousStatus} → ${status}`);
    res.json(order);
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Buscar pedido por sessionId (usado pelo frontend para exibir checkout)
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const order = await Order.findOne({ paymentSessionId: sessionId });
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Se for PIX e tiver checkoutUrl mas não tiver QR Code, construir a URL
    let checkoutUrl = null;
    if (order.paymentMethod === 'abacatepay-pix' && order.abacatepayPaymentId) {
      // Construir URL do checkout do AbacatePay
      checkoutUrl = `https://abacatepay.com/pay/${order.abacatepayPaymentId}`;
    }
    
    // Retornar pedido com checkoutUrl se necessário
    const orderData = order.toObject();
    if (checkoutUrl) {
      orderData.checkoutUrl = checkoutUrl;
    }
    
    res.json(orderData);
  } catch (err) {
    console.error('Erro ao buscar pedido por sessionId:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update tracking code
router.patch('/:id/tracking', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_SECRET || 'lunabe25'; // Fallback para compatibilidade
    if (!adminKey || adminKey !== expectedKey) return res.status(401).json({ error: 'Unauthorized' });
    const { trackingCode } = req.body;
    if (!trackingCode) return res.status(400).json({ error: 'Missing trackingCode' });
    const order = await Order.findByIdAndUpdate(req.params.id, { trackingCode }, { new: true });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch (err) {
    console.error('Erro ao atualizar tracking:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete order
router.delete('/:id', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_SECRET || 'lunabe25'; // Fallback para compatibilidade
    if (!adminKey || adminKey !== expectedKey) return res.status(401).json({ error: 'Unauthorized' });
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json({ success: true, message: 'Pedido deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar pedido:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete test orders (pedidos de teste)
router.delete('/test/cleanup', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_SECRET || 'lunabe25'; // Fallback para compatibilidade
    if (!adminKey || adminKey !== expectedKey) return res.status(401).json({ error: 'Unauthorized' });
    
    // Deletar pedidos de teste (emails com 'test', 'exemplo', ou sem abacatepayPaymentId)
    const testEmails = ['test', 'exemplo', 'teste', '@test', 'fake'];
    const testOrders = await Order.find({
      $or: [
        { email: { $regex: testEmails.join('|'), $options: 'i' } },
        { abacatepayPaymentId: { $exists: false } },
        { paymentSessionId: 'pending' },
        { status: 'Aguardando pagamento' }
      ]
    });
    
    const deletedCount = testOrders.length;
    await Order.deleteMany({
      _id: { $in: testOrders.map(o => o._id) }
    });
    
    res.json({ 
      success: true, 
      message: `${deletedCount} pedidos de teste deletados`,
      deleted: deletedCount
    });
  } catch (err) {
    console.error('Erro ao limpar pedidos de teste:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list test orders
router.get('/test/list', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_SECRET || 'lunabe25'; // Fallback para compatibilidade
    if (!adminKey || adminKey !== expectedKey) return res.status(401).json({ error: 'Unauthorized' });
    
    const testEmails = ['test', 'exemplo', 'teste', '@test', 'fake'];
    const testOrders = await Order.find({
      $or: [
        { email: { $regex: testEmails.join('|'), $options: 'i' } },
        { abacatepayPaymentId: { $exists: false } },
        { paymentSessionId: 'pending' }
      ]
    }).sort({ createdAt: -1 });
    
    res.json({ 
      count: testOrders.length,
      orders: testOrders
    });
  } catch (err) {
    console.error('Erro ao listar pedidos de teste:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint used by the (simulated) AbacatePay checkout page to confirm payment
router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    const previousStatus = order.status;
    
    // mark as paid
    order.status = 'Pago';
    order.paidAt = new Date();
    await order.save();

    // Enviar email de confirmação de pagamento se mudou para "Pago"
    if (previousStatus !== 'Pago') {
      console.log('🔵 Status mudou para "Pago" - enviando email de confirmação...');
      sendPaymentConfirmationEmail(order.email, order).catch(err => {
        console.error('❌ Erro ao enviar email de confirmação de pagamento (não crítico):', err);
      });
    }

    // Return the session id (paymentSessionId) so frontend can redirect to success
    res.json({ ok: true, sessionId: order.paymentSessionId || order.stripeSessionId || order._id.toString() });
  } catch (err) {
    console.error('Erro ao confirmar pagamento:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rota de teste para verificar credenciais do Itaú (apenas para diagnóstico)
router.get('/test-itau-credentials', async (req, res) => {
  try {
    const hasClientId = !!process.env.ITAU_CLIENT_ID;
    const hasClientSecret = !!process.env.ITAU_CLIENT_SECRET;
    const pixKey = process.env.ITAU_PIX_KEY || '63824145000127';
    const environment = process.env.ITAU_ENV || 'sandbox';
    
    console.log('🔵 Testando credenciais do Itaú...');
    
    if (!hasClientId || !hasClientSecret) {
      return res.json({
        success: false,
        message: 'Credenciais não configuradas',
        details: {
          ITAU_CLIENT_ID: hasClientId ? '✅ Configurado' : '❌ Não configurado',
          ITAU_CLIENT_SECRET: hasClientSecret ? '✅ Configurado' : '❌ Não configurado',
          ITAU_PIX_KEY: pixKey,
          ITAU_ENV: environment,
        },
        suggestion: 'Configure ITAU_CLIENT_ID e ITAU_CLIENT_SECRET no Render',
      });
    }
    
    // Tentar obter token
    const itauPix = (await import('../utils/itau-pix.js')).default;
    
    try {
      const token = await itauPix.getAccessToken();
      return res.json({
        success: true,
        message: 'Credenciais válidas! Token obtido com sucesso.',
        details: {
          ITAU_CLIENT_ID: '✅ Configurado',
          ITAU_CLIENT_SECRET: '✅ Configurado',
          ITAU_PIX_KEY: pixKey,
          ITAU_ENV: environment,
          tokenObtained: '✅ Sim',
        },
      });
    } catch (tokenError) {
      // Log detalhado do erro
      console.error('❌ Erro completo no teste:', {
        message: tokenError.message,
        status: tokenError.response?.status,
        data: tokenError.response?.data,
        url: tokenError.config?.url,
      });
      
      return res.json({
        success: false,
        message: 'Erro ao obter token',
        details: {
          ITAU_CLIENT_ID: '✅ Configurado',
          ITAU_CLIENT_SECRET: '✅ Configurado',
          ITAU_PIX_KEY: pixKey,
          ITAU_ENV: environment,
          error: tokenError.message,
          status: tokenError.response?.status,
          apiResponse: tokenError.response?.data,
          urlTentada: tokenError.config?.url,
        },
        suggestion: tokenError.response?.status === 404 
          ? 'Erro 404: As credenciais podem não ser válidas para sandbox. Obtenha credenciais válidas em https://devportal.itau.com.br'
          : 'Verifique as credenciais no portal do Itaú: https://devportal.itau.com.br',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao testar credenciais',
      error: error.message,
    });
  }
});

// Rota para processar pagamento Red-e com cartão (3DS e Data Only)
router.post('/process-rede-payment', async (req, res) => {
  try {
    const {
      orderId,
      cardData, // { cardNumber, expirationMonth, expirationYear, securityCode, cardholderName, kind }
      userAgent, // User agent do navegador para 3DS
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId é obrigatório' });
    }

    if (!cardData || !cardData.cardNumber || !cardData.expirationMonth || 
        !cardData.expirationYear || !cardData.securityCode || !cardData.cardholderName) {
      return res.status(400).json({ 
        error: 'Dados do cartão incompletos',
        required: ['cardNumber', 'expirationMonth', 'expirationYear', 'securityCode', 'cardholderName']
      });
    }

    // Buscar pedido
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (order.paymentMethod !== 'rede') {
      return res.status(400).json({ error: 'Este pedido não é para pagamento Red-e' });
    }

    // Buscar dados do usuário
    const user = await User.findOne({ email: order.email });
    const customer = {
      name: user?.name || order.address?.name || 'Cliente',
      email: order.email,
      phone: user?.phone || order.address?.phone || '',
      document: order.cpf || '', // CPF do pedido
      userAgent: userAgent || req.headers['user-agent'] || 'Mozilla/5.0',
    };

    console.log('🔵 Processando pagamento Red-e com 3DS e Data Only...');
    console.log('🔵 Order ID:', orderId);
    console.log('🔵 Valor (centavos):', order.total * 100);

    // Criar transação na Red-e com 3DS e Data Only
    const transaction = await createRedeTransaction(
      order,
      Math.round(order.total * 100), // Converter para centavos
      {
        cardholderName: cardData.cardholderName,
        cardNumber: cardData.cardNumber,
        expirationMonth: cardData.expirationMonth,
        expirationYear: cardData.expirationYear,
        securityCode: cardData.securityCode,
        kind: cardData.kind || 'credit',
      },
      customer
    );

    console.log('✅ Transação Red-e criada:', {
      tid: transaction.tid,
      status: transaction.status,
      has3DS: !!transaction.threeDSecure,
    });

    // Atualizar pedido com dados da transação
    order.redeOrderId = transaction.tid;
    order.paymentSessionId = transaction.tid;
    await order.save();

    // Se 3DS for necessário, retornar URL de autenticação
    if (transaction.threeDSecure && transaction.authenticationUrl) {
      return res.json({
        success: true,
        requires3DS: true,
        authenticationUrl: transaction.authenticationUrl,
        threeDSecureData: transaction.threeDSecureData,
        tid: transaction.tid,
        orderId: order._id.toString(),
        message: '3DS necessário. Redirecione o cliente para a URL de autenticação.',
      });
    }

    // Se pagamento foi aprovado diretamente (sem 3DS)
    if (transaction.status === 'Approved' || transaction.returnCode === '00') {
      // Reduzir estoque
      try {
        await reduceStock(order.items);
        order.stockReduced = true;
        await order.save();
        console.log('✅ Estoque reduzido após pagamento aprovado');
      } catch (stockError) {
        console.error('❌ Erro ao reduzir estoque:', stockError);
      }

      // Atualizar status do pedido
      order.status = 'Pago';
      order.paidAt = new Date();
      await order.save();

      // Enviar email de confirmação de pagamento
      sendPaymentConfirmationEmail(order.email, order).catch(err => {
        console.error('Erro ao enviar email de confirmação (não crítico):', err);
      });

      return res.json({
        success: true,
        approved: true,
        tid: transaction.tid,
        orderId: order._id.toString(),
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?orderId=${order._id}`,
        message: 'Pagamento aprovado com sucesso!',
      });
    }

    // Pagamento recusado ou pendente
    return res.json({
      success: false,
      approved: false,
      tid: transaction.tid,
      status: transaction.status,
      returnCode: transaction.returnCode,
      returnMessage: transaction.returnMessage,
      orderId: order._id.toString(),
      message: transaction.returnMessage || 'Pagamento não aprovado',
    });

  } catch (error) {
    console.error('❌ Erro ao processar pagamento Red-e:', error);
    return res.status(500).json({
      error: 'Erro ao processar pagamento',
      message: error.message,
      details: error.response?.data || null,
    });
  }
});

// Rota de callback para 3DS Success
router.get('/rede/3ds-success', async (req, res) => {
  try {
    const { orderId, tid } = req.query;

    if (!orderId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?error=orderId_missing`);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?error=order_not_found`);
    }

    // Consultar status da transação
    const redeClient = (await import('../utils/rede.js')).default;
    const transaction = await redeClient.getTransaction(tid || order.redeOrderId);

    if (transaction.status === 'Approved' || transaction.returnCode === '00') {
      // Reduzir estoque
      try {
        await reduceStock(order.items);
        order.stockReduced = true;
        await order.save();
        console.log('✅ Estoque reduzido após 3DS aprovado');
      } catch (stockError) {
        console.error('❌ Erro ao reduzir estoque:', stockError);
      }

      // Atualizar status do pedido
      order.status = 'Pago';
      order.paidAt = new Date();
      await order.save();

      // Enviar email de confirmação
      sendPaymentConfirmationEmail(order.email, order).catch(err => {
        console.error('Erro ao enviar email (não crítico):', err);
      });

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?orderId=${order._id}`);
    }

    // 3DS aprovado mas pagamento não aprovado
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?error=payment_not_approved`);
  } catch (error) {
    console.error('❌ Erro no callback 3DS Success:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?error=callback_error`);
  }
});

// Rota de callback para 3DS Failure
router.get('/rede/3ds-failure', async (req, res) => {
  try {
    const { orderId } = req.query;

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && !order.stockReduced) {
        // Se o estoque ainda não foi reduzido, não precisa restaurar
        // Mas podemos atualizar o status
        order.status = 'Falha no pagamento (3DS)';
        await order.save();
      }
    }

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?error=3ds_failed`);
  } catch (error) {
    console.error('❌ Erro no callback 3DS Failure:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?error=callback_error`);
  }
});

// Solicitar devolução de um pedido
router.post('/:id/request-return', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Validar formato do ID
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: 'ID do pedido inválido' });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Verificar se já existe uma solicitação de devolução
    if (order.returnRequest && order.returnRequest.requestedAt) {
      return res.status(400).json({ 
        error: 'Já existe uma solicitação de devolução para este pedido',
        returnRequest: order.returnRequest 
      });
    }
    
    // Verificar se o pedido está elegível para devolução
    // Deve estar pago e dentro de 30 dias
    const statusLower = (order.status || '').toLowerCase();
    const isPaid = statusLower.includes('pago') || statusLower.includes('paid') || statusLower.includes('aprovado');
    
    if (!isPaid) {
      return res.status(400).json({ 
        error: 'Apenas pedidos pagos podem solicitar devolução' 
      });
    }
    
    // Verificar se está dentro de 30 dias
    const paidDate = order.paidAt || order.createdAt;
    if (!paidDate) {
      return res.status(400).json({ 
        error: 'Não foi possível determinar a data de pagamento' 
      });
    }
    
    const daysSincePurchase = Math.floor((new Date() - new Date(paidDate)) / (1000 * 60 * 60 * 24));
    
    if (daysSincePurchase > 30) {
      return res.status(400).json({ 
        error: 'O prazo de 30 dias para solicitar devolução já expirou',
        daysSincePurchase 
      });
    }
    
    // Criar solicitação de devolução
    order.returnRequest = {
      requestedAt: new Date(),
      reason: reason || 'Não informado',
      status: 'pending',
    };
    
    await order.save();
    
    // Enviar email para a Lunabê
    try {
      await sendReturnRequestEmail(order, reason);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de devolução:', emailError);
      // Não falhar a requisição se o email falhar, apenas logar
    }
    
    res.json({ 
      success: true, 
      message: 'Solicitação de devolução enviada com sucesso',
      returnRequest: order.returnRequest,
      daysSincePurchase 
    });
  } catch (err) {
    console.error('Erro ao solicitar devolução:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID do pedido inválido' });
    }
    
    res.status(500).json({ error: 'Erro ao processar solicitação de devolução' });
  }
});

// Atualizar status da devolução (Admin)
router.patch('/:id/return-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminKey = req.headers['x-admin-key'];
    
    // Verificar autenticação admin
    if (adminKey !== 'lunabe25') {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Validar formato do ID
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: 'ID do pedido inválido' });
    }
    
    // Validar status
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    if (!order.returnRequest || !order.returnRequest.requestedAt) {
      return res.status(400).json({ error: 'Este pedido não possui solicitação de devolução' });
    }
    
    // Atualizar status da devolução
    order.returnRequest.status = status;
    if (notes) {
      order.returnRequest.notes = notes;
    }
    
    await order.save();
    
    res.json({ 
      success: true, 
      message: 'Status da devolução atualizado',
      returnRequest: order.returnRequest
    });
  } catch (err) {
    console.error('Erro ao atualizar status da devolução:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID do pedido inválido' });
    }
    
    res.status(500).json({ error: 'Erro ao atualizar status da devolução' });
  }
});

// Get order by ID - DEVE vir DEPOIS de todas as rotas específicas
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar formato do ID (MongoDB ObjectId tem 24 caracteres hexadecimais)
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: 'ID do pedido inválido' });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Erro ao buscar pedido:', err);
    
    // Se o erro for de formato inválido do ObjectId
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID do pedido inválido' });
    }
    
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

export default router;
