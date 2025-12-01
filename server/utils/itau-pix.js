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
      throw new Error('ITAU_CLIENT_ID e ITAU_CLIENT_SECRET são obrigatórios');
    }

    try {
      console.log('🔵 Obtendo token de autenticação Itaú...');
      
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        this.tokenUrl,
        'grant_type=client_credentials&scope=cob.write',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      if (!response.data || !response.data.access_token) {
        throw new Error('Token não retornado pela API Itaú');
      }

      const token = response.data.access_token;
      const expiresIn = (response.data.expires_in || 1800) * 1000; // Converter para ms
      
      // Cachear token
      this.tokenCache.token = token;
      this.tokenCache.expiresAt = Date.now() + expiresIn - 60000; // Expirar 1 min antes

      console.log('✅ Token obtido com sucesso');
      return token;
    } catch (error) {
      console.error('❌ Erro ao obter token Itaú:', error.response?.data || error.message);
      throw new Error(`Erro ao autenticar na API Itaú: ${error.response?.data?.error_description || error.message}`);
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
      
      const payload = {
        calendario: {
          expiracao: expiracao, // 1 hora por padrão
        },
        devedor: {
          cpf: '00000000000', // Opcional, pode ser removido se não necessário
        },
        valor: {
          original: (valor / 100).toFixed(2), // Converter centavos para reais
        },
        chave: this.pixKey,
        solicitacaoPagador: pixDescription,
      };

      console.log('🔵 Criando cobrança PIX no Itaú...');
      console.log('🔵 Payload:', JSON.stringify(payload, null, 2));

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

      if (!response.data || !response.data.pixCopiaECola) {
        throw new Error('QR Code PIX não retornado pela API Itaú');
      }

      console.log('✅ Cobrança PIX criada com sucesso');
      console.log('🔵 QR Code gerado:', response.data.pixCopiaECola.substring(0, 50) + '...');

      return {
        txId: transactionId,
        qrCode: response.data.pixCopiaECola,
        qrCodeBase64: response.data.imagemQrcode || null,
        location: response.data.location || null,
        valor: valor / 100,
        descricao: pixDescription,
        chave: this.pixKey,
        expiracao: expiracao,
        status: response.data.status || 'ATIVA',
      };
    } catch (error) {
      console.error('❌ Erro ao criar cobrança PIX:', error.response?.data || error.message);
      
      // Se for erro de autenticação, limpar cache de token
      if (error.response?.status === 401) {
        this.tokenCache.token = null;
        this.tokenCache.expiresAt = null;
      }
      
      throw new Error(
        `Erro ao criar cobrança PIX: ${error.response?.data?.mensagem || error.response?.data?.detail || error.message}`
      );
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


