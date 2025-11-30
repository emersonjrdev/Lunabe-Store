// frontend/src/services/paymentService.js
import { API_BASE } from '../api'
const API_URL = API_BASE || 'http://localhost:4001';

class PaymentService {
  // Criar pedido e sessão de checkout (AbacatePay)
  static async createOrder(cart, user, address = null) {
    try {
      const token = localStorage.getItem('lunabe-token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/orders/create-checkout-session`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id || item._id, // Incluir ID do produto para validação de estoque
            name: item.name || item.title || "Produto sem nome",
            image: item.image || "https://via.placeholder.com/150",
            price: item.price || 0,
            quantity: item.quantity || 1,
          })),
          customerEmail: user.email,
          address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.checkoutUrl) {
        console.error('Resposta do servidor sem checkoutUrl:', data);
        throw new Error("checkoutUrl não retornado pelo servidor");
      }

      return data; // caller should redirect
    } catch (error) {
      console.error("Erro no checkout:", error);
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
}

export default PaymentService;
