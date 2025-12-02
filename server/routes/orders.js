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
    
    if (paymentMethod === 'rede') {
      // Pagamento via Red-e (Cartão de Crédito/Débito)
      console.log('🔵 Processando pagamento via Red-e...');
      
      // Construir URL do Red-e com parâmetros do pedido
      const redeUrl = new URL('https://meu.userede.com.br');
      redeUrl.searchParams.set('orderId', order._id.toString());
      redeUrl.searchParams.set('amount', (totalInCents / 100).toFixed(2));
      redeUrl.searchParams.set('email', customerEmail);
      redeUrl.searchParams.set('name', userData?.name || customerName || 'Cliente');
      redeUrl.searchParams.set('phone', userData?.phone || customerPhone || '');
      
      // Atualizar pedido
      order.paymentMethod = 'rede';
      order.paymentSessionId = order._id.toString();
      await order.save();
      
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
      
      return res.json({
        checkoutUrl: redeUrl.toString(),
        orderId: order._id.toString(),
        paymentMethod: 'rede',
      });
    } else if (paymentMethod === 'itau-pix') {
      // Pagamento via PIX Itaú (API)
      console.log('🔵 Processando pagamento via PIX Itaú (API)...');
      console.log('🔵 Total em centavos:', totalInCents);
      console.log('🔵 Order ID:', order._id.toString());
      
      try {
        // Verificar se as credenciais da API estão configuradas (OBRIGATÓRIO)
        const hasApiCredentials = process.env.ITAU_CLIENT_ID && process.env.ITAU_CLIENT_SECRET;
        
        if (!hasApiCredentials) {
          console.error('❌ Credenciais da API Itaú não configuradas!');
          console.error('❌ ITAU_CLIENT_ID:', process.env.ITAU_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado');
          console.error('❌ ITAU_CLIENT_SECRET:', process.env.ITAU_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado');
          return res.status(500).json({
            error: 'Configuração de pagamento PIX não disponível',
            details: 'As credenciais da API Itaú não estão configuradas. Códigos PIX estáticos não são mais aceitos pelos bancos. Por favor, configure ITAU_CLIENT_ID e ITAU_CLIENT_SECRET no servidor.',
            requiresApi: true,
          });
        }
        
        // Usar API do Itaú para gerar QR Code dinâmico (OBRIGATÓRIO)
        console.log('🔵 Gerando PIX dinâmico via API Itaú...');
        let pixData;
        
        try {
          console.log('🔵 Iniciando geração de PIX via API Itaú...');
          console.log('🔵 Order ID:', order._id.toString());
          console.log('🔵 Total (centavos):', totalInCents);
          console.log('🔵 Total (reais):', (totalInCents / 100).toFixed(2));
          
          pixData = await generatePixViaApi(order, totalInCents);
          
          console.log('✅ PIX gerado via API com sucesso:', {
            hasQrCode: !!pixData.qrCode,
            qrCodeLength: pixData.qrCode?.length,
            chave: pixData.chave,
            valor: pixData.valor,
            txId: pixData.txId,
            location: pixData.location,
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
            error: 'Erro ao gerar código PIX via API Itaú',
            details: errorMessage,
            status: apiError.response?.status,
            apiError: errorDetails,
            suggestion: 'Verifique as credenciais do Itaú no Render, se a chave PIX está cadastrada, e se o ambiente está correto (production/sandbox).',
          });
        }
        
        if (!pixData || !pixData.qrCode) {
          throw new Error('QR Code PIX não foi retornado pela API Itaú');
        }
        
        // Atualizar pedido com dados do PIX
        order.paymentMethod = 'itau-pix';
        order.paymentSessionId = pixData.txId || order._id.toString();
        order.pixQrCode = pixData.qrCode;
        order.pixChave = pixData.chave;
        order.pixValor = pixData.valor;
        if (pixData.txId) {
          order.pixTxId = pixData.txId; // Salvar txId para consulta posterior
        }
        if (pixData.location) {
          order.pixLocation = pixData.location; // Salvar location para consulta
        }
        await order.save();
        console.log('✅ Pedido atualizado com dados PIX');
        
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
        
        return res.json({
          orderId: order._id.toString(),
          paymentMethod: 'itau-pix',
          pixQrCode: pixData.qrCode,
          pixQrCodeBase64: pixData.qrCodeBase64 || null, // Imagem do QR Code se disponível
          pixChave: pixData.chave,
          pixValor: pixData.valor,
          pixDescricao: pixData.descricao,
          pixTxId: pixData.txId || null,
        });
      } catch (pixError) {
        console.error('❌ Erro crítico ao gerar PIX:', pixError);
        console.error('❌ Stack trace:', pixError.stack);
        console.error('❌ Tipo do erro:', pixError.constructor.name);
        console.error('❌ Mensagem completa:', pixError.message);
        
        return res.status(500).json({
          error: 'Erro ao gerar código PIX',
          details: pixError.message,
          suggestion: 'Códigos PIX estáticos não são mais aceitos pelos bancos. É necessário configurar a API do Itaú com credenciais válidas.',
          requiresApi: true,
        });
      }
    } else {
      return res.status(400).json({
        error: 'Método de pagamento inválido',
        details: `Método "${paymentMethod}" não é suportado. Use "rede" ou "itau-pix".`,
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

export default router;
