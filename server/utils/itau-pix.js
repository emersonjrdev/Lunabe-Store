// utils/itau-pix.js
// Integração com API do Itaú para PIX

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cliente para API PIX do Itaú
 */
class ItauPixClient {
  constructor() {
    // Credenciais da API Itaú
    this.clientId = process.env.ITAU_CLIENT_ID;
    this.clientSecret = process.env.ITAU_CLIENT_SECRET;
    this.pixKey = process.env.ITAU_PIX_KEY || '63824145000127'; // CNPJ padrão
    this.environment = process.env.ITAU_ENV || 'sandbox'; // 'sandbox' ou 'production'
    
    // URLs da API Itaú
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.itau.com.br' 
      : 'https://api.itau.com.br/sandbox';
    
    this.tokenUrl = `${this.baseUrl}/oauth/v2/token`;
    this.pixUrl = `${this.baseUrl}/pix/v2/cob`;
    
    // Cache de token (expira em 30 minutos)
    this.tokenCache = {
      token: null,
      expiresAt: null,
    };
  }

  /**
   * Obtém token de autenticação OAuth2
   */
  async getAccessToken() {
    // Verificar se o token ainda é válido
    if (this.tokenCache.token && this.tokenCache.expiresAt > Date.now()) {
      console.log('🔵 Usando token em cache');
      return this.tokenCache.token;
    }

    if (!this.clientId || !this.clientSecret) {
      console.error('❌ Credenciais não configuradas:');
      console.error('   - ITAU_CLIENT_ID:', this.clientId ? '✅' : '❌');
      console.error('   - ITAU_CLIENT_SECRET:', this.clientSecret ? '✅' : '❌');
      throw new Error('ITAU_CLIENT_ID e ITAU_CLIENT_SECRET são obrigatórios');
    }

    try {
      console.log('🔵 Obtendo token de autenticação Itaú...');
      console.log('🔵 URL do token:', this.tokenUrl);
      console.log('🔵 Ambiente:', this.environment);
      console.log('🔵 Client ID (primeiros 10 chars):', this.clientId.substring(0, 10) + '...');
      
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      // Escopos necessários para PIX: cob.write (criar cobrança) e opcionalmente cob.read (consultar)
      const scopes = 'cob.write cob.read';
      
      const response = await axios.post(
        this.tokenUrl,
        `grant_type=client_credentials&scope=${encodeURIComponent(scopes)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      console.log('🔵 Resposta da API (status):', response.status);
      console.log('🔵 Resposta da API (dados):', response.data ? '✅ Recebida' : '❌ Vazia');

      if (!response.data || !response.data.access_token) {
        console.error('❌ Token não retornado. Resposta completa:', JSON.stringify(response.data, null, 2));
        throw new Error('Token não retornado pela API Itaú');
      }

      const token = response.data.access_token;
      const expiresIn = (response.data.expires_in || 1800) * 1000; // Converter para ms
      
      // Cachear token
      this.tokenCache.token = token;
      this.tokenCache.expiresAt = Date.now() + expiresIn - 60000; // Expirar 1 min antes

      console.log('✅ Token obtido com sucesso (expira em', expiresIn / 1000, 'segundos)');
      return token;
    } catch (error) {
      console.error('❌ Erro ao obter token Itaú:');
      console.error('   - Status:', error.response?.status);
      console.error('   - Status Text:', error.response?.statusText);
      console.error('   - Dados:', JSON.stringify(error.response?.data, null, 2));
      console.error('   - Mensagem:', error.message);
      
      const errorMsg = error.response?.data?.error_description 
        || error.response?.data?.error 
        || error.message;
      
      throw new Error(`Erro ao autenticar na API Itaú: ${errorMsg}`);
    }
  }

  /**
   * Cria uma cobrança PIX imediata
   * @param {Object} params - Parâmetros da cobrança
   * @param {number} params.valor - Valor em centavos
   * @param {string} params.descricao - Descrição do pagamento
   * @param {string} params.txId - ID único da transação (opcional)
   * @param {number} params.expiracao - Tempo de expiração em segundos (padrão: 3600 = 1 hora)
   * @returns {Object} Dados da cobrança PIX incluindo QR Code
   */
  async createPixCharge({ valor, descricao, txId = null, expiracao = 3600 }) {
    try {
      const token = await this.getAccessToken();
      
      // Gerar txId único se não fornecido
      const transactionId = txId || `LUN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      // Limitar descrição a 140 caracteres (limite do PIX)
      const pixDescription = (descricao || 'Pagamento Lunabê').substring(0, 140);
      
      // Formatar valor: a API do Itaú espera string com 2 casas decimais
      // Exemplo: "123.45" (não "123,45" e não número)
      const valorFormatado = (valor / 100).toFixed(2);
      
      const payload = {
        calendario: {
          expiracao: expiracao, // Tempo em segundos (3600 = 1 hora)
        },
        valor: {
          original: valorFormatado, // String: "123.45"
        },
        chave: this.pixKey, // Chave PIX cadastrada no Itaú
        solicitacaoPagador: pixDescription, // Descrição para o pagador (máx 140 chars)
        // Campo 'devedor' é opcional e pode causar problemas se CPF inválido
      };

      console.log('🔵 Criando cobrança PIX no Itaú...');
      console.log('🔵 URL:', `${this.pixUrl}/${transactionId}`);
      console.log('🔵 Payload:', JSON.stringify(payload, null, 2));
      console.log('🔵 TxId:', transactionId);

      const response = await axios.put(
        `${this.pixUrl}/${transactionId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('🔵 Resposta da API (status):', response.status);
      console.log('🔵 Resposta da API (dados):', response.data ? '✅ Recebida' : '❌ Vazia');
      
      if (response.data) {
        console.log('🔵 Campos na resposta:', Object.keys(response.data));
      }

      // A API do Itaú pode retornar o QR Code diretamente ou via location
      // Verificar se temos pixCopiaECola ou se precisamos consultar via location
      let qrCode = response.data.pixCopiaECola;
      let locationId = response.data.location?.id || response.data.location;
      
      // Se não tiver QR Code direto, mas tiver location, consultar
      if (!qrCode && locationId) {
        console.log('🔵 QR Code não veio direto. Consultando via location...');
        try {
          const locationResponse = await axios.get(
            `${this.baseUrl}/pix/v2/loc/${locationId}/qrcode`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          
          if (locationResponse.data && locationResponse.data.qrcode) {
            qrCode = locationResponse.data.qrcode;
            console.log('✅ QR Code obtido via location');
          }
        } catch (locationError) {
          console.warn('⚠️ Erro ao consultar location:', locationError.message);
        }
      }
      
      if (!qrCode) {
        console.error('❌ QR Code não encontrado na resposta. Resposta completa:', JSON.stringify(response.data, null, 2));
        throw new Error('QR Code PIX não retornado pela API Itaú');
      }

      console.log('✅ Cobrança PIX criada com sucesso');
      console.log('🔵 QR Code gerado:', qrCode.substring(0, 50) + '...');

      return {
        txId: transactionId,
        qrCode: qrCode,
        qrCodeBase64: response.data.imagemQrcode || null,
        location: locationId || null,
        valor: valor / 100,
        descricao: pixDescription,
        chave: this.pixKey,
        expiracao: expiracao,
        status: response.data.status || 'ATIVA',
      };
    } catch (error) {
      console.error('❌ Erro ao criar cobrança PIX:', error.response?.data || error.message);
      console.error('❌ Status HTTP:', error.response?.status);
      console.error('❌ Headers da resposta:', error.response?.headers);
      
      // Se for erro de autenticação, limpar cache de token
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.tokenCache.token = null;
        this.tokenCache.expiresAt = null;
        console.error('❌ Token invalidado. Limpando cache.');
      }
      
      // Mensagem de erro mais detalhada
      let errorMessage = 'Erro ao criar cobrança PIX';
      if (error.response?.data) {
        const apiError = error.response.data;
        if (apiError.mensagem) {
          errorMessage = apiError.mensagem;
        } else if (apiError.detail) {
          errorMessage = apiError.detail;
        } else if (apiError.error_description) {
          errorMessage = apiError.error_description;
        } else if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else {
          errorMessage = JSON.stringify(apiError);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Consulta uma cobrança PIX pelo txId
   */
  async getPixCharge(txId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.pixUrl}/${txId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao consultar cobrança PIX:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar cobrança PIX: ${error.response?.data?.mensagem || error.message}`);
    }
  }
}

// Instância singleton
const itauPixClient = new ItauPixClient();

/**
 * Função auxiliar para gerar PIX para um pedido
 */
export async function generatePixForOrder(order, totalInCents) {
  try {
    const pixData = await itauPixClient.createPixCharge({
      valor: totalInCents,
      descricao: `Pedido ${order._id.toString().slice(-8)} - Lunabê`,
      txId: `LUN${order._id.toString()}`,
      expiracao: 3600, // 1 hora
    });

    return {
      qrCode: pixData.qrCode,
      qrCodeBase64: pixData.qrCodeBase64,
      chave: pixData.chave,
      valor: pixData.valor,
      descricao: pixData.descricao,
      txId: pixData.txId,
      location: pixData.location,
      expiracao: pixData.expiracao,
    };
  } catch (error) {
    console.error('❌ Erro ao gerar PIX para pedido:', error);
    throw error;
  }
}

export default itauPixClient;


