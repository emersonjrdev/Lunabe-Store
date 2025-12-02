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
import pixUtils from '../utils/pix.js';
import { generatePixForOrder as generatePixViaApi } from '../utils/itau-pix.js';
import { createRedeTransaction, createRedePixCharge } from '../utils/rede.js';
import RedePaymentLinkClient from '../utils/rede-payment-link.js';
import { sendOrderEmail, sendPaymentConfirmationEmail, sendStatusUpdateEmail } from '../utils/mailer.js';
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
    console.log('🔵 Dados recebidos:', { 
      itemsCount: items?.length, 
      customerEmail, 
      hasAddress: !!address,
      hasCpf: !!cpf,
      cpfLength: cpf?.length,
      address: address ? { street: address.street, city: address.city, zip: address.zip } : null
    });

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
    console.log('🔵 Criando pedido no banco de dados...');
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
        pickupAddress: deliveryType === 'pickup' ? 'Tv. Joaquim Soares Rodrigues - Jardim Portao Vermelho, Vargem Grande Paulista - SP, 06735-322' : null,
        paymentSessionId: "pending", // será atualizado após criar sessão no AbacatePay
        // Armazenar informações de estoque para uso no webhook
        stockReservations: stockChecks, // Array de {productId, quantity, availableStock}
      });
      await order.save();
      console.log('✅ Pedido criado no banco:', order._id);
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
    console.log('🔵 Comparação rede:', paymentMethod === 'rede');
    console.log('🔵 Comparação rede-pix:', paymentMethod === 'rede-pix');
    console.log('🔵 Comparação itau-pix:', paymentMethod === 'itau-pix');
    
    if (paymentMethod === 'rede') {
      // Pagamento via Link de Pagamento da Rede (Cartão de Crédito/Débito)
      console.log('🔵 Criando Link de Pagamento para cartão via API Red-e...');
      let paymentLinkData;
      
      try {
        const paymentLinkClient = new RedePaymentLinkClient();
        
        console.log('🔵 Iniciando criação de Link de Pagamento (cartão)...');
        console.log('🔵 Order ID:', order._id.toString());
        console.log('🔵 Total (centavos):', totalInCents);
        console.log('🔵 Total (reais):', (totalInCents / 100).toFixed(2));
        console.log('🔵 Email do cliente:', customerEmail);
        
        paymentLinkData = await paymentLinkClient.createPaymentLink({
          amount: totalInCents,
          reference: order._id.toString(),
          description: `Pedido ${order._id.toString().slice(-8)} - Lunabê`,
          customerEmail: customerEmail,
          customerName: customerName || null,
          expirationDays: 7, // Link expira em 7 dias
        });
        
        console.log('✅ Link de Pagamento criado com sucesso (cartão):', {
          paymentLinkId: paymentLinkData.paymentLinkId,
          paymentLinkUrl: paymentLinkData.paymentLinkUrl,
          status: paymentLinkData.status,
        });
      } catch (apiError) {
        console.error('❌ ========== ERRO AO CRIAR LINK DE PAGAMENTO (CARTÃO) ==========');
        console.error('❌ Mensagem:', apiError.message);
        console.error('❌ Status HTTP:', apiError.response?.status);
        console.error('❌ Status Text:', apiError.response?.statusText);
        console.error('❌ Dados da resposta:', JSON.stringify(apiError.response?.data, null, 2));
        console.error('❌ Stack trace:', apiError.stack);
        console.error('❌ =========================================');
        
        // Retornar erro detalhado para ajudar no diagnóstico
        const errorDetails = apiError.response?.data || {};
        const errorMessage = apiError.message || 'Erro desconhecido ao criar link de pagamento';
        
        return res.status(500).json({
          error: 'Erro ao criar link de pagamento via API Red-e',
          details: errorMessage,
          status: apiError.response?.status,
          apiError: errorDetails,
          suggestion: 'Verifique as credenciais da Red-e no Render (REDE_PV, REDE_TOKEN e REDE_AFFILIATION) e se o ambiente está correto (production/sandbox).',
        });
      }
      
      if (!paymentLinkData || !paymentLinkData.paymentLinkUrl) {
        throw new Error('URL do Link de Pagamento não foi retornada pela API Red-e');
      }
      
      // Atualizar pedido com dados do Link de Pagamento
      order.paymentMethod = 'rede';
      order.paymentSessionId = paymentLinkData.paymentLinkId || order._id.toString();
      order.paymentLinkUrl = paymentLinkData.paymentLinkUrl; // URL do link de pagamento
      order.paymentLinkId = paymentLinkData.paymentLinkId; // ID do link para consulta
      await order.save();
      console.log('✅ Pedido atualizado com dados do Link de Pagamento (cartão)');
      
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
      sendOrderEmail(customerEmail, order).catch(err => {
        console.error('Erro ao enviar email de confirmação (não crítico):', err);
      });
      
      // Retornar dados do Link de Pagamento
      return res.json({
        orderId: order._id.toString(),
        paymentMethod: 'rede',
        checkoutUrl: paymentLinkData.paymentLinkUrl, // URL do link de pagamento
        paymentLinkUrl: paymentLinkData.paymentLinkUrl, // URL do link de pagamento
        paymentLinkId: paymentLinkData.paymentLinkId, // ID para consulta
        reference: paymentLinkData.reference,
        expirationDate: paymentLinkData.expirationDate,
        status: paymentLinkData.status,
        amount: totalInCents,
        message: 'Pedido criado. Redirecionando para página de pagamento...',
      });
    } else if (paymentMethod === 'itau-pix' || paymentMethod === 'rede-pix') {
      // Pagamento via PIX Red-e (API)
      console.log('🔵 Processando pagamento via PIX Red-e (API)...');
      console.log('🔵 Total em centavos:', totalInCents);
      console.log('🔵 Order ID:', order._id.toString());
      
      try {
        // Verificar se as credenciais da API Red-e estão configuradas (OBRIGATÓRIO)
        const hasApiCredentials = process.env.REDE_PV && process.env.REDE_TOKEN;
        
        if (!hasApiCredentials) {
          console.error('❌ Credenciais da API Red-e não configuradas!');
          console.error('❌ REDE_PV:', process.env.REDE_PV ? '✅ Configurado' : '❌ Não configurado');
          console.error('❌ REDE_TOKEN:', process.env.REDE_TOKEN ? '✅ Configurado' : '❌ Não configurado');
          return res.status(500).json({
            error: 'Configuração de pagamento PIX não disponível',
            details: 'As credenciais da API Red-e não estão configuradas. Por favor, configure REDE_PV e REDE_TOKEN no servidor.',
            requiresApi: true,
          });
        }
        
        // Usar API PIX direta da Red-e (não Link de Pagamento)
        // A URL https://www.lunabe.com.br/pix-payment/{orderId} foi liberada pela Rede
        console.log('🔵 Gerando PIX dinâmico via API Red-e (PIX direto)...');
        let pixData;
        
        try {
          console.log('🔵 Iniciando geração de PIX via API Red-e...');
          console.log('🔵 Order ID:', order._id.toString());
          console.log('🔵 Total (centavos):', totalInCents);
          console.log('🔵 Total (reais):', (totalInCents / 100).toFixed(2));
          
          pixData = await createRedePixCharge(order, totalInCents);
          
          console.log('✅ PIX gerado via API Red-e com sucesso:', {
            hasQrCode: !!pixData.qrCode,
            qrCodeLength: pixData.qrCode?.length,
            chargeId: pixData.chargeId,
            valor: pixData.valor,
            status: pixData.status,
          });
        } catch (apiError) {
          console.error('❌ ========== ERRO AO GERAR PIX ==========');
          console.error('❌ Mensagem:', apiError.message);
          console.error('❌ Status HTTP:', apiError.response?.status);
          console.error('❌ Status Text:', apiError.response?.statusText);
          console.error('❌ Dados da resposta:', JSON.stringify(apiError.response?.data, null, 2));
          console.error('❌ Stack trace:', apiError.stack);
          console.error('❌ =========================================');
          
          // Retornar erro detalhado para ajudar no diagnóstico
          const errorDetails = apiError.response?.data || {};
          const errorMessage = apiError.message || 'Erro desconhecido ao gerar PIX';
          
          return res.status(500).json({
            error: 'Erro ao gerar código PIX via API Red-e',
            details: errorMessage,
            status: apiError.response?.status,
            apiError: errorDetails,
            suggestion: 'Verifique as credenciais da Red-e no Render (REDE_PV e REDE_TOKEN) e se o ambiente está correto (production/sandbox).',
          });
        }
        
        if (!pixData || !pixData.qrCode) {
          throw new Error('QR Code PIX não foi retornado pela API Red-e');
        }
        
        // Atualizar pedido com dados do PIX
        order.paymentMethod = 'rede-pix';
        order.paymentSessionId = pixData.chargeId || order._id.toString();
        order.pixQrCode = pixData.qrCode;
        order.pixChave = '63824145000127'; // Chave PIX da Red-e
        order.pixValor = pixData.valor;
        if (pixData.chargeId) {
          order.pixTxId = pixData.chargeId; // Salvar chargeId para consulta posterior
        }
        await order.save();
        console.log('✅ Pedido atualizado com dados PIX Red-e');
        
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
        sendOrderEmail(customerEmail, order).catch(err => {
          console.error('Erro ao enviar email de confirmação (não crítico):', err);
        });
        
        // URL do webhook para notificações da Red-e
        const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'https://lunabe-store.onrender.com';
        const webhookUrl = `${backendUrl}/api/webhooks/rede-pix`;

        // Retornar dados do PIX (URL liberada: https://www.lunabe.com.br/pix-payment/{orderId})
        return res.json({
          orderId: order._id.toString(),
          paymentMethod: 'rede-pix',
          pixQrCode: pixData.qrCode,
          pixQrCodeBase64: pixData.qrCodeBase64 || null, // Imagem do QR Code se disponível
          pixChave: '63824145000127',
          pixValor: pixData.valor,
          pixDescricao: pixData.descricao,
          pixTxId: pixData.chargeId || null,
          webhookUrl: webhookUrl, // URL para configurar na Red-e
        });
      } catch (pixError) {
        console.error('❌ Erro crítico ao gerar PIX:', pixError);
        console.error('❌ Stack trace:', pixError.stack);
        console.error('❌ Tipo do erro:', pixError.constructor.name);
        console.error('❌ Mensagem completa:', pixError.message);
        
        return res.status(500).json({
          error: 'Erro ao gerar código PIX',
          details: pixError.message,
          suggestion: 'Verifique as credenciais da Red-e (REDE_PV e REDE_TOKEN) no servidor.',
          requiresApi: true,
        });
      }
    } else {
      return res.status(400).json({
        error: 'Método de pagamento inválido',
        details: `Método "${paymentMethod}" não é suportado. Use "rede" (cartão) ou "rede-pix" (PIX).`,
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
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
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

    // mark as paid
    order.status = 'Pago';
    await order.save();

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

export default router;
