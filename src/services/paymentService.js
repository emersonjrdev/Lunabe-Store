// frontend/src/services/paymentService.js
const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

class PaymentService {
  // Criar pedido e sessão de checkout
  static async createOrder(cart, user, discount = 0, shipping = 0, appliedCoupon = '', totalAmount = 0) {
    try {
      // Converter items do carrinho para o formato do backend
      const items = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize
      }));

      const customer = {
        userId: user.id,
        email: user.email,
        name: user.name
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items,
          customer,
          discount,
          shipping,
          appliedCoupon,
          totalPrice: totalAmount // ✅ aqui vai o valor total calculado
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar pedido');
      }

      return await response.json();
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
