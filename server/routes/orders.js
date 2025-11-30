// routes/orders.js
import express from "express";
// Using AbacatePay API integration
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from "../models/Order.js"; // modelo do pedido
import Product from "../models/Product.js"; // modelo do produto
import dotenv from "dotenv";
import abacatepayClient from '../utils/abacatepay.js';
import { sendOrderEmail, sendPaymentConfirmationEmail, sendStatusUpdateEmail } from '../utils/mailer.js';

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

    // Validar e verificar estoque de cada item
    const validatedItems = [];
    const stockChecks = [];

    for (const item of items) {
      // Validar campos obrigatórios
      if (!item.productId && !item.id) {
        return res.status(400).json({ 
          error: `Produto sem ID: ${item.name || 'Produto desconhecido'}` 
        });
      }

      const productId = item.productId || item.id;
      const quantity = parseInt(item.quantity) || 1;
      const price = parseFloat(item.price) || 0;

      // Validar quantidade
      if (quantity <= 0 || quantity > 100) {
        return res.status(400).json({ 
          error: `Quantidade inválida para ${item.name || 'produto'}: ${quantity}` 
        });
      }

      // Validar preço
      if (price <= 0 || price > 100000) {
        return res.status(400).json({ 
          error: `Preço inválido para ${item.name || 'produto'}: R$ ${price}` 
        });
      }

      // Buscar produto no banco para verificar estoque e preço
      try {
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ 
            error: `Produto não encontrado: ${item.name || productId}` 
          });
        }

        // Verificar estoque disponível
        const availableStock = product.stock || 0;
        if (availableStock < quantity) {
          return res.status(400).json({ 
            error: `Estoque insuficiente para ${product.name}. Disponível: ${availableStock}, Solicitado: ${quantity}` 
          });
        }

        // Validar que o preço não foi alterado (tolerância de 1%)
        const productPrice = (product.price_cents || 0) / 100;
        const priceDifference = Math.abs(price - productPrice);
        if (priceDifference > productPrice * 0.01) {
          console.warn(`Aviso: Preço alterado para ${product.name}. Original: R$ ${productPrice}, Recebido: R$ ${price}`);
        }

        // Armazenar verificação de estoque (será usado apenas se pagamento for confirmado)
        stockChecks.push({
          productId: product._id.toString(),
          quantity,
          availableStock
        });

        validatedItems.push({
          productId: product._id.toString(),
          name: sanitizeString(item.name || product.name),
          price: productPrice, // Usar preço do banco, não o enviado
          quantity,
          image: item.image || (product.images && product.images[0]) || null,
        });
      } catch (err) {
        console.error(`Erro ao buscar produto ${productId}:`, err);
        return res.status(500).json({ 
          error: `Erro ao validar produto: ${item.name || productId}` 
        });
      }
    }

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

    // Se for pagamento via Itaú, retornar apenas o ID do pedido
    if (paymentMethod === 'itau') {
      console.log('🔵 Pagamento via Itaú selecionado');
      return res.json({
        orderId: order._id.toString(),
        paymentMethod: 'itau',
        message: 'Pedido criado. Redirecione para o link de pagamento do Itaú.'
      });
    }

    // Criar sessão de checkout no AbacatePay
    console.log('🔵 Criando sessão de checkout no AbacatePay...');
    console.log('🔵 CPF recebido:', cpf);
    console.log('🔵 CPF limpo:', cpf ? cpf.replace(/\D/g, '') : null);
    try {
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : null;
      const checkoutData = await abacatepayClient.createCheckoutSession({
        amount: totalInCents,
        currency: 'BRL',
        customerEmail,
        customerName: userData?.name || customerName || 'Cliente',
        customerPhone: userData?.phone || customerPhone,
        items: validatedItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        metadata: {
          orderId: order._id.toString(),
          customerEmail,
          customerTaxId: cleanCpf && cleanCpf.length === 11 ? cleanCpf : null, // CPF do cliente (apenas números, 11 dígitos)
          deliveryType: deliveryType || 'delivery',
        },
        // URLs devem ser válidas sem placeholders
        // URLs devem ser válidas sem placeholders - AbacatePay redireciona com parâmetros na URL
        successUrl: `${cleanFront}/success`,
        cancelUrl: `${cleanFront}/carrinho`,
        webhookUrl: `${cleanBackend}/api/webhooks/abacatepay`,
      });
      console.log('✅ Sessão de checkout criada:', checkoutData.sessionId);

      // Atualizar pedido com dados da sessão do AbacatePay
      order.paymentSessionId = checkoutData.sessionId;
      order.abacatepayPaymentId = checkoutData.paymentId;
      order.abacatepayQrCode = checkoutData.qrCode;
      order.abacatepayQrCodeBase64 = checkoutData.qrCodeBase64;
      await order.save();

      // Enviar email de confirmação de pedido criado (em background, não bloquear resposta)
      sendOrderEmail(customerEmail, order).catch(err => {
        console.error('Erro ao enviar email de confirmação (não crítico):', err);
      });

      // Retornar URL de checkout do AbacatePay
      res.json({
        checkoutUrl: checkoutData.checkoutUrl,
        sessionId: checkoutData.sessionId,
        paymentId: checkoutData.paymentId,
        qrCode: checkoutData.qrCode, // para exibir QR Code PIX se necessário
        qrCodeBase64: checkoutData.qrCodeBase64,
      });
    } catch (abacatepayError) {
      console.error('❌ Erro ao criar sessão no AbacatePay:', abacatepayError);
      console.error('❌ Stack trace:', abacatepayError.stack);
      console.error('❌ Detalhes do erro:', {
        message: abacatepayError.message,
        response: abacatepayError.response?.data,
        status: abacatepayError.response?.status,
      });
      
      // Se falhar, manter fallback para página simulada (modo desenvolvimento)
      if (process.env.NODE_ENV !== 'production' && !process.env.ABACATEPAY_API_KEY) {
        console.warn('AbacatePay não configurado - usando modo de desenvolvimento');
        order.paymentSessionId = order._id.toString();
        await order.save();
        
        res.json({
          checkoutUrl: `${front}/abacatepay/checkout/${order.paymentSessionId}`,
          sessionId: order.paymentSessionId,
        });
      } else {
        // Em produção ou com API key configurada, retornar erro detalhado
        const errorMessage = abacatepayError.response?.data?.message || 
                            abacatepayError.response?.data?.error || 
                            abacatepayError.message || 
                            'Erro ao criar sessão de pagamento';
        console.error('❌ Retornando erro 500:', errorMessage);
        res.status(500).json({
          error: 'Erro ao criar sessão de pagamento',
          details: errorMessage,
        });
      }
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
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
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
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
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
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
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
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    
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
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    
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

export default router;
