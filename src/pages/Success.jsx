import React, { useEffect, useState } from "react";
import { API_BASE } from '../api'
import { useNavigate, useSearchParams } from "react-router-dom";

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/orders/session/${sessionId}`
        );
        const data = await response.json();

        if (data) {
          // limpa o carrinho
          localStorage.removeItem("lunabe-cart");
          window.dispatchEvent(new Event("storage"));

          // salva a compra
          localStorage.setItem("ultima-compra", JSON.stringify(data));
        }

        setTimeout(() => navigate("/minhas-compras"), 3000);
      } catch (error) {
        console.error("Erro ao buscar pedido:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) fetchOrder();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      {loading ? (
        <h1 className="text-2xl text-gray-700 dark:text-gray-300">
          Processando pagamento...
        </h1>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
            ✅ Pagamento confirmado!
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Você será redirecionado para suas compras.
          </p>
          <button
            onClick={() => navigate("/minhas-compras")}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow"
          >
            Ir agora
          </button>
        </>
      )}
    </div>
  );
};

export default Success;
