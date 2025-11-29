import React, { useEffect, useState } from "react";
import PaymentService from '../services/paymentService'
import { Link } from 'react-router-dom'

const MinhasCompras = ({ user }) => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      // try backend orders first
      const savedUser = user || JSON.parse(localStorage.getItem('lunabe-user') || 'null');
      if (!savedUser || !savedUser.email) {
        setLoading(false);
        return;
      }

      try {
        const orders = await PaymentService.getUserOrders(savedUser.email);
        // Garantir que é um array
        const ordersArray = Array.isArray(orders) ? orders : (orders ? [orders] : []);
        setCompras(ordersArray);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar pedidos do usuário:', err);
        setError('Erro ao carregar pedidos. Tente novamente.');

        // fallback — keep reading ultima-compra
        const ultimaCompra = localStorage.getItem("ultima-compra");
        if (ultimaCompra) {
          try {
            const compraData = JSON.parse(ultimaCompra);
            setCompras(Array.isArray(compraData) ? compraData : [compraData]);
          } catch (e) {
            console.error("Erro ao ler compra salva:", e);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-lunabe-pink mx-auto mb-4"></div>
          <p>Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  if (!user && !localStorage.getItem('lunabe-user')) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Acesso Restrito</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você precisa estar logado para ver seus pedidos.
          </p>
          <Link to="/" className="btn-primary inline-block">
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  if (error && !compras.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">Erro</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!compras.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Nenhum pedido encontrado</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você ainda não realizou nenhuma compra. Que tal começar a comprar?
          </p>
          <Link to="/" className="btn-primary inline-block">
            Ver produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-10 text-center">
        Minhas Compras
      </h1>

      <div className="grid gap-6 md:gap-8">
        {compras.map((compra) => {
          const orderId = compra._id || compra.id;
          const orderDate = compra.createdAt ? new Date(compra.createdAt) : new Date();
          const status = compra.status || "Aguardando pagamento";
          
          // Mapear status para cores
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
            return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
          };

          return (
            <div
              key={orderId}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 gap-3">
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
                    Pedido #{orderId?.slice(-8).toUpperCase() || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Realizado em {orderDate.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>

              {/* Endereço */}
              {compra.address && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-semibold mb-1 text-gray-800 dark:text-gray-200">Endereço de entrega</p>
                  {compra.address.name && <p className="font-medium">{compra.address.name}</p>}
                  {compra.address.phone && <p className="text-xs">{compra.address.phone}</p>}
                  <p>{compra.address.street}</p>
                  <p>{compra.address.city} • {compra.address.state} — {compra.address.zip}</p>
                  {compra.address.country && <p className="text-xs">{compra.address.country}</p>}
                </div>
              )}

              {/* Código de Rastreamento */}
              {compra.trackingCode && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                    📦 Código de Rastreamento
                  </p>
                  <p className="text-blue-700 dark:text-blue-400 font-mono text-sm">
                    {compra.trackingCode}
                  </p>
                </div>
              )}

              {/* Produtos */}
              <div className="space-y-3 mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Itens do pedido</h3>
                {compra.items && compra.items.length > 0 ? (
                  compra.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-600"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                          {item.name || "Produto sem nome"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Quantidade: {item.quantity || 1}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : compra.produtos && compra.produtos.length > 0 ? (
                  // Fallback para formato antigo
                  compra.produtos.map((produto, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-600"
                    >
                      <div>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                          {produto.nome || produto.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Quantidade: {produto.quantidade || produto.quantity || 1}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        R$ {(produto.preco || produto.price || 0).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Nenhum item encontrado neste pedido
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Total:{" "}
                  <span className="text-2xl text-lunabe-pink dark:text-pink-400">
                    R$ {(compra.total || 0).toFixed(2)}
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/orders/${orderId}`}
                    className="btn-primary text-sm px-6 py-2"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MinhasCompras;
