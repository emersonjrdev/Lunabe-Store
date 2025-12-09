// frontend/src/services/paymentService.js
import { API_BASE } from '../api'
const API_URL = API_BASE || 'http://localhost:4001';

class PaymentService {
  // Criar pedido e sessão de checkout (AbacatePay ou Itaú)
  static async createOrder(cart, user, address = null, cpf = '', deliveryType = 'delivery', shipping = 0, paymentMethod = 'abacatepay', pickupSchedule = '') {
    try {
      console.log('🔵 PaymentService.createOrder chamado');
      console.log('🔵 API_URL:', API_URL);
      
      const token = localStorage.getItem('lunabe-token');
      console.log('🔵 Token presente:', !!token);
      
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const requestBody = {
        items: cart.map(item => ({
          productId: item.id || item._id,
          name: item.name || item.title || "Produto sem nome",
          image: item.image || "https://via.placeholder.com/150",
          price: item.price || 0,
          quantity: item.quantity || 1,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null,
        })),
        customerEmail: user.email,
        address: deliveryType === 'delivery' ? address : null,
        cpf,
        deliveryType,
        shipping,
        paymentMethod,
        pickupSchedule,
      };
      
      console.log('🔵 PaymentService - pickupSchedule no requestBody:', requestBody.pickupSchedule);
      console.log('🔵 PaymentService - deliveryType:', requestBody.deliveryType);

      console.log('🔵 Request body:', requestBody);
      console.log('🔵 Fazendo requisição para:', `${API_URL}/api/orders/create-checkout-session`);

      const response = await fetch(`${API_URL}/api/orders/create-checkout-session`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      console.log('🔵 Response status:', response.status);
      console.log('🔵 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔵 Dados recebidos:', data);

      // Verificar se tem checkoutUrl (para Red-e) ou pixQrCode (para PIX)
      if (!data.checkoutUrl && !data.pixQrCode) {
        console.error('❌ Resposta do servidor sem checkoutUrl ou pixQrCode:', data);
        throw new Error("Dados de pagamento não retornados pelo servidor");
      }

      if (data.checkoutUrl) {
        console.log('✅ checkoutUrl recebido:', data.checkoutUrl);
      } else if (data.pixQrCode) {
        console.log('✅ pixQrCode recebido, tamanho:', data.pixQrCode?.length);
      }
      
      return data; // caller should redirect
    } catch (error) {
      console.error("❌ Erro no PaymentService.createOrder:", error);
      throw error; // Re-throw para o caller tratar
    }
  }

  // Buscar pedido por session ID
  static async getOrderBySession(sessionId) {
    try {
      const token = localStorage.getItem('lunabe-token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await fetch(`${API_URL}/api/orders/session/${sessionId}`, { headers });
      if (!response.ok) throw new Error('Erro ao buscar pedido');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }
  }

  // Confirm payment for an order (used by AbacatePay simulated checkout)
  static async confirmPayment(orderId) {
    try {
      const token = localStorage.getItem('lunabe-token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/api/orders/${orderId}/confirm-payment`, { method: 'POST', headers });
      if (!response.ok) throw new Error('Erro ao confirmar pagamento');
      return await response.json();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  // Buscar pedidos do usuário
  static async getUserOrders(email) {
    try {
      const token = localStorage.getItem('lunabe-token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await fetch(`${API_URL}/api/orders?email=${encodeURIComponent(email)}`, { headers });
      if (!response.ok) throw new Error('Erro ao buscar pedidos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  }

  // Buscar pedido por ID
  static async getOrderById(orderId) {
    try {
      const token = localStorage.getItem('lunabe-token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, { headers });
      if (!response.ok) throw new Error('Erro ao buscar pedido');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }
  }

  // Solicitar devolução de um pedido
  static async requestReturn(orderId, reason) {
    try {
      const token = localStorage.getItem('lunabe-token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const response = await fetch(`${API_URL}/api/orders/${orderId}/request-return`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao solicitar devolução');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao solicitar devolução:', error);
      throw error;
    }
  }
}

export default PaymentService;
