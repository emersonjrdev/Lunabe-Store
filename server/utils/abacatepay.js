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
    this.baseURL = process.env.ABACATEPAY_API_URL || 'https://api.abacatepay.com/v1';;
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
      
      // Validar URLs
      if (!successUrl || !successUrl.startsWith('http')) {
        throw new Error('URL de sucesso inválida');
      }
      if (!cancelUrl || !cancelUrl.startsWith('http')) {
        throw new Error('URL de cancelamento inválida');
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
      
      // Endpoint correto conforme documentação: /billing/create
      const endpoint = '/billing/create';
      console.log(`🔵 Chamando endpoint: ${this.baseURL}${endpoint}`);
      
      const response = await this.client.post(endpoint, payload);
      
      console.log('✅ Resposta recebida do AbacatePay:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      // Mapear resposta do AbacatePay para o formato esperado
      // A resposta do billing.create() retorna: { data: { url, id, ... }, error: null }
      const responseData = response.data;
      
      // Verificar se há erro na resposta
      if (responseData.error) {
        throw new Error(responseData.error.message || responseData.error || 'Erro na resposta da API');
      }
      
      const billingData = responseData.data || responseData;
      
      if (!billingData) {
        throw new Error('Resposta da API não contém dados válidos');
      }
      
      console.log('🔵 Dados da cobrança recebidos:', JSON.stringify(billingData, null, 2));
      
      return {
        checkoutUrl: billingData.url || billingData.checkout_url,
        sessionId: billingData.id || billingData.session_id,
        paymentId: billingData.id || billingData.payment_id,
        qrCode: billingData.qr_code || billingData.pix?.qr_code || null,
        qrCodeBase64: billingData.qr_code_base64 || billingData.pix?.qr_code_base64 || null,
        expiresAt: billingData.expires_at || billingData.pix?.expires_at || null,
      };
    } catch (error) {
      console.error('❌ ========== ERRO DETALHADO ABACATEPAY ==========');
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Status HTTP:', error.response?.status);
      console.error('❌ Status Text:', error.response?.statusText);
      console.error('❌ Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Request URL:', error.config?.url);
      console.error('❌ Request Method:', error.config?.method);
      console.error('❌ Request Headers:', JSON.stringify(error.config?.headers, null, 2));
      console.error('❌ Stack:', error.stack);
      console.error('❌ =========================================');
      
      // Preservar o erro original para melhor diagnóstico
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Erro ao criar sessão de pagamento no AbacatePay';
      
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.responseData = error.response?.data;
      enhancedError.statusCode = error.response?.status;
      
      throw enhancedError;
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
    const eventType = webhookData.event || webhookData.type || webhookData.event_type;
    const paymentData = webhookData.data || webhookData;

    // Normalizar status do AbacatePay
    let normalizedStatus = paymentData.status;
    if (normalizedStatus) {
      normalizedStatus = normalizedStatus.toLowerCase();
      // Mapear status do AbacatePay para eventos
      if (normalizedStatus === 'paid' || normalizedStatus === 'pago' || normalizedStatus === 'approved' || normalizedStatus === 'aprovado') {
        return {
          eventType: 'payment.paid',
          paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
          sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
          status: 'Pago',
          amount: paymentData.amount,
          paidAt: paymentData.paid_at || paymentData.paidAt || new Date(),
          metadata: paymentData.metadata,
          rawData: webhookData,
        };
      } else if (normalizedStatus === 'pending' || normalizedStatus === 'pendente') {
        return {
          eventType: 'payment.pending',
          paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
          sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
          status: 'Aguardando pagamento',
          amount: paymentData.amount,
          paidAt: null,
          metadata: paymentData.metadata,
          rawData: webhookData,
        };
      } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'cancelado' || normalizedStatus === 'canceled') {
        return {
          eventType: 'payment.cancelled',
          paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
          sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
          status: 'Cancelado',
          amount: paymentData.amount,
          paidAt: null,
          metadata: paymentData.metadata,
          rawData: webhookData,
        };
      }
    }

    return {
      eventType: eventType || 'payment.unknown',
      paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
      sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
      status: paymentData.status || 'Desconhecido',
      amount: paymentData.amount,
      paidAt: paymentData.paid_at || paymentData.paidAt,
      metadata: paymentData.metadata,
      rawData: webhookData,
    };
  }
}

export default new AbacatePayClient();



