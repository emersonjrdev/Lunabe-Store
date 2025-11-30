import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { getFullImageUrl } from '../utils/image'
import PaymentService from '../services/paymentService'

const Cart = ({ cart, onUpdateQuantity, onRemoveFromCart, totalPrice, user, onClearCart }) => {
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [address, setAddress] = useState({ name: '', street: '', city: '', state: '', zip: '', country: '', phone: '' })
  const [hasPreviousOrders, setHasPreviousOrders] = useState(false)
  const [checkingOrders, setCheckingOrders] = useState(false)

  useEffect(() => {
    // prefills address from user or saved profile
    if (user?.address) {
      setAddress({
        name: user.name || '',
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        zip: user.address.zip || '',
        country: user.address.country || '',
        phone: user.address.phone || ''
      })
    } else {
      const savedUser = localStorage.getItem('lunabe-user')
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser)
          if (u?.address) {
            setAddress({
              name: u.name || '',
              street: u.address.street || '',
              city: u.address.city || '',
              state: u.address.state || '',
              zip: u.address.zip || '',
              country: u.address.country || '',
              phone: u.address.phone || ''
            })
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [user])

  // Verificar se o usuário já tem pedidos anteriores
  useEffect(() => {
    const checkPreviousOrders = async () => {
      if (!user?.email) return;
      
      setCheckingOrders(true);
      try {
        const orders = await PaymentService.getUserOrders(user.email);
        const ordersArray = Array.isArray(orders) ? orders : (orders ? [orders] : []);
        // Verificar se tem pelo menos um pedido com status "Pago" ou "Entregue"
        const hasPaidOrder = ordersArray.some(order => {
          const status = (order.status || '').toLowerCase();
          return status.includes('pago') || status.includes('paid') || 
                 status.includes('entregue') || status.includes('delivered') ||
                 status.includes('aprovado');
        });
        setHasPreviousOrders(hasPaidOrder);
      } catch (err) {
        console.error('Erro ao verificar pedidos anteriores:', err);
        setHasPreviousOrders(false);
      } finally {
        setCheckingOrders(false);
      }
    };

    if (user) {
      checkPreviousOrders();
    }
  }, [user])
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Verificar se usuário está logado
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <i className="fas fa-shopping-cart text-6xl text-gray-300 dark:text-gray-600 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Carrinho Vazio</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Faça login para ver seu carrinho de compras</p>
            <Link to="/login" className="btn-primary inline-block">
              <i className="fas fa-sign-in-alt mr-2"></i>
              Fazer Login
            </Link>
            <Link to="/" className="btn-secondary inline-block mt-4 ml-4">
              <i className="fas fa-home mr-2"></i>
              Voltar às Compras
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Verificar se carrinho está vazio
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <i className="fas fa-shopping-cart text-6xl text-gray-300 dark:text-gray-600 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Seu carrinho está vazio</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Adicione alguns produtos incríveis ao seu carrinho!</p>
            <Link to="/" className="btn-primary">
              <i className="fas fa-shopping-bag mr-2"></i>
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Aplicar cupom
  const applyCoupon = async () => {
    const couponCode = coupon.toUpperCase().trim()
    
    // Apenas o cupom LUNABE20 é válido, e só para quem já comprou
    if (couponCode === 'LUNABE20') {
      if (!user) {
        addToast('Faça login para usar cupons', 'error')
        return
      }

      // Verificar se o usuário já tem pedidos pagos
      if (!hasPreviousOrders) {
        if (checkingOrders) {
          addToast('Verificando elegibilidade...', 'info')
          return
        }
        addToast('Este cupom é válido apenas para clientes que já realizaram uma compra', 'error')
        return
      }

      const discountRate = 0.2 // 20% de desconto
      const newDiscount = totalPrice * discountRate
      setDiscount(newDiscount)
      setAppliedCoupon(couponCode)
      addToast(`Cupom ${couponCode} aplicado com sucesso! 20% de desconto!`, 'success')
    } else {
      addToast('Cupom inválido', 'error')
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
    console.log('🔵 handleCheckout chamado');
    console.log('🔵 user:', user);
    console.log('🔵 cart:', cart);
    console.log('🔵 address:', address);
    
    if (!user) {
      console.log('❌ Usuário não logado');
      addToast('Faça login para finalizar a compra', 'error')
      return
    }

    if (cart.length === 0) {
      console.log('❌ Carrinho vazio');
      addToast('Seu carrinho está vazio', 'error')
      return
    }

    console.log('✅ Iniciando processamento...');
    setIsProcessing(true)

    try {
      // Frete desativado temporariamente para testes
      const shipping = 0
      const totalAmount = finalPrice + shipping

      console.log('🔵 Validando endereço...');
      // Criar pedido no backend (inclui endereço)
      if (!address) {
        console.log('❌ Endereço não fornecido');
        addToast('Por favor, preencha o endereço de entrega', 'error')
        setIsProcessing(false)
        return
      }
      
      if (!address.street || !address.street.trim()) {
        console.log('❌ Rua não preenchida');
        addToast('Por favor, preencha a rua do endereço', 'error')
        setIsProcessing(false)
        return
      }
      
      if (!address.city || !address.city.trim()) {
        console.log('❌ Cidade não preenchida');
        addToast('Por favor, preencha a cidade do endereço', 'error')
        setIsProcessing(false)
        return
      }
      
      if (!address.zip || !address.zip.trim()) {
        console.log('❌ CEP não preenchido');
        addToast('Por favor, preencha o CEP do endereço', 'error')
        setIsProcessing(false)
        return
      }
      
      console.log('✅ Endereço validado:', address);

      console.log('🔵 Chamando PaymentService.createOrder...');
      console.log('🔵 Dados enviados:', { cart, user: { email: user.email }, address });
      
      const orderData = await PaymentService.createOrder(cart, user, address)

      console.log('🔵 Resposta do createOrder:', orderData);

      if (!orderData) {
        console.error('❌ orderData é null ou undefined');
        addToast('Erro ao criar pedido. Tente novamente.', 'error')
        setIsProcessing(false)
        return
      }

      if (!orderData.checkoutUrl) {
        console.error('❌ checkoutUrl não encontrado na resposta:', orderData);
        addToast('Erro: URL de checkout não retornada. Verifique os logs.', 'error')
        console.error('Resposta do servidor:', orderData)
        setIsProcessing(false)
        return
      }

      console.log('✅ Redirecionando para:', orderData.checkoutUrl);
      // Redirecionar para o checkout do provedor (AbacatePay)
      window.location.href = orderData.checkoutUrl
      
    } catch (error) {
      console.error('❌ Erro no checkout:', error);
      console.error('❌ Stack trace:', error.stack);
      addToast(error.message || 'Erro ao processar pedido. Tente novamente.', 'error')
      setIsProcessing(false)
    }
  }

  // Calcular valores
  const finalPrice = totalPrice - discount
  // Frete desativado temporariamente para testes
  const shipping = 0
  const totalAmount = finalPrice + shipping

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Meu Carrinho</h1>
          <div className="flex items-center space-x-4">
            <span className="text-lg text-gray-600 dark:text-gray-400">
              {cart.reduce((total, item) => total + item.quantity, 0)} {cart.reduce((total, item) => total + item.quantity, 0) === 1 ? 'item' : 'itens'}
            </span>
            <button 
              onClick={() => {
                if (window.confirm('Deseja limpar todo o carrinho?')) {
                  onClearCart()
                  addToast('Carrinho limpo', 'info')
                }
              }}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            >
              <i className="fas fa-trash-alt mr-1"></i>
              Limpar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Lista de Itens */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.uniqueId || item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 animate-slide-up border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <img 
                    src={getFullImageUrl(item.image) || '/placeholder.jpg'} 
                    alt={item.name} 
                    className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg mx-auto sm:mx-0"
                  />
                  
                  <div className="flex-grow w-full sm:w-auto space-y-3">
                    <Link 
                      to={`/produto/${item.id || item._id || ''}`} 
                      className="block"
                      onClick={(e) => {
                        if (!item.id && !item._id) {
                          e.preventDefault();
                          addToast('Erro: produto sem ID válido', 'error');
                        }
                      }}
                    >
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white hover:text-lunabe-pink dark:hover:text-lunabe-pink transition-colors text-center sm:text-left">
                        {item.name || 'Produto sem nome'}
                      </h3>
                    </Link>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="text-center sm:text-left">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {item.selectedColor && `Cor: ${item.selectedColor}`}
                          {item.selectedSize && ` • Tamanho: ${item.selectedSize}`}
                        </p>
                        <span className="text-xl font-bold text-lunabe-pink block sm:inline-block mt-1 sm:mt-0">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-center sm:justify-end space-x-3">
                        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="fas fa-minus text-sm"></i>
                          </button>
                          
                          <span className="font-semibold text-lg w-8 text-center text-gray-800 dark:text-white">
                            {item.quantity}
                          </span>
                          
                          <button 
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-gray-300"
                          >
                            <i className="fas fa-plus text-sm"></i>
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => onRemoveFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-2"
                          title="Remover item"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Resumo do Pedido</h3>
              
              {/* Cupom de Desconto */}
              {!appliedCoupon ? (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Cupom de Desconto
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Digite seu cupom"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink text-gray-700 dark:text-gray-300"
                    />
                    <button 
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-gray-800 dark:bg-gray-300 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-400 transition-colors font-semibold"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
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
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Shipping address */}
              <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                <div className="flex items-center mb-4">
                  <i className="fas fa-map-marker-alt text-lunabe-pink mr-2 text-lg"></i>
                  <label className="text-sm font-bold text-gray-800 dark:text-white">Endereço para entrega</label>
                </div>
                <div className="space-y-3">
                  <div>
                    <input 
                      value={address.name} 
                      onChange={e=>setAddress({...address, name:e.target.value})} 
                      placeholder="Nome completo" 
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div>
                    <input 
                      value={address.street} 
                      onChange={e=>setAddress({...address, street:e.target.value})} 
                      placeholder="Rua, número, complemento" 
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      value={address.city} 
                      onChange={e=>setAddress({...address, city:e.target.value})} 
                      placeholder="Cidade" 
                      className="col-span-2 px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400 text-sm"
                    />
                    <input 
                      value={address.state} 
                      onChange={e=>setAddress({...address, state:e.target.value})} 
                      placeholder="UF" 
                      maxLength="2"
                      className="px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400 text-sm uppercase"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      value={address.zip} 
                      onChange={e=>setAddress({...address, zip:e.target.value})} 
                      placeholder="CEP" 
                      className="px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400 text-sm"
                    />
                    <input 
                      value={address.phone} 
                      onChange={e=>setAddress({...address, phone:e.target.value})} 
                      placeholder="Telefone" 
                      className="px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div>
                    <input 
                      value={address.country} 
                      onChange={e=>setAddress({...address, country:e.target.value})} 
                      placeholder="País (padrão: Brasil)" 
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Detalhes do Pedido */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({cart.reduce((total, item) => total + item.quantity, 0)} itens)</span>
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
                  <span className={shipping === 0 ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                    {shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2)}`}
                  </span>
                </div>
                
                {shipping > 0 && finalPrice < 150 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    <i className="fas fa-truck mr-1"></i>
                    Adicione R$ {(150 - finalPrice).toFixed(2)} para frete grátis
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-white">
                    <span>Total</span>
                    <span>R$ {totalAmount.toFixed(2)}</span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      <i className="fas fa-check-circle mr-1"></i>
                      Frete grátis aplicado!
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
                    <span>Finalizar Compra</span>
                    <span className="text-sm opacity-90">R$ {totalAmount.toFixed(2)}</span>
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
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 text-sm">Garantias Lunabê</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <i className="fas fa-shield-alt text-lunabe-pink text-xs"></i>
                    <span>Compra 100% segura</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <i className="fas fa-truck text-lunabe-pink text-xs"></i>
                    <span>Entrega em 2-5 dias</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <i className="fas fa-undo text-lunabe-pink text-xs"></i>
                    <span>Troca em 7 dias</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <i className="fas fa-credit-card text-lunabe-pink text-xs"></i>
                    <span>Parcele em até 12x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart