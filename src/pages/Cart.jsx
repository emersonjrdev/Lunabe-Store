// frontend/src/components/Cart.js
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import PaymentService from '../services/paymentService'

const Cart = ({ cart, onUpdateQuantity, onRemoveFromCart, totalPrice, user, onClearCart }) => {
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Verificar se usuário está logado
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-shopping-cart text-6xl text-gray-300 dark:text-gray-600 mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Carrinho Vazio</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Faça login para ver seu carrinho de compras</p>
          <Link to="/" className="btn-primary">
            <i className="fas fa-home mr-2"></i>
            Voltar às Compras
          </Link>
        </div>
      </div>
    )
  }

  // Verificar se carrinho está vazio
  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-shopping-cart text-6xl text-gray-300 dark:text-gray-600 mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Seu carrinho está vazio</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Adicione alguns produtos incríveis ao seu carrinho!</p>
          <Link to="/" className="btn-primary">
            <i className="fas fa-shopping-bag mr-2"></i>
            Continuar Comprando
          </Link>
        </div>
      </div>
    )
  }

  // Aplicar cupom
  const applyCoupon = () => {
    const coupons = {
      'LUNABE10': 0.1,
      'LUNABE15': 0.15,
      'LUNABE20': 0.2,
    }

    const couponCode = coupon.toUpperCase().trim()
    
    if (coupons[couponCode] !== undefined) {
      const discountRate = coupons[couponCode]
      const newDiscount = totalPrice * discountRate
      setDiscount(newDiscount)
      setAppliedCoupon(couponCode)
      addToast(`Cupom ${couponCode} aplicado com sucesso!`, 'success')
    } else {
      addToast('Cupom inválido ou expirado', 'error')
    }
  }

  // Remover cupom
  const removeCoupon = () => {
    setDiscount(0)
    setAppliedCoupon('')
    setCoupon('')
    addToast('Cupom removido', 'info')
  }

  // Finalizar compra
  const handleCheckout = async () => {
    if (!user) {
      addToast('Faça login para finalizar a compra', 'error')
      return
    }

    if (cart.length === 0) {
      addToast('Seu carrinho está vazio', 'error')
      return
    }

    setIsProcessing(true)

    try {
      // Criar pedido no backend
      const orderData = await PaymentService.createOrder(
        cart, 
        user, 
        discount, 
        shipping,
        appliedCoupon
      )
      
      // Redirecionar para o checkout do Stripe
      window.location.href = orderData.checkoutUrl
      
    } catch (error) {
      console.error('Erro no checkout:', error)
      addToast(error.message || 'Erro ao processar pedido. Tente novamente.', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Calcular valores
  const finalPrice = totalPrice - discount
  const shipping = finalPrice > 150 ? 0 : 15.90
  const totalAmount = finalPrice + shipping

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Meu Carrinho</h1>
        <span className="text-lg text-gray-600 dark:text-gray-400">
          {cart.reduce((total, item) => total + item.quantity, 0)} itens
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Itens */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.uniqueId || item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center space-x-4 animate-slide-up border border-gray-100 dark:border-gray-700">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-24 h-24 object-cover rounded-xl"
              />
              
              <div className="flex-grow">
                <Link to={`/produto/${item.id}`}>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white hover:text-lunabe-pink dark:hover:text-lunabe-pink transition-colors">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {item.selectedColor && `Cor: ${item.selectedColor}`}
                  {item.selectedSize && ` • Tamanho: ${item.selectedSize}`}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xl font-bold text-lunabe-pink">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                  
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-minus text-sm"></i>
                    </button>
                    
                    <span className="font-semibold text-lg w-8 text-center text-gray-800 dark:text-white">
                      {item.quantity}
                    </span>
                    
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <i className="fas fa-plus text-sm"></i>
                    </button>
                    
                    <button 
                      onClick={() => onRemoveFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors ml-4"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo do Pedido */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-24 border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Resumo do Pedido</h3>
            
            {/* Cupom de Desconto */}
            {!appliedCoupon ? (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Cupom de Desconto
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Digite seu cupom"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink text-gray-700 dark:text-gray-300"
                  />
                  <button 
                    onClick={applyCoupon}
                    className="px-4 py-2 bg-gray-800 dark:bg-gray-300 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-400 transition-colors font-semibold"
                  >
                    Aplicar
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cupons válidos: LUNABE10, LUNABE15, LUNABE20
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-400">
                      Cupom aplicado: {appliedCoupon}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Desconto de R$ {discount.toFixed(2)}
                    </p>
                  </div>
                  <button 
                    onClick={removeCoupon}
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}
            
            {/* Detalhes do Pedido */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Desconto</span>
                  <span>- R$ {discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Frete</span>
                <span className={shipping === 0 ? 'text-green-600 dark:text-green-400' : ''}>
                  {shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2)}`}
                </span>
              </div>
              
              {shipping > 0 && finalPrice < 150 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                  ✨ Adicione R$ {(150 - finalPrice).toFixed(2)} para frete grátis
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-white">
                  <span>Total</span>
                  <span>R$ {totalAmount.toFixed(2)}</span>
                </div>
                {shipping === 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    🎉 Frete grátis aplicado!
                  </p>
                )}
              </div>
            </div>

            {/* Botão de Finalizar Compra */}
            <button 
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 px-6 py-4 rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold text-lg mb-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-lock"></i>
                  <span>Finalizar Compra - R$ {totalAmount.toFixed(2)}</span>
                </>
              )}
            </button>
            
            <Link 
              to="/" 
              className="w-full bg-white dark:bg-gray-800 text-lunabe-pink border border-lunabe-pink px-6 py-3 rounded-xl hover:bg-lunabe-pink hover:text-white transition-all duration-300 font-semibold text-center block"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Continuar Comprando
            </Link>

            {/* Garantias */}
            <div className="mt-6 p-4 bg-lunabe-cream dark:bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                <i className="fas fa-shield-alt text-lunabe-pink"></i>
                <span>Compra 100% segura e protegida</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                <i className="fas fa-truck text-lunabe-pink"></i>
                <span>Entrega em até 2 dias úteis</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <i className="fas fa-undo text-lunabe-pink"></i>
                <span>Troca grátis em 7 dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart