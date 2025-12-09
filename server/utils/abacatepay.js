import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

class AbacatePayClient {
  constructor() {
    this.baseURL = process.env.ABACATEPAY_API_URL || "https://api.abacatepay.com/v1"
    this.apiKey = process.env.ABACATEPAY_API_KEY;

    if (!this.apiKey) {
      console.warn("⚠️ ABACATEPAY_API_KEY não configurada no .env");
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async createCheckoutSession(paymentData) {
    try {
      const {
        orderId,
        amount,
        currency = "BRL",
        customerEmail,
        customerName,
        customerPhone,
        customerTaxId,
        items,
        successUrl,
        cancelUrl,
        metadata,
      } = paymentData;

      if (!orderId) {
        throw new Error("orderId é obrigatório e não foi enviado para createCheckoutSession()");
      }

      // Sanitizar dados do cliente
      const sanitizedCellphone = (customerPhone || "").toString().replace(/\D/g, "");
      const sanitizedTaxId = (customerTaxId || "").toString().replace(/\D/g, "").substring(0, 11) || '11111111111';

      // Formato para /billing/create conforme documentação oficial
      const payload = {
        frequency: 'ONE_TIME',
        methods: ['PIX', 'CARD'], // métodos de pagamento
        products: items.map((item, index) => ({
          externalId: `${orderId}_${index}`, // usar orderId no externalId
          name: item.name || 'Produto',
          description: item.name || 'Produto', // description é obrigatório conforme documentação
          quantity: item.quantity || 1,
          price: Math.round(item.price * 100), // em centavos
        })),
        returnUrl: successUrl,
        completionUrl: successUrl,
        customer: {
          name: customerName || 'Cliente',
          cellphone: sanitizedCellphone,
          email: customerEmail,
          taxId: sanitizedTaxId,
        },
        allowCoupons: false,
        coupons: [],
        externalId: orderId, // externalId no nível raiz conforme documentação
        metadata: metadata || {}
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
      
      const checkoutUrl =
        billingData.url ||
        billingData.checkout_url ||
        (billingData.id ? `https://abacatepay.com/pay/${billingData.id}` : null);

      const qrCode =
        billingData.qr_code ||
        billingData.pix?.qr_code ||
        billingData.pix?.qrcode ||
        null;

      const qrCodeBase64 =
        billingData.qr_code_base64 ||
        billingData.pix?.qr_code_base64 ||
        billingData.pix?.qrcode_base64 ||
        null;

      return {
        checkoutUrl,
        sessionId: billingData.id,
        paymentId: billingData.id,
        qrCode,
        qrCodeBase64,
        expiresAt: billingData.expires_at || billingData.pix?.expires_at || null,
        raw: billingData,
      };
    } catch (error) {
      console.error("❌ ========== ERRO DETALHADO ABACATEPAY ==========");
      console.error("❌ Mensagem:", error.message);
      console.error("❌ Status HTTP:", error.response?.status);
      console.error("❌ Response Data:", JSON.stringify(error.response?.data, null, 2));
      console.error("❌ Stack:", error.stack);
      console.error("❌ =========================================");

      throw new Error(error.message || "Erro ao criar sessão de pagamento no AbacatePay");
    }
  }

  /**
   * Buscar informações de uma cobrança/billing
   * @param {String} billingId - ID da cobrança (bill_xxx)
   * @returns {Promise<Object>} - Dados da cobrança incluindo QR Code PIX
   */
  async getBilling(billingId) {
    try {
      console.log(`🔵 Buscando billing: ${billingId}`);
      const response = await this.client.get(`/billing/get`, {
        params: { id: billingId }
      });
      
      const responseData = response.data;
      const billingData = responseData.data || responseData;
      
      console.log('🔵 Dados do billing recebidos:', JSON.stringify(billingData, null, 2));
      
      return {
        id: billingData.id,
        url: billingData.url,
        status: billingData.status,
        amount: billingData.amount,
        qrCode: billingData.qr_code || billingData.pix?.qr_code || billingData.pix?.qrcode || null,
        qrCodeBase64: billingData.qr_code_base64 || billingData.pix?.qr_code_base64 || billingData.pix?.qrcode_base64 || null,
        methods: billingData.methods || [],
        raw: billingData,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar billing AbacatePay:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erro ao buscar cobrança');
    }
  }

  // -------------------------------------------------------------
  // Mantive todas as funções abaixo do JEITO QUE ESTAVAM
  // -------------------------------------------------------------

  async getSession(sessionId) {
    try {
      const response = await this.client.get(`/checkout/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error(
        "Erro ao buscar sessão AbacatePay:",
        error.response?.data || error.message
      );
      throw new Error(error.response?.data?.message || "Erro ao buscar sessão de pagamento");
    }
  }

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
      console.error("Erro ao verificar status do pagamento:", error.response?.data || error.message);
      throw new Error("Erro ao verificar status do pagamento");
    }
  }

  verifyWebhookSignature(signature, payload) {
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("ABACATEPAY_WEBHOOK_SECRET não configurada");
      return process.env.NODE_ENV !== "production";
    }

    if (!signature) return false;

    try {
      const payloadString =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payloadString)
        .digest("hex");

      return signature === expectedSignature;
    } catch (error) {
      console.error("Erro ao verificar assinatura do webhook:", error);
      return false;
    }
  }

  processWebhook(webhookData) {
    console.log('🔵 Processando webhook do AbacatePay:', JSON.stringify(webhookData, null, 2));
    
    const eventType =
      webhookData.event || webhookData.type || webhookData.event_type;
    const paymentData = webhookData.data || webhookData;

    // Extrair metadata (pode estar em diferentes lugares)
    const metadata = paymentData.metadata || 
                     (webhookData.metadata && webhookData.metadata.metadata) || 
                     webhookData.metadata || 
                     {};

    let normalizedStatus = paymentData.status;
    if (normalizedStatus) {
      normalizedStatus = normalizedStatus.toLowerCase();
      
      // Status: PAID, PENDING, CANCELLED, etc.
      if (["paid", "pago", "approved", "aprovado", "completed", "completado"].includes(normalizedStatus)) {
        return {
          eventType: "payment.paid",
          paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
          sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
          status: "Pago",
          amount: paymentData.amount,
          paidAt: paymentData.paid_at || paymentData.paidAt || new Date(),
          metadata: metadata,
          rawData: webhookData,
        };
      } else if (["pending", "pendente", "waiting", "aguardando"].includes(normalizedStatus)) {
        return {
          eventType: "payment.pending",
          paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
          sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
          status: "Aguardando pagamento",
          amount: paymentData.amount,
          paidAt: null,
          metadata: metadata,
          rawData: webhookData,
        };
      } else if (["cancelled", "cancelado", "canceled"].includes(normalizedStatus)) {
        return {
          eventType: "payment.cancelled",
          paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
          sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
          status: "Cancelado",
          amount: paymentData.amount,
          paidAt: null,
          metadata: metadata,
          rawData: webhookData,
        };
      } else if (["failed", "falhou", "rejected", "rejeitado"].includes(normalizedStatus)) {
        return {
          eventType: "payment.failed",
          paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
          sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
          status: "Falha no pagamento",
          amount: paymentData.amount,
          paidAt: null,
          metadata: metadata,
          rawData: webhookData,
        };
      }
    }

    return {
      eventType: eventType || "payment.unknown",
      paymentId: paymentData.payment_id || paymentData.id || paymentData.billing_id,
      sessionId: paymentData.session_id || paymentData.id || paymentData.billing_id,
      status: paymentData.status || "Desconhecido",
      amount: paymentData.amount,
      paidAt: paymentData.paid_at || paymentData.paidAt,
      metadata: metadata,
      rawData: webhookData,
    };
  }
}

export default new AbacatePayClient();
