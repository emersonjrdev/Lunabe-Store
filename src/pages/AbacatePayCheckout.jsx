import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import PaymentService from '../services/paymentService'

export default function AbacatePayCheckout() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState(null)
  const [pixQrCode, setPixQrCode] = useState(null)
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState(null)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log('🔵 Buscando pedido com sessionId:', sessionId);
        const data = await PaymentService.getOrderBySession(sessionId)
        console.log('🔵 Dados do pedido recebidos:', {
          orderId: data._id,
          paymentMethod: data.paymentMethod,
          hasAbacatepayQrCode: !!data.abacatepayQrCode,
          hasAbacatepayQrCodeBase64: !!data.abacatepayQrCodeBase64,
          hasCheckoutUrl: !!data.checkoutUrl,
        });
        
        setOrder(data)
        
        // Verificar se é PIX (tem QR Code ou método de pagamento é PIX)
        const isPixPayment = data.paymentMethod === 'abacatepay-pix'
        const hasQrCode = data.abacatepayQrCode || data.abacatepayQrCodeBase64 || 
                         (location.state?.pixQrCode) || (location.state?.pixQrCodeBase64)
        
        console.log('🔵 É pagamento PIX?', isPixPayment);
        console.log('🔵 Tem QR Code?', hasQrCode);
        
        // Se for PIX e tiver QR Code, mostrar na página
        if (isPixPayment && hasQrCode) {
          console.log('🔵 Pagamento PIX detectado com QR Code, mostrando na página')
          // Priorizar dados do state, depois do pedido
          setPixQrCode(location.state?.pixQrCode || data.abacatepayQrCode)
          setPixQrCodeBase64(location.state?.pixQrCodeBase64 || data.abacatepayQrCodeBase64)
          setLoading(false)
          return
        }
        
        // Se for PIX mas não tiver QR Code, redirecionar para a URL do checkout do AbacatePay
        // que mostrará o QR Code
        if (isPixPayment && !hasQrCode && data.checkoutUrl && data.checkoutUrl.startsWith('http')) {
          console.log('🔵 Pagamento PIX sem QR Code, redirecionando para checkout do AbacatePay:', data.checkoutUrl);
          setCheckoutUrl(data.checkoutUrl)
          // Redirecionar para o checkout do AbacatePay que mostrará o QR Code
          window.location.href = data.checkoutUrl
          return
        }
        
        // Se houver checkoutUrl do AbacatePay e NÃO for PIX, redirecionar automaticamente
        // (isso acontece quando a API real está configurada e é pagamento com cartão)
        if (data.checkoutUrl && data.checkoutUrl.startsWith('http')) {
          setCheckoutUrl(data.checkoutUrl)
          // Redirecionar para o checkout do AbacatePay
          window.location.href = data.checkoutUrl
          return
        }
      } catch (err) {
        console.error('❌ Erro ao buscar sessão:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [sessionId, location.state])

  // Verificar se veio do AbacatePay (success callback)
  useEffect(() => {
    const paymentStatus = searchParams.get('status')
    const paymentId = searchParams.get('payment_id')
    
    if (paymentStatus === 'success' && paymentId) {
      // Pagamento aprovado - redirecionar para página de sucesso
      navigate(`/success?session_id=${sessionId}&payment_id=${paymentId}`)
    } else if (paymentStatus === 'cancelled') {
      // Pagamento cancelado - voltar ao carrinho
      navigate('/carrinho')
    }
  }, [searchParams, sessionId, navigate])

  const handlePay = async () => {
    if (!order) return
    setProcessing(true)
    try {
      // Se estiver em modo de desenvolvimento (sem API real), usar confirmação manual
      if (!checkoutUrl) {
        const data = await PaymentService.confirmPayment(order._id)
        navigate(`/success?session_id=${data.sessionId}`)
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setProcessing(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lunabe-pink mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando checkout...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Sessão não encontrada</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">A sessão de pagamento não foi encontrada ou expirou.</p>
          <button 
            onClick={() => navigate('/carrinho')} 
            className="bg-lunabe-pink text-white px-6 py-3 rounded-lg font-semibold"
          >
            Voltar ao Carrinho
          </button>
        </div>
      </div>
    )
  }

  // Se houver QR Code PIX, mostrar opção de pagamento via PIX
  const hasPixPayment = pixQrCode || pixQrCodeBase64 || order?.abacatepayQrCode || order?.abacatepayQrCodeBase64
  
  const copyPixCode = () => {
    const codeToCopy = pixQrCode || order?.abacatepayQrCode
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">AbacatePay — Checkout</h2>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Pedido: <strong>#{order._id.slice(-6).toUpperCase()}</strong>
        </p>

        <div className="space-y-2 mb-4">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between items-center border-b py-2">
              <div className="flex items-center gap-3">
                {it.image && (
                  <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded" />
                )}
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-gray-500">x{it.quantity}</div>
                </div>
              </div>
              <div className="font-semibold">R$ {(it.price * it.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex justify-between items-center text-lg font-bold border-t pt-4">
          <div>Total</div>
          <div>R$ {order.total?.toFixed(2)}</div>
        </div>

        {/* QR Code PIX se disponível */}
        {hasPixPayment && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-4 text-center">Pagamento via PIX</h3>
            
            {/* QR Code Image */}
            {(pixQrCodeBase64 || order?.abacatepayQrCodeBase64) && (
              <div className="mb-4 flex justify-center">
                <img 
                  src={`data:image/png;base64,${pixQrCodeBase64 || order.abacatepayQrCodeBase64}`} 
                  alt="QR Code PIX" 
                  className="w-64 h-64 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white p-2"
                />
              </div>
            )}
            
            {/* QR Code via API se não tiver base64 */}
            {!pixQrCodeBase64 && !order?.abacatepayQrCodeBase64 && (pixQrCode || order?.abacatepayQrCode) && (
              <div className="mb-4 flex justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(pixQrCode || order.abacatepayQrCode)}`}
                  alt="QR Code PIX" 
                  className="w-64 h-64 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white p-2"
                />
              </div>
            )}
            
            {/* Código PIX copia-e-cola */}
            {(pixQrCode || order?.abacatepayQrCode) && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                  Código PIX (copia-e-cola):
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixQrCode || order.abacatepayQrCode}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border rounded text-xs font-mono"
                  />
                  <button
                    onClick={copyPixCode}
                    className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-lunabe-pink text-white hover:bg-pink-600'
                    }`}
                  >
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <i className="fas fa-info-circle mr-1"></i>
                Escaneie o QR Code ou copie o código PIX para pagar. Após o pagamento, você receberá a confirmação automaticamente.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!checkoutUrl && (
            <button 
              onClick={handlePay} 
              disabled={processing} 
              className="flex-1 bg-lunabe-pink text-white py-3 rounded-lg font-semibold hover:bg-pink-600 disabled:opacity-50"
            >
              {processing ? 'Processando...' : hasPixPayment ? 'Confirmar Pagamento' : 'Pagar com AbacatePay'}
            </button>
          )}
          <button 
            onClick={() => navigate('/carrinho')} 
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Voltar
          </button>
        </div>

        {order.status && (
          <p className="text-sm text-center mt-4 text-gray-500 dark:text-gray-400">
            Status: <span className="font-semibold">{order.status}</span>
          </p>
        )}
      </div>
    </div>
  )
}
