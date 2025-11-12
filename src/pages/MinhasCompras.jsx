import React, { useEffect, useState } from "react";

const MinhasCompras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ultimaCompra = localStorage.getItem("ultima-compra");

    if (ultimaCompra) {
      try {
        const compraData = JSON.parse(ultimaCompra);
        // se o backend retorna só uma compra, transformamos em array
        setCompras(Array.isArray(compraData) ? compraData : [compraData]);
      } catch (e) {
        console.error("Erro ao ler compra salva:", e);
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 dark:text-gray-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gray-800 dark:border-gray-200"></div>
      </div>
    );
  }

  if (!compras.length) {
    return (
      <div className="text-center py-20 text-gray-600 dark:text-gray-400">
        <p>Você ainda não realizou nenhuma compra.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-10 text-center">
        Minhas Compras
      </h1>

      <div className="grid gap-8">
        {compras.map((compra) => (
          <div
            key={compra.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <div>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Pedido #{compra.id || "—"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Realizado em{" "}
                  {new Date(compra.data || new Date()).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  compra.status === "Entregue"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {compra.status || "Confirmado"}
              </span>
            </div>

            {/* Produtos */}
            <div className="space-y-4">
              {compra.produtos?.map((produto, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-600"
                >
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      {produto.nome}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Quantidade: {produto.quantidade}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    R$ {produto.preco?.toFixed(2) || "0.00"}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 flex justify-end">
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                Total:{" "}
                <span className="text-gray-900 dark:text-gray-300">
                  R$ {compra.total?.toFixed(2) || "0.00"}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MinhasCompras;
