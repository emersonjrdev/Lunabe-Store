import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../api';
import { useToast } from '../hooks/useToast';
// Usar uma biblioteca alternativa ou gerar QR Code via API
// Por enquanto, vamos usar uma solução simples sem dependência externa

export default function PixPayment() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [order, setOrder] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, paid, failed

  useEffect(() => {
    // Limpar carrinho ao entrar na página de pagamento PIX
    try {
      localStorage.removeItem("lunabe-cart");
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.warn('Erro ao limpar carrinho (não crítico):', error);
    }

    // Obter dados do PIX do state ou buscar do servidor
    if (location.state?.pixQrCode) {
      setPixData({
        qrCode: location.state.pixQrCode,
        chave: location.state.pixChave,
        valor: location.state.pixValor,
        descricao: location.state.pixDescricao,
      });
      setIsLoading(false);
      
      // Buscar dados do pedido para verificar status
      if (orderId) {
        fetchOrderData();
      }
    } else if (orderId) {
      // Buscar dados do pedido do servidor
      fetchOrderData();
    } else {
      addToast('Pedido não encontrado', 'error');
      navigate('/carrinho');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Verificar status do pedido periodicamente (a cada 5 segundos)
  useEffect(() => {
    if (!orderId || paymentStatus === 'paid') return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
        if (!response.ok) return;
        
        const orderData = await response.json();
        setOrder(orderData);
        
        // Se o pedido foi pago, atualizar status e redirecionar
        if (orderData.status === 'Pago' || orderData.status === 'pago') {
          setPaymentStatus('paid');
          addToast('Pagamento confirmado! Redirecionando...', 'success');
          setTimeout(() => {
            navigate('/minhas-compras');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      }
    };

    // Verificar imediatamente e depois a cada 5 segundos
    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paymentStatus]);

  const fetchOrderData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Erro ao buscar pedido');
      
      const orderData = await response.json();
      setOrder(orderData);
      
      if (orderData.pixQrCode) {
        setPixData({
          qrCode: orderData.pixQrCode,
          chave: orderData.pixChave,
          valor: orderData.pixValor,
          descricao: `Pedido ${orderId.slice(-8)} - Lunabê`,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      addToast('Erro ao carregar dados do pagamento', 'error');
      navigate('/carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      addToast('Código PIX copiado!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lunabe-pink mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (!pixData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Dados do pagamento não encontrados</p>
          <Link to="/carrinho" className="btn-primary">
            Voltar ao Carrinho
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <i className="fas fa-qrcode text-green-600 dark:text-green-400 text-2xl"></i>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Pagamento via PIX
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Escaneie o QR Code ou copie o código para pagar
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 mb-6 flex justify-center">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(pixData.qrCode)}`}
              alt="QR Code PIX"
              className="w-64 h-64"
            />
          </div>

          {/* Informações do pagamento */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                <span className="text-xl font-bold text-gray-800 dark:text-white">
                  R$ {pixData.valor.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Chave PIX:</span>
                <span className="text-sm font-mono text-gray-800 dark:text-white">
                  {pixData.chave}
                </span>
              </div>
              {pixData.descricao && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Descrição:</span>
                  <span className="text-sm text-gray-800 dark:text-white">
                    {pixData.descricao}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Código PIX copia-e-cola */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Código PIX (copia-e-cola):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={pixData.qrCode}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-xs font-mono text-gray-800 dark:text-white"
              />
              <button
                onClick={copyPixCode}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-lunabe-pink text-white hover:bg-pink-600'
                }`}
              >
                {copied ? (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Copiado!
                  </>
                ) : (
                  <>
                    <i className="fas fa-copy mr-2"></i>
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
              <i className="fas fa-info-circle mr-2"></i>
              Como pagar:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-400">
              <li>Abra o app do seu banco</li>
              <li>Escaneie o QR Code ou cole o código PIX</li>
              <li>Confirme o pagamento</li>
              <li>Você receberá a confirmação por email</li>
            </ol>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/minhas-compras"
              className="flex-1 text-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              <i className="fas fa-shopping-bag mr-2"></i>
              Ver Meus Pedidos
            </Link>
            <Link
              to="/"
              className="flex-1 text-center px-6 py-3 bg-lunabe-pink text-white rounded-xl font-semibold hover:bg-pink-600 transition-all"
            >
              <i className="fas fa-home mr-2"></i>
              Voltar à Loja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

