import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PaymentService from "../services/paymentService";

export default function MinhasCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Lê usuário salvo (mesma chave que você já usa)
  const savedUser = typeof window !== "undefined" ? localStorage.getItem("lunabe-user") : null;
  const user = savedUser ? JSON.parse(savedUser) : null;

  // Função para carregar pedidos do backend
  const loadOrders = async () => {
    if (!user || !user.email) {
      setCompras([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const orders = await PaymentService.getUserOrders(user.email);
      // Se o backend retornar um objeto { orders: [...] } adapta:
      const list = Array.isArray(orders) ? orders : orders?.orders || [];
      setCompras(list);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setError("Não foi possível carregar suas compras. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Se veio do Stripe com session_id, buscar o pedido correspondente e depois recarregar lista
  const handleSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      // Busca pedido por session (rota backend: GET /api/orders/session/:sessionId)
      const order = await PaymentService.getOrderBySession(sessionId);
      // Opcional: você pode mostrar uma confirmação, atualizar o estado ou simplesmente recarregar a lista
      // Recarrega lista de pedidos após salvar/confirmar
      await loadOrders();
      // redireciona (remove querystring) para /minhas-compras
      navigate("/minhas-compras", { replace: true });
    } catch (err) {
      console.error("Erro ao processar session:", err);
      // Ainda assim recarrega a lista normal
      await loadOrders();
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      // se veio do Stripe, processa antes de carregar a lista
      handleSession(sessionId);
    } else {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-semibold mb-4">Você precisa estar logado</h2>
        <p className="text-gray-600">Faça login para ver suas compras.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gray-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadOrders} className="btn-primary">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-10 text-center">
        Minhas Compras
      </h1>

      {compras.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Você ainda não realizou nenhuma compra.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {compras.map((compra) => {
            // padroniza campos comuns do pedido (ajuste conforme o seu backend)
            const id = compra._id || compra.id || compra.orderId;
            const date = compra.createdAt || compra.date || compra.createdAtISO || compra.created_at;
            const produtos = compra.items || compra.produtos || compra.products || [];
            const total = compra.totalAmount || compra.total || compra.amount || 0;
            const status = compra.status || compra.state || "Pendente";

            return (
              <div
                key={id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-semibold">Pedido #{id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {date ? new Date(date).toLocaleString("pt-BR") : ""}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      status.toLowerCase().includes("entreg") || status.toLowerCase() === "paid"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="space-y-4">
                  {produtos.map((p, i) => {
                    const nome = p.name || p.nome || p.title || p.productName || "Produto";
                    const quantidade = p.quantity || p.quantidade || 1;
                    const preco = p.price || p.preco || p.unitPrice || 0;
                    const imagem = p.image || p.imagem || p.images?.[0] || null;

                    return (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-600"
                      >
                        <div className="flex items-center space-x-4">
                          {imagem ? (
                            <img src={imagem} alt={nome} className="w-14 h-14 object-cover rounded" />
                          ) : (
                            <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-500">
                              IMG
                            </div>
                          )}
                          <div>
                            <p className="text-gray-800 dark:text-gray-200 font-medium">{nome}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Quantidade: {quantidade}</p>
                          </div>
                        </div>

                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          R$ {(preco * quantidade).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    Total: <span className="text-gray-900 dark:text-gray-300">R$ {Number(total).toFixed(2)}</span>
                  </p>
                  <button
                    onClick={() => {
                      // opcional: abrir detalhes do pedido em outra rota
                      navigate(`/minhas-compras/${id}`);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    Ver detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
