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
    // IMPORTANTE: Client ID é o PV (número da filial), NÃO o GUID!
    // Client Secret é a chave de 32 caracteres gerada no portal
    // Conforme suporte da Rede: Client ID = PV (104847581), não GUID
    this.clientId = process.env.REDE_AFFILIATION || process.env.REDE_PV; // Client ID = PV (número da filial)
    this.clientSecret = process.env.REDE_TOKEN; // Client Secret = chave de 32 caracteres
    // company-number: número do PV (numérico, máximo 10 dígitos) - obrigatório no header
    // É o mesmo que clientId (PV)
    this.companyNumber = process.env.REDE_AFFILIATION || process.env.REDE_PV;
    
    // Validar que company-number é numérico e tem no máximo 10 dígitos
    if (this.companyNumber && !/^\d{1,10}$/.test(String(this.companyNumber))) {
      console.warn('⚠️ Company-number deve ser numérico e ter no máximo 10 dígitos');
      console.warn('⚠️ Valor atual:', this.companyNumber);
    }
    
    // Ambiente (sandbox ou production)
    this.environment = process.env.REDE_ENV || 'sandbox';
    
    // URLs da API Link de Pagamento conforme documentação
    // Base URL: apenas o servidor (sem /payment-link)
    if (this.environment === 'production') {
      this.baseUrl = 'https://payments-api.useredecloud.com.br';
      this.oauthUrl = 'https://api.userede.com.br/redelabs/oauth2/token';
    } else {
      // Sandbox conforme documentação: https://payments-apisandbox.useredecloud.com.br
      this.baseUrl = 'https://payments-apisandbox.useredecloud.com.br';
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
      throw new Error('REDE_AFFILIATION (ou REDE_PV) e REDE_TOKEN são obrigatórios para OAuth 2.0. Client ID deve ser o PV (número da filial), não o GUID.');
    }

    try {
      console.log('🔵 ========== OBTER ACCESS_TOKEN OAuth 2.0 ==========');
      console.log('🔵 OAuth URL:', this.oauthUrl);
      console.log('🔵 Ambiente:', this.environment);
      console.log('🔵 clientId (completo):', this.clientId);
      console.log('🔵 clientId (tamanho):', this.clientId?.length);
      console.log('🔵 clientSecret presente:', !!this.clientSecret);
      console.log('🔵 clientSecret (tamanho):', this.clientSecret?.length);
      console.log('🔵 clientSecret (primeiros 10 chars):', this.clientSecret?.substring(0, 10) + '...');

      // Criar credenciais Basic Auth (client_id:client_secret)
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      console.log('🔵 Credentials string (primeiros 30 chars):', credentials.substring(0, 30) + '...');

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
        
        // Se for invalid_client, dar orientações específicas
        if (error.response.status === 401 && error.response.data?.error === 'invalid_client') {
          console.error('❌ ========== ERRO: invalid_client ==========');
          console.error('❌ Isso significa que as credenciais (clientId ou clientSecret) estão incorretas');
          console.error('❌ ou não estão habilitadas para OAuth 2.0 em produção.');
          console.error('❌');
          console.error('❌ Verifique no Render:');
          console.error('❌   1. REDE_PV (clientId) está correto?');
          console.error('❌   2. REDE_TOKEN (clientSecret) está correto?');
          console.error('❌   3. As credenciais são de PRODUÇÃO (não sandbox)?');
          console.error('❌   4. O OAuth 2.0 está habilitado no portal da Rede?');
          console.error('❌');
          console.error('❌ IMPORTANTE: Em produção, OAuth 2.0 é OBRIGATÓRIO');
          console.error('❌ Não há fallback para Basic Auth em produção.');
          console.error('❌ =========================================');
        }
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
      throw new Error('REDE_AFFILIATION (ou REDE_PV) e REDE_TOKEN são obrigatórios. Client ID deve ser o PV (número da filial), não o GUID.');
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
      // Formato: MM/DD/YYYY conforme documentação
      const expirationDateFormatted = `${String(expirationDate.getMonth() + 1).padStart(2, '0')}/${String(expirationDate.getDate()).padStart(2, '0')}/${expirationDate.getFullYear()}`;

      // Converter amount de centavos para decimal (ex: 100 centavos = 1.00)
      const amountDecimal = amount / 100;

      // Limitar description a 50 caracteres (conforme documentação)
      const descriptionLimited = (description || `Pedido ${reference}`).substring(0, 50);

      // Montar payload conforme documentação oficial
      // Campos obrigatórios: amount, expirationDate, description
      // Campos opcionais: installments, createdBy, paymentOptions, comments
      const payload = {
        amount: amountDecimal, // Valor em decimal (ex: 1.00 ao invés de 100 centavos)
        expirationDate: expirationDateFormatted, // Formato: MM/DD/YYYY
        description: descriptionLimited, // Máximo 50 caracteres
      };

      // Adicionar campos opcionais se fornecidos
      if (customerEmail) {
        payload.createdBy = customerEmail; // Email de quem criou o link
      }

      // paymentOptions: array com opções de pagamento (opcional)
      // Por padrão, permitir crédito, débito e PIX
      payload.paymentOptions = ['credit', 'debit', 'pix'];

      // comments: comentários adicionais (opcional)
      if (reference) {
        payload.comments = `Referência: ${reference}`;
      }

      // webhookUrl: URL para receber notificações de pagamento (opcional mas recomendado)
      const baseUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'https://lunabe-store.onrender.com';
      const webhookUrl = `${baseUrl}/api/webhooks/rede-payment-link`;
      payload.webhookUrl = webhookUrl;
      console.log('🔵 Webhook URL:', webhookUrl);

      console.log('🔵 Payload:', JSON.stringify(payload, null, 2));

      // Endpoint: POST /payment-link/v1/create
      const endpoint = `${this.baseUrl}/payment-link/v1/create`;

      // Validar company-number antes de enviar
      const companyNumberStr = String(this.companyNumber);
      if (!/^\d{1,10}$/.test(companyNumberStr)) {
        throw new Error(`Company-number inválido: deve ser numérico e ter no máximo 10 dígitos. Valor atual: ${this.companyNumber}`);
      }

      console.log('🔵 Headers da requisição:');
      console.log('🔵   Authorization: Bearer [token]');
      console.log('🔵   Company-number:', companyNumberStr);
      console.log('🔵   Content-Type: application/json');

      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Company-number': companyNumberStr, // OBRIGATÓRIO: número da filial (numérico, max 10 dígitos)
          },
          timeout: 30000,
        }
      );

      console.log('✅ Link de pagamento criado com sucesso');
      console.log('🔵 Status:', response.status);
      console.log('🔵 Dados:', JSON.stringify(response.data, null, 2));

      // Retornar dados do link conforme documentação
      // Resposta esperada: { message, paymentLinkId, url }
      return {
        paymentLinkId: response.data.paymentLinkId,
        paymentLinkUrl: response.data.url, // URL do link de pagamento
        reference: reference, // Manter referência original
        amount: amountDecimal, // Valor em decimal
        expirationDate: expirationDateFormatted,
        message: response.data.message || 'Inserted Successfully',
      };
    } catch (error) {
      console.error('❌ Erro ao criar link de pagamento:', error.message);
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Dados:', JSON.stringify(error.response.data, null, 2));
        
        // Tratamento específico para erros 401
        if (error.response.status === 401) {
          const errorData = error.response.data;
          if (errorData?.message?.includes('Partner not allowed for this company number')) {
            console.error('❌ ========== ERRO: Partner not allowed ==========');
            console.error('❌ O token OAuth não tem permissão para acessar este company-number');
            console.error('❌ Company-number usado:', this.companyNumber);
            console.error('❌');
            console.error('❌ Verifique:');
            console.error('❌   1. O company-number está correto?');
            console.error('❌   2. O token OAuth foi gerado com credenciais do mesmo PV?');
            console.error('❌   3. O company-number está autorizado no portal da Rede?');
            console.error('❌ =========================================');
          }
        }
        
        // Tratamento específico para erros 422 (validação)
        if (error.response.status === 422) {
          console.error('❌ ========== ERRO: Validação ==========');
          console.error('❌ Erros de validação nos campos:');
          if (Array.isArray(error.response.data)) {
            error.response.data.forEach(err => {
              console.error(`❌   - ${err.FailedField}: ${err.Message}`);
            });
          }
          console.error('❌ =========================================');
        }
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
      const endpoint = `${this.baseUrl}/payment-link/v1/details/${paymentLinkId}`;

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
      const endpoint = `${this.baseUrl}/payment-link/v1/cancel/${paymentLinkId}`;

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

