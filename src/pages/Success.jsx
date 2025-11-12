import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      console.log("💳 Pagamento confirmado! Session ID:", sessionId);

      // Redireciona automaticamente para Minhas Compras
      const timer = setTimeout(() => {
        navigate("/minhas-compras");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-4">✅ Pagamento confirmado!</h1>
      <p className="text-lg">Aguarde um momento, estamos redirecionando...</p>
    </div>
  );
};

export default Success;
