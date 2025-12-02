import axios from 'axios';

/**
 * Cliente para API de Link de Pagamento da Rede
 * Documentação: https://developer.userede.com.br/
 * 
 * IMPORTANTE:
 * - OAuth 2.0 é OBRIGATÓRIO (não há fallback para Basic Auth)
 * - Header Company-number é obrigatório (número da filial, não GUID)
 * - A partir de 05/01/2026, todas as integrações devem usar OAuth 2.0
 */
class RedePaymentLinkClient {
  constructor() {
    // Credenciais OAuth 2.0
    this.clientId = process.env.REDE_PV; // GUID para OAuth
    this.clientSecret = process.env.REDE_TOKEN; // Chave de integração
    this.companyNumber = process.env.REDE_AFFILIATION || process.env.REDE_PV; // Número da filial (obrigatório no header)
    
    // Ambiente (sandbox ou production)
    this.environment = process.env.REDE_ENV || 'sandbox';
    
    // URLs da API Link de Pagamento conforme documentação
    if (this.environment === 'production') {
      this.baseUrl = 'https://payments-api.useredecloud.com.br/payment-link';
      this.oauthUrl = 'https://api.userede.com.br/redelabs/oauth2/token';
    } else {
      // Sandbox
      this.baseUrl = 'https://payments-apisandbox.useredecloud.com.br/payment-link';
      this.oauthUrl = 'https://rl7-sandbox-api.useredecloud.com.br/oauth2/token';
    }
    
    // Cache do access_token OAuth 2.0
    this.accessToken = null;
    this.tokenExpiresAt = null;
    
    console.log('🔵 Cliente Rede Payment Link inicializado');
    console.log('🔵 Ambiente:', this.environment);
    console.log('🔵 Base URL:', this.baseUrl);
    console.log('🔵 OAuth URL:', this.oauthUrl);
    console.log('🔵 Company-number (filial):', this.companyNumber);
  }

  /**
   * Obtém access_token OAuth 2.0
   * OAuth 2.0 é OBRIGATÓRIO para Link de Pagamento
   */
  async getAccessToken() {
    // Verificar se o token ainda é válido (com margem de 5 minutos)
    if (this.accessToken && this.tokenExpiresAt && new Date() < new Date(this.tokenExpiresAt - 5 * 60 * 1000)) {
      console.log('🔵 Usando access_token em cache');
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('REDE_PV (clientId) e REDE_TOKEN (clientSecret) são obrigatórios para OAuth 2.0');
    }

    try {
      console.log('🔵 ========== OBTER ACCESS_TOKEN OAuth 2.0 ==========');
      console.log('🔵 OAuth URL:', this.oauthUrl);
      console.log('🔵 clientId:', this.clientId?.substring(0, 20) + '...');
      console.log('🔵 clientSecret presente:', !!this.clientSecret);

      // Criar credenciais Basic Auth (client_id:client_secret)
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        this.oauthUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
          timeout: 30000,
        }
      );

      if (response.data?.access_token) {
        this.accessToken = response.data.access_token;
        // expires_in está em segundos (padrão: 1440 = 24 minutos)
        const expiresIn = response.data.expires_in || 1440;
        this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
        
        console.log('✅ Access token obtido com sucesso');
        console.log('🔵 Token expira em:', expiresIn, 'segundos');
        console.log('🔵 Token expira em:', this.tokenExpiresAt.toISOString());
        
        return this.accessToken;
      } else {
        throw new Error('access_token não retornado na resposta OAuth');
      }
    } catch (error) {
      console.error('❌ Erro ao obter access_token OAuth 2.0:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Dados:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Erro ao obter access_token OAuth 2.0: ${error.message}`);
    }
  }

  /**
   * Cria um Link de Pagamento
   * @param {Object} params - Parâmetros do link
   * @param {number} params.amount - Valor em centavos
   * @param {string} params.reference - Referência do pedido
   * @param {string} params.description - Descrição do pagamento
   * @param {string} params.customerEmail - Email do cliente
   * @param {string} params.customerName - Nome do cliente (opcional)
   * @param {number} params.expirationDays - Dias até expiração (padrão: 7)
   * @returns {Object} Dados do link de pagamento
   */
  async createPaymentLink({ 
    amount, 
    reference, 
    description, 
    customerEmail,
    customerName = null,
    expirationDays = 7 
  }) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('REDE_PV (clientId) e REDE_TOKEN (clientSecret) são obrigatórios');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    if (!this.companyNumber) {
      throw new Error('REDE_AFFILIATION (número da filial) é obrigatório para Company-number header');
    }

    try {
      console.log('🔵 ========== CRIAR LINK DE PAGAMENTO ==========');
      console.log('🔵 Ambiente:', this.environment);
      console.log('🔵 Valor (centavos):', amount);
      console.log('🔵 Referência:', reference);
      console.log('🔵 Descrição:', description);
      console.log('🔵 Email do cliente:', customerEmail);
      console.log('🔵 Company-number:', this.companyNumber);

      // Obter access_token OAuth 2.0 (obrigatório)
      const accessToken = await this.getAccessToken();

      // Calcular data de expiração
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      // Formato: MM/DD/YYYY
      const expirationDateFormatted = `${String(expirationDate.getMonth() + 1).padStart(2, '0')}/${String(expirationDate.getDate()).padStart(2, '0')}/${expirationDate.getFullYear()}`;

      // Montar payload conforme documentação
      const payload = {
        amount: amount,
        description: description || `Pedido ${reference}`,
        expirationDate: expirationDateFormatted,
        reference: reference,
        customer: {
          email: customerEmail,
        },
      };

      // Adicionar nome do cliente se fornecido
      if (customerName) {
        payload.customer.name = customerName;
      }

      console.log('🔵 Payload:', JSON.stringify(payload, null, 2));

      // Endpoint: POST /payment-link/v1/create
      const endpoint = `${this.baseUrl}/v1/create`;

      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Company-number': this.companyNumber, // OBRIGATÓRIO: número da filial
          },
          timeout: 30000,
        }
      );

      console.log('✅ Link de pagamento criado com sucesso');
      console.log('🔵 Status:', response.status);
      console.log('🔵 Dados:', JSON.stringify(response.data, null, 2));

      // Retornar dados do link
      return {
        paymentLinkId: response.data.paymentLinkId || response.data.id,
        paymentLinkUrl: response.data.paymentLinkUrl || response.data.url,
        reference: response.data.reference || reference,
        amount: response.data.amount || amount,
        expirationDate: response.data.expirationDate || expirationDateFormatted,
        status: response.data.status || 'ACTIVE',
      };
    } catch (error) {
      console.error('❌ Erro ao criar link de pagamento:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Dados:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Erro ao criar link de pagamento: ${error.message}`);
    }
  }

  /**
   * Consulta detalhes de um Link de Pagamento
   * @param {string} paymentLinkId - ID do link de pagamento
   * @returns {Object} Detalhes do link
   */
  async getPaymentLinkDetails(paymentLinkId) {
    if (!paymentLinkId) {
      throw new Error('paymentLinkId é obrigatório');
    }

    try {
      const accessToken = await this.getAccessToken();

      // Endpoint: GET /payment-link/v1/details/{paymentLinkId}
      const endpoint = `${this.baseUrl}/v1/details/${paymentLinkId}`;

      const response = await axios.get(
        endpoint,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Company-number': this.companyNumber,
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao consultar link de pagamento:', error.message);
      throw new Error(`Erro ao consultar link de pagamento: ${error.message}`);
    }
  }

  /**
   * Cancela um Link de Pagamento
   * @param {string} paymentLinkId - ID do link de pagamento
   * @returns {Object} Resultado do cancelamento
   */
  async cancelPaymentLink(paymentLinkId) {
    if (!paymentLinkId) {
      throw new Error('paymentLinkId é obrigatório');
    }

    try {
      const accessToken = await this.getAccessToken();

      // Endpoint: PATCH /payment-link/v1/cancel/{paymentLinkId}
      const endpoint = `${this.baseUrl}/v1/cancel/${paymentLinkId}`;

      const response = await axios.patch(
        endpoint,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Company-number': this.companyNumber,
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao cancelar link de pagamento:', error.message);
      throw new Error(`Erro ao cancelar link de pagamento: ${error.message}`);
    }
  }
}

export default RedePaymentLinkClient;

