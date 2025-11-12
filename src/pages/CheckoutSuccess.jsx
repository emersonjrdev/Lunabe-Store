// frontend/src/pages/CheckoutSuccess.js
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import PaymentService from '../services/paymentService'

const CheckoutSuccess = ({ onClearCart }) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const { addToast } = useToast()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const sessionId = searchParams.get('session_id')
    
    if (sessionId) {
      fetchOrderDetails(sessionId)
      onClearCart() // Limpar carrinho
    } else {
      setLoading(false)
    }
  }, [location, onClearCart])

  const fetchOrderDetails = async (sessionId) => {
    try {
      const orderData = await PaymentService.getOrderBySession(sessionId)
      setOrder(orderData)
      addToast('Pedido confirmado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error)
      addToast('Erro ao carregar detalhes do pedido', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-spinner fa-spin text-4xl text-lunabe-pink mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Processando seu pedido...
          </h2>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Pedido não encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Não foi possível encontrar os detalhes do seu pedido.
          </p>
          <Link to="/orders" className="btn-primary">
            Ver Meus Pedidos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header de Sucesso */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-3xl text-green-600 dark:text-green-400"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Pedido Confirmado!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Obrigado pela sua compra. Seu pedido foi processado com sucesso.
          </p>
        </div>

        {/* Resumo do Pedido */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Resumo do Pedido #{order._id.slice(-8).toUpperCase()}
          </h2>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-semibold ${
                order.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {order.status === 'paid' ? 'Pago' : 'Processando'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Data:</span>
              <span className="text-gray-800 dark:text-white">
                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="text-xl font-bold text-lunabe-pink">
                R$ {(order.total_cents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Itens do Pedido</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-grow">
                    <p className="font-medium text-gray-800 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.quantity}x R$ {(item.price_cents / 100).toFixed(2)}
                      {item.color && ` • ${item.color}`}
                      {item.size && ` • ${item.size}`}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    R$ {((item.price_cents * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/orders" className="btn-primary flex items-center justify-center">
            <i className="fas fa-box mr-2"></i>
            Acompanhar Pedidos
          </Link>
          <Link to="/" className="btn-secondary flex items-center justify-center">
            <i className="fas fa-shopping-bag mr-2"></i>
            Continuar Comprando
          </Link>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 p-4 bg-lunabe-cream dark:bg-gray-700 rounded-xl">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
            Próximos Passos
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Você receberá um email de confirmação em breve</li>
            <li>• Enviamos atualizações por email</li>
            <li>• Previsão de entrega: 2-5 dias úteis</li>
            <li>• Dúvidas? Entre em contato conosco</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSuccess