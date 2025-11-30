// utils/abacatepay.js
// Cliente para integração com a API do AbacatePay
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

class AbacatePayClient {
  constructor() {
    // URL da API do AbacatePay (mesmo endpoint para dev e produção)
    // O ambiente é determinado pela chave de API utilizada
    this.baseURL = process.env.ABACATEPAY_API_URL || 'https://api.abacatepay.com/v1';
    this.apiKey = process.env.ABACATEPAY_API_KEY;
    
    if (!this.apiKey) {
      console.warn('ABACATEPAY_API_KEY não configurada');
    }

    // Criar instância do axios com configurações padrão
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 30000,
    });
  }

  /**
   * Criar uma sessão de checkout/pagamento
   * @param {Object} paymentData - Dados do pagamento
   * @returns {Promise<Object>} - Resposta da API com checkoutUrl e sessionId
   */
  async createCheckoutSession(paymentData) {
    try {
      const {
        amount, // valor total em centavos
        currency = 'BRL',
        customerEmail,
        customerName,
        customerPhone,
        items = [],
        metadata = {},
        successUrl,
        cancelUrl,
        webhookUrl,
      } = paymentData;

      if (!amount || amount <= 0) {
        throw new Error('Valor do pagamento deve ser maior que zero');
      }

      if (!customerEmail) {
        throw new Error('Email do cliente é obrigatório');
      }

      const payload = {
        amount: Math.round(amount), // garantir que está em centavos
        currency,
        customer: {
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
        },
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: Math.round(item.price * 100), // converter para centavos
        })),
        metadata,
        payment_methods: ['pix', 'credit_card', 'boleto'], // métodos suportados
        success_url: successUrl,
        cancel_url: cancelUrl,
        webhook_url: webhookUrl,
      };

      console.log('🔵 Fazendo POST para endpoint do AbacatePay');
      console.log('🔵 Base URL:', this.baseURL);
      console.log('🔵 Payload:', JSON.stringify(payload, null, 2));
      
      // IMPORTANTE: O endpoint /checkout/sessions não existe na API do AbacatePay
      // Tentando /payments que é o endpoint mais comum em APIs de pagamento
      // Se não funcionar, verificar a documentação oficial do AbacatePay
      
      let response;
      let endpoint = '/payments';
      
      try {
        console.log(`🔵 Tentando endpoint: ${endpoint}`);
        response = await this.client.post(endpoint, payload);
        console.log('✅ Resposta recebida do AbacatePay:', {
          status: response.status,
          hasData: !!response.data
        });
      } catch (error) {
        console.error('❌ Erro com endpoint /payments:', error.response?.data || error.message);
        
        // Se falhar, tentar /charges como alternativa
        if (error.response?.status === 404) {
          console.log('🔵 Tentando endpoint alternativo: /charges');
          try {
            endpoint = '/charges';
            response = await this.client.post(endpoint, payload);
            console.log('✅ Sucesso com endpoint /charges');
          } catch (err2) {
            console.error('❌ Endpoint /charges também falhou:', err2.response?.data || err2.message);
            throw error; // Lançar o erro original
          }
        } else {
          throw error;
        }
      }
      
      return {
        checkoutUrl: response.data.checkout_url || response.data.url,
        sessionId: response.data.session_id || response.data.id,
        paymentId: response.data.payment_id,
        qrCode: response.data.qr_code, // para PIX
        qrCodeBase64: response.data.qr_code_base64,
        expiresAt: response.data.expires_at,
      };
    } catch (error) {
      console.error('Erro ao criar sessão de checkout AbacatePay:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Erro ao criar sessão de pagamento no AbacatePay'
      );
    }
  }

  /**
   * Buscar informações de um pagamento/sessão
   * @param {String} sessionId - ID da sessão
   * @returns {Promise<Object>} - Dados do pagamento
   */
  async getSession(sessionId) {
    try {
      const response = await this.client.get(`/checkout/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar sessão AbacatePay:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar sessão de pagamento'
      );
    }
  }

  /**
   * Verificar status de um pagamento
   * @param {String} paymentId - ID do pagamento
   * @returns {Promise<Object>} - Status do pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return {
        status: response.data.status,
        paymentId: response.data.id,
        amount: response.data.amount,
        paidAt: response.data.paid_at,
        metadata: response.data.metadata,
      };
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error.response?.data || error.message);
      throw new Error('Erro ao verificar status do pagamento');
    }
  }

  /**
   * Verificar assinatura do webhook (segurança)
   * @param {String} signature - Assinatura do webhook
   * @param {Object} payload - Payload do webhook
   * @returns {Boolean} - Se a assinatura é válida
   */
  verifyWebhookSignature(signature, payload) {
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('ABACATEPAY_WEBHOOK_SECRET não configurada - webhook não verificado');
      // Em desenvolvimento, pode permitir sem verificação
      // Em produção, rejeitar se não tiver secret configurado
      return process.env.NODE_ENV !== 'production';
    }
    
    if (!signature) {
      console.warn('Webhook sem assinatura - rejeitando');
      return false;
    }
    
    // Verificar assinatura usando HMAC SHA256
    // A AbacatePay envia a assinatura no header, precisamos verificar
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadString)
        .digest('hex');
      
      // A assinatura pode vir em diferentes formatos (hex, base64, etc)
      // Verificar se corresponde (comparação segura)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
      
      if (!isValid) {
        console.warn('Webhook AbacatePay: assinatura inválida');
      }
      
      return isValid;
    } catch (error) {
      console.error('Erro ao verificar assinatura do webhook:', error);
      return false;
    }
  }

  /**
   * Processar notificação de webhook
   * @param {Object} webhookData - Dados recebidos do webhook
   * @returns {Object} - Dados processados
   */
  processWebhook(webhookData) {
    const eventType = webhookData.event || webhookData.type;
    const paymentData = webhookData.data || webhookData;

    return {
      eventType,
      paymentId: paymentData.payment_id || paymentData.id,
      sessionId: paymentData.session_id,
      status: paymentData.status,
      amount: paymentData.amount,
      paidAt: paymentData.paid_at,
      metadata: paymentData.metadata,
      rawData: webhookData,
    };
  }
}

export default new AbacatePayClient();



