// frontend/src/services/paymentService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class PaymentService {
  // Criar pedido e sessão de checkout (Stripe)
  static async createOrder(cart, user, totalAmount = 0) {
    try {
      // Converter items do carrinho para o formato do backend
      const items = cart.map(item => ({
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
      }));

      // Requisição ao backend para criar sessão Stripe
      const response = await fetch(`${API_URL}/api/orders/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerEmail: user.email,
        }),
      });

      // Tratamento de erro
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro do servidor:', errorData);
        throw new Error('Erro ao criar sessão de pagamento');
      }

      const data = await response.json();

      // Se tiver URL do checkout, redireciona o usuário
      if (data.url) {
        window.location.href = data.url;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  // Buscar pedido por session ID
  static async getOrderBySession(sessionId) {
    try {
      const response = await fetch(`${API_URL}/api/orders/session/${sessionId}`);
      if (!response.ok) throw new Error('Erro ao buscar pedido');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }
  }

  // Buscar pedidos do usuário
  static async getUserOrders(email) {
    try {
      const response = await fetch(`${API_URL}/api/orders?email=${encodeURIComponent(email)}`);
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
      const response = await fetch(`${API_URL}/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Erro ao buscar pedido');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }
  }
}

export default PaymentService;
