// routes/orders.js
import express from "express";
// Using AbacatePay API integration
import jwt from 'jsonwebtoken';
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
  try {
    console.log('🔵 Recebendo requisição de checkout');
    let { items, customerEmail, address, customerName, customerPhone } = req.body;
    console.log('🔵 Dados recebidos:', { 
      itemsCount: items?.length, 
      customerEmail, 
      hasAddress: !!address,
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
    const totalInCents = Math.round(total * 100);

    if (totalInCents <= 0) {
      return res.status(400).json({ error: 'Valor total deve ser maior que zero' });
    }

    const front = process.env.FRONTEND_URL || 'http://localhost:5173';
    const backend = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

    // Criar pedido no banco de dados primeiro (status: Aguardando pagamento)
    // Armazenar informações de estoque no pedido para uso posterior no webhook
    const order = new Order({
      email: customerEmail,
      items: validatedItems,
      total,
      status: "Aguardando pagamento",
      address: address ? {
        street: sanitizeString(address.street || ''),
        city: sanitizeString(address.city || ''),
        state: sanitizeString(address.state || ''),
        zip: sanitizeString(address.zip || ''),
        country: sanitizeString(address.country || 'Brasil'),
        name: sanitizeString(address.name || customerName),
        phone: sanitizeString(address.phone || customerPhone),
      } : null,
      paymentSessionId: "pending", // será atualizado após criar sessão no AbacatePay
      // Armazenar informações de estoque para uso no webhook
      stockReservations: stockChecks, // Array de {productId, quantity, availableStock}
    });
    await order.save();

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

    // Criar sessão de checkout no AbacatePay
    try {
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
        },
        successUrl: `${front}/success?session_id={SESSION_ID}`,
        cancelUrl: `${front}/carrinho`,
        webhookUrl: `${backend}/api/webhooks/abacatepay`,
      });

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
    res.status(500).json({ 
      error: err.message || 'Erro ao processar pedido',
      details: err.stack 
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


// Get order by payment/session id
router.get('/session/:sessionId', async (req, res) => {
  try {
    // support both the new paymentSessionId and legacy stripeSessionId
    const order = await Order.findOne({ $or: [ { paymentSessionId: req.params.sessionId }, { stripeSessionId: req.params.sessionId } ] });
    // If the request has an auth header, verify that the authenticated user is the owner
    const auth = req.headers.authorization;
    if (auth) {
      try {
        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload || !payload.id) return res.status(401).json({ error: 'Unauthorized' });
        // load user and compare email (if you need stricter control)
      } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch (err) {
    console.error('Erro ao buscar pedido:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order by id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    // require auth & ensure owner
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const token = auth.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload?.id) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(payload.id);
      if (!user || user.email !== order.email) return res.status(401).json({ error: 'Unauthorized' });
      res.json(order);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (err) {
    console.error('Erro ao buscar pedido por session:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list all orders (requires X-Admin-Key header)
router.get('/all', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!process.env.ADMIN_SECRET) {
      console.error('ADMIN_SECRET não configurado no servidor');
      return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }
    
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    console.error('Erro ao buscar todos os pedidos:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
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
