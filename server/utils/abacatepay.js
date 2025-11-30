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
      
      // Baseado na documentação do AbacatePay (docs.abacatepay.com)
      // O SDK Python usa client.billing.create(), então o endpoint é /billing
      // Ajustar o payload conforme a documentação oficial
      
      // Reformatar payload para o formato esperado pelo AbacatePay
      // Conforme documentação: https://docs.abacatepay.com/api-reference/criar-uma-nova-cobranca
      const abacatepayPayload = {
        products: payload.items.map(item => ({
          externalId: item.name?.replace(/\s+/g, '_').toLowerCase() || 'product',
          name: item.name,
          quantity: item.quantity,
          price: item.unit_price, // já está em centavos
          description: item.name || 'Produto'
        })),
        customer: {
          email: payload.customer.email,
          name: payload.customer.name || 'Cliente',
          cellphone: payload.customer.phone || '',
          // taxId é obrigatório no AbacatePay - usar CPF do metadata
          // Formato esperado: apenas números (11 dígitos para CPF)
          // Se não houver CPF válido, usar um CPF genérico válido (11111111111)
          taxId: (payload.metadata && payload.metadata.customerTaxId && payload.metadata.customerTaxId.length === 11) 
            ? payload.metadata.customerTaxId 
            : '11111111111', // CPF genérico válido (não é um CPF real)
        },
        // Garantir que as URLs são válidas (sem placeholders e sem trailing slash)
        // returnUrl: URL de retorno após pagamento bem-sucedido
        // completionUrl: URL de retorno após conclusão (pode ser cancelamento)
        returnUrl: payload.success_url ? payload.success_url.replace(/{SESSION_ID}/g, '').replace(/\/$/, '') : '',
        completionUrl: payload.cancel_url ? payload.cancel_url.replace(/{SESSION_ID}/g, '').replace(/\/$/, '') : (payload.success_url ? payload.success_url.replace(/{SESSION_ID}/g, '').replace(/\/$/, '') : ''),
        frequency: 'ONE_TIME',
        methods: ['PIX', 'CREDIT_CARD', 'BOLETO'], // métodos de pagamento disponíveis
        metadata: payload.metadata
      };
      
      console.log('🔵 Payload formatado para AbacatePay:', JSON.stringify(abacatepayPayload, null, 2));
      
      // Endpoint correto conforme documentação: /billing/create
      const endpoint = '/billing/create';
      console.log(`🔵 Chamando endpoint: ${this.baseURL}${endpoint}`);
      
      const response = await this.client.post(endpoint, abacatepayPayload);
      
      console.log('✅ Resposta recebida do AbacatePay:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      // Mapear resposta do AbacatePay para o formato esperado
      // A resposta do billing.create() retorna: { data: { url, id, ... }, error: null }
      const billingData = response.data?.data || response.data;
      
      console.log('🔵 Dados da cobrança recebidos:', JSON.stringify(billingData, null, 2));
      console.log('🔵 Chaves disponíveis:', billingData ? Object.keys(billingData) : []);
      
      // Extrair dados do PIX se disponíveis (pode estar em diferentes formatos)
      const pixData = billingData.pix || billingData.payment_methods?.pix || {};
      
      return {
        checkoutUrl: billingData.url || billingData.checkout_url || billingData.payment_url,
        sessionId: billingData.id || billingData.session_id || billingData.billing_id,
        paymentId: billingData.id || billingData.payment_id || billingData.billing_id,
        qrCode: pixData?.qr_code || pixData?.pix_copy_paste || billingData.qr_code || billingData.pix_qrcode_text || billingData.pix_copy_paste,
        qrCodeBase64: pixData?.qr_code_base64 || billingData.qr_code_base64 || billingData.pix_qrcode_base64,
        expiresAt: pixData?.expires_at || billingData.expires_at || billingData.pix_expires_at,
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



