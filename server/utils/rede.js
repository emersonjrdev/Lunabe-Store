// utils/rede.js
// Integração com API da Red-e para pagamentos com cartão (3DS e Data Only)

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cliente para API da Red-e
 */
class RedeClient {
  constructor() {
    // Credenciais da API Red-e
    this.pv = process.env.REDE_PV; // Ponto de Venda
    this.token = process.env.REDE_TOKEN; // Token de autenticação
    
    // Ambiente (sandbox ou production)
    this.environment = process.env.REDE_ENV || 'sandbox';
    
    // URLs da API Red-e
    // A API Red-e usa a mesma URL para sandbox e production
    // A diferença está nas credenciais utilizadas
    // Base URL sem o /erede, será adicionado no endpoint
    if (this.environment === 'production') {
      this.baseUrl = 'https://api.userede.com.br';
    } else {
      // Sandbox usa a mesma URL base
      this.baseUrl = 'https://api.userede.com.br';
    }
    
    // URL base do frontend para callbacks
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    console.log('🔵 Cliente Red-e inicializado');
    console.log('🔵 Ambiente:', this.environment);
    console.log('🔵 Base URL:', this.baseUrl);
    console.log('🔵 PV configurado:', !!this.pv);
    console.log('🔵 Token configurado:', !!this.token);
  }

  /**
   * Cria uma transação com 3DS e Data Only
   * @param {Object} params - Parâmetros da transação
   * @param {number} params.amount - Valor em centavos
   * @param {string} params.reference - Referência do pedido
   * @param {string} params.cardholderName - Nome do portador do cartão
   * @param {string} params.cardNumber - Número do cartão
   * @param {string} params.expirationMonth - Mês de expiração (2 dígitos)
   * @param {string} params.expirationYear - Ano de expiração (4 dígitos)
   * @param {string} params.securityCode - CVV
   * @param {string} params.kind - Tipo: 'credit' ou 'debit'
   * @param {Object} params.customer - Dados do cliente
   * @param {string} params.orderId - ID do pedido
   * @returns {Object} Dados da transação incluindo 3DS
   */
  async createTransaction({
    amount,
    reference,
    cardholderName,
    cardNumber,
    expirationMonth,
    expirationYear,
    securityCode,
    kind = 'credit',
    customer,
    orderId,
  }) {
    if (!this.pv || !this.token) {
      throw new Error('REDE_PV e REDE_TOKEN são obrigatórios. Configure no .env');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    if (!cardNumber || !expirationMonth || !expirationYear || !securityCode) {
      throw new Error('Dados do cartão são obrigatórios');
    }

    try {
      console.log('🔵 ========== CRIAR TRANSAÇÃO RED-E ==========');
      console.log('🔵 Ambiente:', this.environment);
      console.log('🔵 Valor (centavos):', amount);
      console.log('🔵 Referência:', reference);
      console.log('🔵 Tipo:', kind);

      // Preparar dados do dispositivo para 3DS
      const userAgent = customer?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      // URL do backend para callbacks 3DS
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:4001';
      
      // Montar payload da transação com 3DS e Data Only
      const payload = {
        capture: true, // Captura automática
        reference: reference,
        amount: amount,
        cardholderName: cardholderName,
        cardNumber: cardNumber.replace(/\s/g, ''), // Remove espaços
        expirationMonth: expirationMonth.padStart(2, '0'),
        expirationYear: expirationYear.length === 2 ? `20${expirationYear}` : expirationYear,
        securityCode: securityCode,
        kind: kind,
        // Configuração 3DS com Data Only
        threeDSecure: {
          embedded: true, // 3DS embutido
          onFailure: 'continue', // Continuar mesmo se 3DS falhar
          userAgent: userAgent,
          device: {
            colorDepth: 24,
            deviceType3ds: 'BROWSER',
            javaEnabled: false,
            language: 'pt-BR',
            screenHeight: 1080,
            screenWidth: 1920,
            timeZoneOffset: -3, // UTC-3 (Brasil)
          },
          challengePreference: 'DATA_ONLY', // Ativar Data Only
        },
        // URLs de callback para 3DS (backend processa e redireciona)
        urls: [
          {
            kind: 'threeDSecureSuccess',
            url: `${backendUrl}/api/orders/rede/3ds-success?orderId=${orderId}`,
          },
          {
            kind: 'threeDSecureFailure',
            url: `${backendUrl}/api/orders/rede/3ds-failure?orderId=${orderId}`,
          },
        ],
      };

      // Adicionar dados do cliente se disponíveis
      if (customer) {
        payload.customer = {
          name: customer.name || cardholderName,
          email: customer.email,
          phone: customer.phone,
          document: customer.document, // CPF
        };
      }

      console.log('🔵 Payload da transação:', JSON.stringify(payload, null, 2));
      console.log('🔵 Fazendo POST para:', `${this.baseUrl}/erede/transactions`);

      // Autenticação Basic Auth
      const credentials = Buffer.from(`${this.pv}:${this.token}`).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/erede/transactions`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
          timeout: 30000,
        }
      );

      console.log('🔵 Resposta da API (status):', response.status);
      console.log('🔵 Resposta da API (dados):', response.data ? '✅ Recebida' : '❌ Vazia');

      if (response.data) {
        console.log('🔵 Campos na resposta:', Object.keys(response.data));
        console.log('🔵 Status da transação:', response.data.status);
        console.log('🔵 3DS presente:', !!response.data.threeDSecure);
      }

      return {
        tid: response.data.tid, // Transaction ID
        reference: response.data.reference,
        status: response.data.status,
        amount: response.data.amount,
        threeDSecure: response.data.threeDSecure,
        returnCode: response.data.returnCode,
        returnMessage: response.data.returnMessage,
        // Se 3DS for necessário, retornar dados para autenticação
        authenticationUrl: response.data.threeDSecure?.authenticationUrl,
        threeDSecureData: response.data.threeDSecure,
      };
    } catch (error) {
      console.error('❌ ========== ERRO AO CRIAR TRANSAÇÃO ==========');
      console.error('❌ URL tentada:', `${this.baseUrl}/erede/transactions`);
      console.error('❌ Status HTTP:', error.response?.status);
      console.error('❌ Status Text:', error.response?.statusText);
      console.error('❌ Dados da resposta:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Mensagem do erro:', error.message);
      console.error('❌ =========================================');

      const errorMsg = error.response?.data?.returnMessage 
        || error.response?.data?.message 
        || error.message;
      
      throw new Error(`Erro ao criar transação Red-e: ${errorMsg}`);
    }
  }

  /**
   * Consulta uma transação pelo TID
   * @param {string} tid - Transaction ID
   * @returns {Object} Dados da transação
   */
  async getTransaction(tid) {
    if (!this.pv || !this.token) {
      throw new Error('REDE_PV e REDE_TOKEN são obrigatórios');
    }

    try {
      const credentials = Buffer.from(`${this.pv}:${this.token}`).toString('base64');

      const response = await axios.get(
        `${this.baseUrl}/erede/transactions/${tid}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao consultar transação:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar transação Red-e: ${error.response?.data?.returnMessage || error.message}`);
    }
  }

  /**
   * Cancela/estorna uma transação
   * @param {string} tid - Transaction ID
   * @param {number} amount - Valor a estornar (opcional, se não informado estorna o valor total)
   * @returns {Object} Dados do estorno
   */
  async refundTransaction(tid, amount = null) {
    if (!this.pv || !this.token) {
      throw new Error('REDE_PV e REDE_TOKEN são obrigatórios');
    }

    try {
      const credentials = Buffer.from(`${this.pv}:${this.token}`).toString('base64');

      const payload = {};
      if (amount) {
        payload.amount = amount;
      }

      const response = await axios.post(
        `${this.baseUrl}/erede/transactions/${tid}/refunds`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao estornar transação:', error.response?.data || error.message);
      throw new Error(`Erro ao estornar transação Red-e: ${error.response?.data?.returnMessage || error.message}`);
    }
  }

  /**
   * Cria uma cobrança PIX
   * @param {Object} params - Parâmetros da cobrança PIX
   * @param {number} params.amount - Valor em centavos
   * @param {string} params.reference - Referência do pedido
   * @param {string} params.description - Descrição do pagamento
   * @param {number} params.expiration - Tempo de expiração em segundos (padrão: 3600 = 1 hora)
   * @returns {Object} Dados da cobrança PIX incluindo QR Code
   */
  async createPixCharge({ amount, reference, description, expiration = 3600 }) {
    if (!this.pv || !this.token) {
      throw new Error('REDE_PV e REDE_TOKEN são obrigatórios. Configure no .env');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    try {
      console.log('🔵 ========== CRIAR COBRANÇA PIX RED-E ==========');
      console.log('🔵 Ambiente:', this.environment);
      console.log('🔵 Valor (centavos):', amount);
      console.log('🔵 Referência:', reference);
      console.log('🔵 Descrição:', description);

      // A API Red-e usa o endpoint de transações com kind: 'pix'
      // Montar payload da cobrança PIX
      const payload = {
        capture: true,
        amount: amount,
        reference: reference,
        kind: 'pix', // Tipo de pagamento PIX
        description: description || `Pedido ${reference}`,
      };

      console.log('🔵 Payload PIX:', JSON.stringify(payload, null, 2));
      
      // A API Red-e usa o endpoint /erede/transactions
      const endpoint = `${this.baseUrl}/erede/transactions`;
      console.log('🔵 Fazendo POST para:', endpoint);

      // Autenticação Basic Auth
      const credentials = Buffer.from(`${this.pv}:${this.token}`).toString('base64');

      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
          timeout: 30000,
        }
      );

      console.log('🔵 Resposta da API (status):', response.status);
      console.log('🔵 Resposta da API (dados):', response.data ? '✅ Recebida' : '❌ Vazia');

      if (response.data) {
        console.log('🔵 Campos na resposta:', Object.keys(response.data));
        console.log('🔵 Resposta completa:', JSON.stringify(response.data, null, 2));
      }

      // A API Red-e retorna o QR Code em diferentes campos dependendo da estrutura
      // Pode estar em: qrCode, qrcode, qr_code, pix.qrCode, returnCode, etc.
      const qrCode = response.data?.qrCode 
        || response.data?.qrcode 
        || response.data?.qr_code
        || response.data?.pix?.qrCode
        || response.data?.returnCode
        || response.data?.pix?.returnCode;

      if (!qrCode) {
        console.error('❌ QR Code não retornado. Resposta completa:', JSON.stringify(response.data, null, 2));
        throw new Error('QR Code PIX não retornado pela API Red-e');
      }

      console.log('✅ Cobrança PIX criada com sucesso');
      console.log('🔵 QR Code gerado:', qrCode.substring(0, 50) + '...');

      // Extrair o ID da transação
      const transactionId = response.data?.tid 
        || response.data?.id 
        || response.data?.transactionId
        || response.data?.reference;

      return {
        chargeId: transactionId,
        qrCode: qrCode,
        qrCodeBase64: response.data?.qrCodeBase64 || response.data?.pix?.qrCodeBase64 || null,
        amount: response.data?.amount || amount,
        description: response.data?.description || description,
        expiration: response.data?.expiration || expiration,
        status: response.data?.status || response.data?.returnCode ? 'PENDING' : 'PENDING',
        reference: response.data?.reference || reference,
      };
    } catch (error) {
      console.error('❌ ========== ERRO AO CRIAR COBRANÇA PIX ==========');
      console.error('❌ URL tentada:', `${this.baseUrl}/erede/transactions`);
      console.error('❌ Status HTTP:', error.response?.status);
      console.error('❌ Status Text:', error.response?.statusText);
      console.error('❌ Dados da resposta:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Mensagem do erro:', error.message);
      console.error('❌ =========================================');

      const errorMsg = error.response?.data?.message 
        || error.response?.data?.returnMessage 
        || error.message;
      
      throw new Error(`Erro ao criar cobrança PIX Red-e: ${errorMsg}`);
    }
  }

  /**
   * Consulta uma cobrança PIX pelo ID
   * @param {string} chargeId - ID da cobrança
   * @returns {Object} Dados da cobrança PIX
   */
  async getPixCharge(chargeId) {
    if (!this.pv || !this.token) {
      throw new Error('REDE_PV e REDE_TOKEN são obrigatórios');
    }

    try {
      const credentials = Buffer.from(`${this.pv}:${this.token}`).toString('base64');

      const response = await axios.get(
        `${this.baseUrl}/pix/charges/${chargeId}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao consultar cobrança PIX:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar cobrança PIX Red-e: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Instância singleton
const redeClient = new RedeClient();

/**
 * Função auxiliar para criar transação para um pedido
 */
export async function createRedeTransaction(order, totalInCents, cardData, customer) {
  try {
    const transaction = await redeClient.createTransaction({
      amount: totalInCents,
      reference: order._id.toString(),
      cardholderName: cardData.cardholderName,
      cardNumber: cardData.cardNumber,
      expirationMonth: cardData.expirationMonth,
      expirationYear: cardData.expirationYear,
      securityCode: cardData.securityCode,
      kind: cardData.kind || 'credit',
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        document: customer.document, // CPF
        userAgent: customer.userAgent,
      },
      orderId: order._id.toString(),
    });

    return transaction;
  } catch (error) {
    console.error('❌ Erro ao criar transação Red-e para pedido:', error);
    throw error;
  }
}

/**
 * Função auxiliar para criar cobrança PIX para um pedido
 */
export async function createRedePixCharge(order, totalInCents) {
  try {
    const pixData = await redeClient.createPixCharge({
      amount: totalInCents,
      reference: order._id.toString(),
      description: `Pedido ${order._id.toString().slice(-8)} - Lunabê`,
      expiration: 3600, // 1 hora
    });

    return {
      qrCode: pixData.qrCode,
      qrCodeBase64: pixData.qrCodeBase64,
      chargeId: pixData.chargeId,
      valor: pixData.amount / 100,
      descricao: pixData.description,
      expiracao: pixData.expiration,
      status: pixData.status,
    };
  } catch (error) {
    console.error('❌ Erro ao criar cobrança PIX Red-e para pedido:', error);
    throw error;
  }
}

export default redeClient;

