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
    // Credenciais OAuth 2.0 da API Red-e
    // PV agora é clientId, Token agora é clientSecret
    this.clientId = process.env.REDE_PV; // clientId (antigo PV) - pode ser GUID ou número
    this.clientSecret = process.env.REDE_TOKEN; // clientSecret (antiga Chave de Integração)
    
    // Número da filial (affiliation) - pode ser diferente do clientId
    // Se não configurado, usa o clientId
    // IMPORTANTE: No portal aparece "Filial 104847581" - esse número deve ser usado aqui
    this.affiliation = process.env.REDE_AFFILIATION || this.clientId;
    
    // Log para debug
    console.log('🔵 Configuração de affiliation:');
    console.log('🔵   REDE_AFFILIATION configurado:', !!process.env.REDE_AFFILIATION);
    console.log('🔵   REDE_AFFILIATION valor:', process.env.REDE_AFFILIATION || 'NÃO CONFIGURADO');
    console.log('🔵   affiliation final (usado no payload):', this.affiliation);
    
    // Ambiente (sandbox ou production)
    this.environment = process.env.REDE_ENV || 'sandbox';
    
    // URLs da API Red-e conforme documentação oficial OAuth 2.0
    if (this.environment === 'production') {
      this.baseUrl = 'https://api.userede.com.br/erede';
      this.oauthUrl = 'https://api.userede.com.br/redelabs/oauth2/token';
    } else {
      // Sandbox conforme documentação
      this.baseUrl = 'https://sandbox-erede.useredecloud.com.br';
      this.oauthUrl = 'https://rl7-sandbox-api.useredecloud.com.br/oauth2/token';
    }
    
    // URL base do frontend para callbacks
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Cache do access_token OAuth 2.0
    this.accessToken = null;
    this.tokenExpiresAt = null;
    
    console.log('🔵 Cliente Red-e inicializado (OAuth 2.0)');
    console.log('🔵 Ambiente:', this.environment);
    console.log('🔵 Base URL:', this.baseUrl);
    console.log('🔵 OAuth URL:', this.oauthUrl);
    console.log('🔵 clientId configurado:', !!this.clientId);
    console.log('🔵 clientSecret configurado:', !!this.clientSecret);
  }

  /**
   * Obtém access_token OAuth 2.0 ou retorna null para usar Basic Auth (fallback)
   * O token tem validade de 24 minutos, renovar entre 15-23 minutos
   * @returns {Promise<string|null>} access_token ou null se usar Basic Auth
   */
  async getAccessToken() {
    // Verificar se temos um token válido (renovar se faltar menos de 5 minutos)
    const now = Date.now();
    if (this.accessToken && this.tokenExpiresAt && now < (this.tokenExpiresAt - 5 * 60 * 1000)) {
      console.log('🔵 Usando access_token em cache');
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('REDE_PV (clientId) e REDE_TOKEN (clientSecret) são obrigatórios. Configure no .env');
    }

    try {
      console.log('🔵 ========== OBTER ACCESS_TOKEN OAuth 2.0 ==========');
      console.log('🔵 OAuth URL:', this.oauthUrl);
      console.log('🔵 clientId (completo):', this.clientId || 'NÃO CONFIGURADO');
      console.log('🔵 clientId (tamanho):', this.clientId ? this.clientId.length : 0);
      console.log('🔵 clientSecret (presente):', this.clientSecret ? '✅ SIM' : '❌ NÃO');
      console.log('🔵 clientSecret (tamanho):', this.clientSecret ? this.clientSecret.length : 0);

      if (!this.clientId || !this.clientSecret) {
        throw new Error('clientId ou clientSecret não configurados');
      }

      // Basic Auth com clientId:clientSecret
      // IMPORTANTE: Não adicionar espaços ou caracteres extras
      const credentialsString = `${this.clientId}:${this.clientSecret}`;
      const credentials = Buffer.from(credentialsString).toString('base64');
      
      console.log('🔵 Credentials string (completo):', credentialsString);
      console.log('🔵 Credentials string (tamanho):', credentialsString.length);
      console.log('🔵 Credentials base64 (primeiros 30 chars):', credentials.substring(0, 30) + '...');
      console.log('🔵 Fazendo POST para:', this.oauthUrl);
      console.log('🔵 Body da requisição:', 'grant_type=client_credentials');

      const response = await axios.post(
        this.oauthUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        }
      );

      if (!response.data?.access_token) {
        throw new Error('access_token não retornado pela API OAuth 2.0');
      }

      // Armazenar token e calcular expiração (24 minutos = 1440 segundos)
      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 1440; // Padrão 24 minutos
      this.tokenExpiresAt = now + (expiresIn * 1000);

      console.log('✅ access_token obtido com sucesso');
      console.log('🔵 Token expira em:', expiresIn, 'segundos');
      console.log('🔵 Token type:', response.data.token_type || 'Bearer');

      return this.accessToken;
    } catch (error) {
      // Em produção, OAuth 2.0 é OBRIGATÓRIO (sem fallback)
      if (this.environment === 'production') {
        console.error('❌ ========== ERRO AO OBTER ACCESS_TOKEN (PRODUÇÃO) ==========');
        console.error('❌ OAuth 2.0 é OBRIGATÓRIO em produção');
        console.error('❌ OAuth URL:', this.oauthUrl);
        console.error('❌ Status HTTP:', error.response?.status);
        console.error('❌ Dados da resposta:', JSON.stringify(error.response?.data, null, 2));
        console.error('❌ Mensagem do erro:', error.message);
        console.error('❌ =========================================');

        const errorMsg = error.response?.data?.error_description 
          || error.response?.data?.error 
          || error.message;
        
        throw new Error(`Erro ao obter access_token OAuth 2.0 (produção): ${errorMsg}`);
      }
      
      // Se for erro 401 (invalid_client) no sandbox, usar Basic Auth como fallback
      if (this.environment === 'sandbox' && error.response?.status === 401) {
        console.warn('⚠️ OAuth 2.0 não disponível no sandbox, usando Basic Auth como fallback');
        console.warn('⚠️ Em produção, OAuth 2.0 é obrigatório');
        return null; // Retorna null para indicar que deve usar Basic Auth
      }

      console.error('❌ ========== ERRO AO OBTER ACCESS_TOKEN ==========');
      console.error('❌ OAuth URL:', this.oauthUrl);
      console.error('❌ Status HTTP:', error.response?.status);
      console.error('❌ Dados da resposta:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Mensagem do erro:', error.message);
      console.error('❌ =========================================');

      const errorMsg = error.response?.data?.error_description 
        || error.response?.data?.error 
        || error.message;
      
      throw new Error(`Erro ao obter access_token OAuth 2.0: ${errorMsg}`);
    }
  }

  /**
   * Obtém header de autorização (OAuth 2.0 ou Basic Auth)
   * @returns {Promise<string>} Header Authorization
   */
  async getAuthorizationHeader() {
    const accessToken = await this.getAccessToken();
    
    if (accessToken) {
      return `Bearer ${accessToken}`;
    } else {
      // Fallback para Basic Auth (apenas sandbox)
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      return `Basic ${credentials}`;
    }
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
    if (!this.clientId || !this.clientSecret) {
      throw new Error('REDE_PV (clientId) e REDE_TOKEN (clientSecret) são obrigatórios. Configure no .env');
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
        affiliation: this.affiliation, // PV (Ponto de Venda) - pode ser número da filial
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
      console.log('🔵 Fazendo POST para:', `${this.baseUrl}/v2/transactions`);

      // Obter header de autorização (OAuth 2.0 ou Basic Auth)
      const authHeader = await this.getAuthorizationHeader();

      const response = await axios.post(
        `${this.baseUrl}/v2/transactions`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
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
      console.error('❌ URL tentada:', `${this.baseUrl}/v2/transactions`);
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
    if (!this.clientId || !this.clientSecret) {
      throw new Error('REDE_PV (clientId) e REDE_TOKEN (clientSecret) são obrigatórios');
    }

    try {
      // Obter header de autorização (OAuth 2.0 ou Basic Auth)
      const authHeader = await this.getAuthorizationHeader();

      const response = await axios.get(
        `${this.baseUrl}/v2/transactions/${tid}`,
        {
          headers: {
            'Authorization': authHeader,
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
    if (!this.clientId || !this.clientSecret) {
      throw new Error('REDE_PV (clientId) e REDE_TOKEN (clientSecret) são obrigatórios');
    }

    try {
      // Obter header de autorização (OAuth 2.0 ou Basic Auth)
      const authHeader = await this.getAuthorizationHeader();

      const payload = {};
      if (amount) {
        payload.amount = amount;
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/transactions/${tid}/refunds`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
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
    if (!this.clientId || !this.clientSecret) {
      throw new Error('REDE_PV (clientId) e REDE_TOKEN (clientSecret) são obrigatórios. Configure no .env');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    // Endpoint único conforme documentação Red-e
    // POST /v2/transactions com kind: "Pix"
    const endpoint = `${this.baseUrl}/v2/transactions`;

    try {
      console.log('🔵 ========== CRIAR COBRANÇA PIX RED-E ==========');
      console.log('🔵 Ambiente:', this.environment);
      console.log('🔵 Valor (centavos):', amount);
      console.log('🔵 Referência:', reference);
      console.log('🔵 Descrição:', description);

      // Calcular data de expiração (máximo 15 dias, padrão: 1 hora se não especificado)
      const expirationSeconds = expiration || 3600; // Padrão: 1 hora
      const maxExpirationSeconds = 15 * 24 * 60 * 60; // 15 dias em segundos
      const finalExpirationSeconds = Math.min(expirationSeconds, maxExpirationSeconds);
      
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + finalExpirationSeconds);
      
      // Formato: YYYY-MM-DDThh:mm:ss
      const dateTimeExpiration = expirationDate.toISOString().slice(0, 19).replace('T', 'T');

      // Montar payload da cobrança PIX conforme documentação Red-e
      // kind deve ser "Pix" (com P maiúsculo)
      // qrCode.dateTimeExpiration é obrigatório
      // affiliation (PV) pode precisar estar no payload OU ser extraído do Basic Auth
      const payload = {
        kind: 'Pix', // Tipo de pagamento PIX (com P maiúsculo conforme documentação)
        reference: reference,
        amount: amount,
        qrCode: {
          dateTimeExpiration: dateTimeExpiration, // Obrigatório: formato YYYY-MM-DDThh:mm:ss
        },
      };
      
      // Adicionar affiliation apenas se não for Basic Auth
      // Com Basic Auth, a API pode extrair do header
      // Tentar com e sem affiliation para ver qual funciona

      // orderId é opcional, mas pode ser útil
      if (reference) {
        payload.orderId = reference;
      }

      console.log('🔵 Payload PIX inicial:', JSON.stringify(payload, null, 2));
      console.log('🔵 Base URL configurada:', this.baseUrl);
      console.log('🔵 Endpoint:', endpoint);
      console.log('🔵 clientId (GUID):', this.clientId || 'NÃO CONFIGURADO');
      console.log('🔵 affiliation (número da filial):', this.affiliation || 'NÃO CONFIGURADO');
      console.log('🔵 Data de expiração:', dateTimeExpiration);
      
      // Obter header de autorização (OAuth 2.0 ou Basic Auth)
      const authHeader = await this.getAuthorizationHeader();
      const isOAuth = authHeader.startsWith('Bearer');
      
      console.log('🔵 Fazendo POST para:', endpoint);
      console.log('🔵 Método de autenticação:', isOAuth ? 'OAuth 2.0' : 'Basic Auth');
      console.log('🔵 Header Authorization (primeiros 30 chars):', authHeader.substring(0, 30) + '...');
      
      // SEMPRE adicionar affiliation no payload - OBRIGATÓRIO
      // A API Red-e/Itaú requer affiliation no payload, mesmo com OAuth 2.0
      // IMPORTANTE: affiliation deve ser o número da filial (ex: 104847581) e não o GUID
      let finalPayload = { ...payload };
      
      // Garantir que affiliation está presente
      if (!this.affiliation) {
        throw new Error('affiliation não configurado. Configure REDE_AFFILIATION ou REDE_PV no .env');
      }
      
      finalPayload.affiliation = this.affiliation; // Usar affiliation configurado (número da filial)
      
      if (isOAuth) {
        console.log('🔵 Usando OAuth 2.0 - affiliation adicionado ao payload');
      } else {
        console.log('🔵 Usando Basic Auth - affiliation OBRIGATÓRIO no payload');
      }
      
      console.log('🔵 ========== PAYLOAD FINAL ==========');
      console.log('🔵 Payload completo:', JSON.stringify(finalPayload, null, 2));
      console.log('🔵 Affiliation no payload:', finalPayload.affiliation);
      console.log('🔵 Tipo do affiliation:', typeof finalPayload.affiliation);
      console.log('🔵 clientId (GUID para OAuth):', this.clientId);
      console.log('🔵 affiliation (número da filial para payload):', this.affiliation);
      console.log('🔵 ====================================');
      
      const response = await axios.post(
        endpoint,
        finalPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          timeout: 30000,
          // Adicionar validação de status para capturar erros 4xx
          validateStatus: (status) => status < 500,
        }
      );
      
      console.log('🔵 Resposta recebida - Status:', response.status);
      
      // Verificar se a resposta é um erro antes de processar
      if (response.status >= 400) {
        console.error('❌ API retornou erro HTTP:', response.status);
        console.error('❌ Dados da resposta:', JSON.stringify(response.data, null, 2));
        
        if (response.data?.returnCode && response.data?.returnMessage) {
          const errorCode = response.data.returnCode;
          const errorMessage = response.data.returnMessage;
          throw new Error(`Erro ${errorCode}: ${errorMessage}`);
        }
      }
      console.log('🔵 Resposta da API (status):', response.status);
      console.log('🔵 Resposta da API (dados):', response.data ? '✅ Recebida' : '❌ Vazia');

      if (response.data) {
        console.log('🔵 Campos na resposta:', Object.keys(response.data));
        console.log('🔵 Resposta completa:', JSON.stringify(response.data, null, 2));
      }

      // Verificar se a resposta é um erro (returnCode presente com returnMessage)
      if (response.data?.returnCode && response.data?.returnMessage) {
        const errorCode = response.data?.returnCode;
        const errorMessage = response.data?.returnMessage;
        console.error('❌ API Red-e retornou erro:', errorCode, errorMessage);
        throw new Error(`Erro ${errorCode}: ${errorMessage}`);
      }

      // Conforme documentação, o QR Code está em qrCodeResponse
      // qrCodeResponse.qrCodeData = QR Code em formato EMV (copia e cola)
      // qrCodeResponse.qrCodeImage = QR Code em base64 (imagem)
      const qrCodeResponse = response.data?.qrCodeResponse;
      
      if (!qrCodeResponse) {
        console.error('❌ qrCodeResponse não retornado. Resposta completa:', JSON.stringify(response.data, null, 2));
        throw new Error('QR Code PIX não retornado pela API Red-e (qrCodeResponse ausente)');
      }

      // Priorizar qrCodeData (formato EMV) para copia e cola
      // Se não tiver, usar qrCodeImage (base64)
      const qrCode = qrCodeResponse?.qrCodeData || qrCodeResponse?.qrCodeImage;

      if (!qrCode) {
        console.error('❌ QR Code não encontrado em qrCodeResponse. Resposta completa:', JSON.stringify(response.data, null, 2));
        throw new Error('QR Code PIX não encontrado na resposta (qrCodeData e qrCodeImage ausentes)');
      }

      console.log('✅ Cobrança PIX criada com sucesso');
      console.log('🔵 QR Code gerado:', qrCode.substring(0, 50) + '...');
      console.log('🔵 TID:', response.data?.tid);
      console.log('🔵 Status:', qrCodeResponse?.status || 'PENDING');

      // Extrair o ID da transação (TID)
      const transactionId = response.data?.tid;

      if (!transactionId) {
        console.warn('⚠️ TID não retornado na resposta');
      }

      return {
        chargeId: transactionId,
        qrCode: qrCode, // Formato EMV (copia e cola) ou base64
        qrCodeBase64: qrCodeResponse?.qrCodeImage || null, // Imagem em base64 se disponível
        amount: response.data?.amount || amount,
        valor: (response.data?.amount || amount) / 100, // Valor em reais para exibição
        description: description || `Pedido ${reference}`,
        expiration: qrCodeResponse?.dateTimeExpiration || dateTimeExpiration,
        status: qrCodeResponse?.status || 'PENDING',
        reference: response.data?.reference || reference,
        tid: transactionId,
      };
    } catch (error) {
      console.error('❌ ========== ERRO AO CRIAR COBRANÇA PIX ==========');
      console.error('❌ Endpoint usado:', endpoint);
      console.error('❌ Status HTTP:', error.response?.status);
      console.error('❌ Status Text:', error.response?.statusText);
      console.error('❌ Dados da resposta:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Mensagem do erro:', error.message);
      console.error('❌ clientId (PV) enviado no payload:', this.clientId ? `${this.clientId.substring(0, 4)}...` : 'NÃO CONFIGURADO');
      console.error('❌ =========================================');

      const errorMsg = error.response?.data?.returnMessage 
        || error.response?.data?.message 
        || error.message;
      
      // Mensagem mais específica para erro 401 com "Affiliation: Required parameter missing"
      if (error.response?.status === 401 && errorMsg?.includes('Affiliation')) {
        throw new Error(`Erro ao criar cobrança PIX Red-e: ${errorMsg}. IMPORTANTE: O PIX da Red-e é disponível apenas para correntistas Itaú. Verifique se: 1) O PV está habilitado para PIX no portal userede.com.br (menu: Para vender > PIX > "quero utilizar o Pix"); 2) As credenciais do sandbox têm permissão para criar transações PIX; 3) A chave PIX Itaú está cadastrada corretamente.`);
      }
      
      throw new Error(`Erro ao criar cobrança PIX Red-e: ${errorMsg}`);
    }
  }

  /**
   * Consulta uma cobrança PIX pelo ID
   * @param {string} chargeId - ID da cobrança
   * @returns {Object} Dados da cobrança PIX
   */
  async getPixCharge(chargeId) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('REDE_PV (clientId) e REDE_TOKEN (clientSecret) são obrigatórios');
    }

    try {
      // Obter header de autorização (OAuth 2.0 ou Basic Auth)
      const authHeader = await this.getAuthorizationHeader();

      const response = await axios.get(
        `${this.baseUrl}/v2/transactions/${chargeId}`,
        {
          headers: {
            'Authorization': authHeader,
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

