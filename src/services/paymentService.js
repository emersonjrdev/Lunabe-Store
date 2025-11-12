// frontend/src/services/paymentService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class PaymentService {
  // Criar pedido e sessão de checkout (Stripe)
  static async createOrder(cart, user) {
    try {
      const response = await fetch(`${API_URL}/api/orders/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            name: item.name || item.title || "Produto sem nome",
            image: item.image || "https://via.placeholder.com/150",
            price: item.price || 0,
            quantity: item.quantity || 1,
          })),
          customerEmail: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar sessão de pagamento");
      }

      if (!data.checkoutUrl) {
        throw new Error("checkoutUrl não retornado pelo servidor");
      }

      // 🔥 Redireciona pro Stripe
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Erro no checkout:", error);
      alert(error.message || "Erro ao processar o pagamento.");
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
