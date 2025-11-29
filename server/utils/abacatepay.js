// utils/abacatepay.js
// Cliente para integração com a API do AbacatePay
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class AbacatePayClient {
  constructor() {
    // URLs da API do AbacatePay
    this.baseURL = process.env.ABACATEPAY_API_URL || 'https://api.abacatepay.com/v1';
    this.apiKey = process.env.ABACATEPAY_API_KEY;
    this.secretKey = process.env.ABACATEPAY_SECRET_KEY;
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Em modo de desenvolvimento, usar URL de sandbox se disponível
    if (!this.isProduction) {
      this.baseURL = process.env.ABACATEPAY_SANDBOX_URL || this.baseURL;
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

      const response = await this.client.post('/checkout/sessions', payload);
      
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
    // Implementar verificação de assinatura conforme documentação do AbacatePay
    // Por enquanto, retorna true (implementar conforme necessário)
    if (!this.secretKey) {
      console.warn('ABACATEPAY_SECRET_KEY não configurada - webhook não verificado');
      return true; // em desenvolvimento, permitir sem verificação
    }
    
    // TODO: Implementar verificação real conforme documentação
    // Exemplo genérico:
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', this.secretKey)
    //   .update(JSON.stringify(payload))
    //   .digest('hex');
    // return signature === expectedSignature;
    
    return true;
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

