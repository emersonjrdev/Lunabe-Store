// frontend/src/services/paymentService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class PaymentService {
  // Criar pedido e sessão de checkout (Stripe)
  static async createOrder(cart, user) {
  try {
    const response = await fetch(`${API_URL}/api/orders/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(item => ({
          name: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        customerEmail: user.email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar sessão');
    }

    const data = await response.json();

    // 🔥 Redirecionar diretamente para o Stripe
    window.location.href = data.url;
  } catch (error) {
    console.error("Erro no checkout:", error);
    alert("Erro ao processar pagamento. Tente novamente.");
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
