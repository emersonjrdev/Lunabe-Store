import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PaymentService from '../services/paymentService'
import { useToast } from '../hooks/useToast'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requestingReturn, setRequestingReturn] = useState(false)
  const { addToast, ToastContainer } = useToast()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await PaymentService.getOrderById(id)
        setOrder(data)
        setError(null)
      } catch (err) {
        console.error('Erro ao buscar pedido:', err)
        setError('Pedido não encontrado ou você não tem permissão para visualizá-lo.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOrder()
    }
  }, [id])

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('pago') || statusLower.includes('paid') || statusLower.includes('aprovado')) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (statusLower.includes('entregue') || statusLower.includes('delivered')) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
    if (statusLower.includes('cancelado') || statusLower.includes('cancelled')) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (statusLower.includes('reembolsado') || statusLower.includes('refunded')) {
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
    }
    if (statusLower.includes('falha') || statusLower.includes('failed')) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-lunabe-pink mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando detalhes do pedido...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Pedido não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'O pedido solicitado não foi encontrado ou você não tem permissão para visualizá-lo.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/minhas-compras" className="btn-primary">
              Minhas Compras
            </Link>
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
  const paidDate = order.paidAt ? new Date(order.paidAt) : null

  // Função para verificar se pedido é elegível para devolução
  const isEligibleForReturn = () => {
    const statusLower = (order.status || '').toLowerCase();
    const isPaid = statusLower.includes('pago') || statusLower.includes('paid') || statusLower.includes('aprovado');
    
    if (!isPaid) return false;
    
    // Verificar se já tem solicitação de devolução
    if (order.returnRequest && order.returnRequest.requestedAt) {
      return false;
    }
    
    // Verificar se está dentro de 30 dias
    const paidDate = order.paidAt || order.createdAt;
    if (!paidDate) return false;
    
    const daysSincePurchase = Math.floor((new Date() - new Date(paidDate)) / (1000 * 60 * 60 * 24));
    return daysSincePurchase <= 30;
  };

  // Função para solicitar devolução
  const handleRequestReturn = async () => {
    const reason = prompt('Por favor, informe o motivo da devolução:');
    if (!reason || reason.trim() === '') {
      addToast('Por favor, informe o motivo da devolução', 'warning');
      return;
    }

    setRequestingReturn(true);
    
    try {
      await PaymentService.requestReturn(id, reason.trim());
      addToast('Solicitação de devolução enviada com sucesso! Entraremos em contato em breve.', 'success');
      
      // Atualizar o pedido
      const updatedOrder = await PaymentService.getOrderById(id);
      setOrder(updatedOrder);
    } catch (error) {
      console.error('Erro ao solicitar devolução:', error);
      addToast(error.message || 'Erro ao solicitar devolução. Tente novamente.', 'error');
    } finally {
      setRequestingReturn(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-6">
        <Link 
          to="/minhas-compras" 
          className="text-lunabe-pink hover:underline inline-flex items-center gap-2 mb-4"
        >
          ← Voltar às minhas compras
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
          Pedido #{order._id?.slice(-8).toUpperCase() || 'N/A'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Realizado em {orderDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Informações principais */}
        <div className="md:col-span-2 space-y-6">
          {/* Status do Pedido */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Status do Pedido</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center space-x-2 ${getStatusColor(order.status)}`}>
                <i className={`fas ${
                  order.status?.toLowerCase().includes('pago') || order.status?.toLowerCase().includes('paid') || order.status?.toLowerCase().includes('aprovado')
                    ? 'fa-check-circle'
                    : order.status?.toLowerCase().includes('entregue') || order.status?.toLowerCase().includes('delivered')
                    ? 'fa-truck'
                    : order.status?.toLowerCase().includes('cancelado') || order.status?.toLowerCase().includes('cancelled')
                    ? 'fa-times-circle'
                    : order.status?.toLowerCase().includes('reembolsado') || order.status?.toLowerCase().includes('refunded')
                    ? 'fa-undo'
                    : 'fa-clock'
                }`}></i>
                <span>{order.status || 'Aguardando pagamento'}</span>
              </span>
            </div>
            
            {paidDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pagamento confirmado em {paidDate.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            )}

            {/* Solicitação de devolução existente */}
            {order.returnRequest && order.returnRequest.requestedAt && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                  <i className="fas fa-undo"></i>
                  Solicitação de Devolução
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">
                  Status: {order.returnRequest.status === 'pending' ? 'Aguardando análise' : 
                           order.returnRequest.status === 'approved' ? 'Aprovada' :
                           order.returnRequest.status === 'rejected' ? 'Rejeitada' : 'Concluída'}
                </p>
                {order.returnRequest.reason && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    Motivo: {order.returnRequest.reason}
                  </p>
                )}
                {order.returnRequest.requestedAt && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    Solicitado em: {new Date(order.returnRequest.requestedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            {/* Botão de solicitar devolução */}
            {isEligibleForReturn() && (
              <div className="mt-4">
                <button
                  onClick={handleRequestReturn}
                  disabled={requestingReturn}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {requestingReturn ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-undo"></i>
                      Solicitar Devolução (até 30 dias)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Timeline do pedido */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${order.status?.toLowerCase().includes('pago') || order.status?.toLowerCase().includes('paid') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div>
                  <p className="font-medium text-sm">Pedido criado</p>
                  <p className="text-xs text-gray-500">{orderDate.toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              {paidDate && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-medium text-sm">Pagamento confirmado</p>
                    <p className="text-xs text-gray-500">{paidDate.toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              )}
              {order.trackingCode && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-sm">Enviado para entrega</p>
                    <p className="text-xs text-gray-500">Código: {order.trackingCode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Itens do Pedido</h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-600"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white mb-1">
                        {item.name || 'Produto sem nome'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Quantidade: {item.quantity || 1}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 dark:text-white">
                        R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        R$ {(item.price || 0).toFixed(2)} cada
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                  Nenhum item encontrado neste pedido
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Informações adicionais */}
        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Resumo</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">R$ {(order.total || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800 dark:text-white">Total</span>
                  <span className="text-lunabe-pink">R$ {(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Endereço de Entrega ou Retirada */}
          {order.deliveryType === 'pickup' ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i className="fas fa-store text-lunabe-pink"></i>
                Retirada na Loja
              </h2>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {order.pickupAddress && (
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white mb-1">Endereço da Loja:</p>
                    <p>{order.pickupAddress}</p>
                  </div>
                )}
                {order.pickupSchedule && (
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white mb-1">Horário Agendado:</p>
                    <p>{new Date(order.pickupSchedule).toLocaleString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                )}
              </div>
            </div>
          ) : order.address && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Endereço de Entrega</h2>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {order.address.name && (
                  <p className="font-semibold text-gray-800 dark:text-white">{order.address.name}</p>
                )}
                {order.address.phone && (
                  <p>{order.address.phone}</p>
                )}
                <p>{order.address.street}</p>
                <p>{order.address.city} — {order.address.state}</p>
                <p>{order.address.zip}</p>
                {order.address.country && (
                  <p>{order.address.country}</p>
                )}
              </div>
            </div>
          )}

          {/* Código de Rastreamento */}
          {order.trackingCode && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-blue-800">
              <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                📦 Código de Rastreamento
              </h2>
              <p className="font-mono text-blue-700 dark:text-blue-400 text-lg mb-2">
                {order.trackingCode}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">
                Use este código para rastrear seu pedido no site dos Correios
              </p>
            </div>
          )}

          {/* Informações de Pagamento */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Informações de Pagamento</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <p className="font-medium text-gray-800 dark:text-white">{order.email}</p>
              </div>
              {order.paymentSessionId && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ID da Sessão:</span>
                  <p className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">
                    {order.paymentSessionId}
                  </p>
                </div>
              )}
              {order.abacatepayPaymentId && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ID do Pagamento:</span>
                  <p className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">
                    {order.abacatepayPaymentId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
