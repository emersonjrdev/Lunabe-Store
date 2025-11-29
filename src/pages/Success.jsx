import React, { useEffect, useState } from "react";
import { API_BASE } from '../api'
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import PaymentService from '../services/paymentService'

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const paymentId = searchParams.get("payment_id");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!sessionId) {
        setError("Sessão de pagamento não encontrada");
        setLoading(false);
        return;
      }

      try {
        // Tentar buscar pelo sessionId primeiro
        let data = null;
        try {
          data = await PaymentService.getOrderBySession(sessionId);
        } catch (err) {
          console.warn('Erro ao buscar por sessionId, tentando buscar pedidos do usuário:', err);
          // Se falhar, tentar buscar todos os pedidos do usuário e encontrar o mais recente
          const user = JSON.parse(localStorage.getItem('lunabe-user') || 'null');
          if (user && user.email) {
            const orders = await PaymentService.getUserOrders(user.email);
            const ordersArray = Array.isArray(orders) ? orders : (orders ? [orders] : []);
            // Encontrar o pedido mais recente
            data = ordersArray.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA;
            })[0];
          }
        }

        if (data) {
          setOrder(data);
          // Limpa o carrinho
          localStorage.removeItem("lunabe-cart");
          window.dispatchEvent(new Event("storage"));

          // Salva a compra (fallback para compatibilidade)
          localStorage.setItem("ultima-compra", JSON.stringify(data));
        } else {
          setError("Pedido não encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar pedido:", error);
        setError("Erro ao processar pedido. Verifique suas compras para mais detalhes.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId, paymentId]);

  // Countdown para redirecionamento
  useEffect(() => {
    if (!loading && order && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      navigate("/minhas-compras");
    }
  }, [loading, order, countdown, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-lunabe-pink mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-lunabe-pink rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Processando pagamento...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde enquanto confirmamos seu pagamento
          </p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Atenção
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/minhas-compras" className="btn-primary">
              Ver Minhas Compras
            </Link>
            <Link to="/" className="btn-secondary">
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl text-center">
        {/* Ícone de sucesso animado */}
        <div className="mb-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <svg
                className="w-12 h-12 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="absolute inset-0 bg-green-200 dark:bg-green-800 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-4">
          Pagamento Confirmado!
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
          Seu pedido foi processado com sucesso
        </p>

        {order && (
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Número do Pedido
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white font-mono">
              #{order._id?.slice(-8).toUpperCase() || 'N/A'}
            </p>
            {order.total && (
              <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                Total: <span className="font-semibold text-lunabe-pink">R$ {order.total.toFixed(2)}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Você receberá um email de confirmação em breve.
          </p>
          {countdown > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/minhas-compras"
            className="btn-primary px-8 py-3 text-lg"
          >
            Ver Minhas Compras
          </Link>
          {order && (
            <Link
              to={`/orders/${order._id}`}
              className="btn-secondary px-8 py-3 text-lg"
            >
              Ver Detalhes do Pedido
            </Link>
          )}
          <Link
            to="/"
            className="px-8 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Success;
