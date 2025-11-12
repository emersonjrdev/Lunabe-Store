import React, { useEffect, useState } from "react";

const MinhasCompras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const ultimaCompra = localStorage.getItem("ultima-compra");
      const dadosBase = [
        {
          id: "1",
          data: "2025-10-30",
          total: 189.9,
          status: "Entregue",
          produtos: [
            { nome: "Pijama Feminino Rosa", quantidade: 1, preco: 89.9 },
            { nome: "Pijama Masculino Cinza", quantidade: 1, preco: 100.0 },
          ],
        },
      ];

      if (ultimaCompra) {
        const compra = JSON.parse(ultimaCompra);
        dadosBase.unshift(compra);
      }

      setCompras(dadosBase);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 dark:text-gray-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gray-800 dark:border-gray-200"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-10 text-center">
        Minhas Compras
      </h1>

      {compras.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Você ainda não realizou nenhuma compra.
        </p>
      ) : (
        <div className="grid gap-8">
          {compras.map((compra) => (
            <div
              key={compra.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    Pedido #{compra.id}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Realizado em{" "}
                    {new Date(compra.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    compra.status === "Entregue"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {compra.status}
                </span>
              </div>

              <div className="space-y-4">
                {compra.produtos.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {p.nome}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Quantidade: {p.quantidade}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      R$ {p.preco.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  Total:{" "}
                  <span className="text-gray-900 dark:text-gray-300">
                    R$ {compra.total.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MinhasCompras;
