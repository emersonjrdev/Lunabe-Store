import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { API_BASE } from './api'
// using server-side token auth (Google Identity handled via GSI)
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import MinhasCompras from "./pages/MinhasCompras";
import Success from "./pages/Success";
import OrderDetail from './pages/OrderDetail'
import ProductDetail from "./pages/ProductDetail";
import GoogleRedirect from "./pages/GoogleRedirect";
import PixPayment from "./pages/PixPayment";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosUso from "./pages/TermosUso";
import TrocasDevolucoes from "./pages/TrocasDevolucoes";
import Contato from "./pages/Contato";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import Footer from "./components/Footer";
import { useToast } from "./hooks/useToast";
// removed firebase redirect handling — GSI popup/redirect used instead


function AppContent() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { addToast, ToastContainer } = useToast();
  const { isDark } = useTheme();

  useEffect(() => {
    // Restore user from server-side token (lunabe-token) if present
    let cancelled = false;

    (async () => {
      setIsCheckingAuth(true);
      try {
        const token = localStorage.getItem('lunabe-token');
        if (token) {
          const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const json = await res.json();
            if (!cancelled) {
              setUser(json.user);
              localStorage.setItem('lunabe-user', JSON.stringify(json.user));
            }
          } else {
            // token invalid or expired
            localStorage.removeItem('lunabe-token');
            localStorage.removeItem('lunabe-user');
            localStorage.removeItem('lunabe-cart'); // Limpar carrinho também
            setUser(null);
            setCart([]); // Limpar carrinho do estado
          }
        } else {
          // fallback to any saved client-side user data
          try {
            const savedUser = localStorage.getItem('lunabe-user');
            if (savedUser && !cancelled) setUser(JSON.parse(savedUser));
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.error('Error restoring auth from token:', err);
      } finally {
        if (!cancelled) setIsCheckingAuth(false);
      }
    })();

    return () => { cancelled = true };
  }, []);


  // previously used Firebase redirect & onAuthStateChanged — now handled by server token restore

  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem("lunabe-cart");
      setCart(savedCart ? JSON.parse(savedCart) : []);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Carregar carrinho do localStorage (apenas se usuário estiver logado)
  useEffect(() => {
    // Só carregar carrinho se houver usuário logado
    if (!user) {
      // Limpar carrinho se não houver usuário
      setCart([]);
      localStorage.removeItem("lunabe-cart");
      return;
    }

    const savedCart = localStorage.getItem("lunabe-cart");
    if (savedCart) {
      try {
        const raw = JSON.parse(savedCart);
        // normalize saved items so each has price, price_cents and image
        const normalized = raw.map(item => {
          const price_cents = item.price_cents || (item.price ? Math.round(item.price * 100) : 0);
          const price = price_cents ? price_cents / 100 : (item.price || 0);
          const image = item.image || (item.images && item.images[0]) || null;
          return { ...item, price_cents, price, image };
        });
        setCart(normalized);
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        setCart([]);
      }
    }
  }, [user]);

  // Salvar carrinho no localStorage (apenas se usuário estiver logado)
  useEffect(() => {
    if (!user) {
      // Não salvar carrinho se não houver usuário
      return;
    }
    
    if (cart.length > 0) {
      localStorage.setItem("lunabe-cart", JSON.stringify(cart));
    } else {
      // Limpar localStorage se carrinho estiver vazio
      localStorage.removeItem("lunabe-cart");
    }
  }, [cart, user]);

  const handleAddToCart = (product) => {
    if (!user) {
      setShowLoginModal(true);
      addToast("Faça login para adicionar produtos ao carrinho!", "error");
      return;
    }

    const safeSize = product.selectedSize || "Único";
    const safeColor = product.selectedColor || "Padrão";
    const uniqueId = `${product.id}-${safeSize}-${safeColor}`;
    const existingItem = cart.find((item) => item.uniqueId === uniqueId);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.uniqueId === uniqueId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      addToast(
        `${product.name} adicionado (x${existingItem.quantity + 1})`,
        "success"
      );
    } else {
      // normalize price fields for cart (frontend expects .price and .price_cents)
      const price_cents = product.price_cents || (product.price ? Math.round(product.price * 100) : 0);
      const price = price_cents ? price_cents / 100 : (product.price || 0);

      const productWithOptions = {
        ...product,
        // ensure cart item always has a single `image` property (first image fallback)
        image: product.image || (product.images && product.images[0]) || null,
        selectedSize: safeSize,
        selectedColor: safeColor,
        uniqueId,
        quantity: 1,
        price_cents,
        price,
        // Garantir que tem ID (usar _id se id não existir)
        id: product.id || product._id,
        _id: product._id || product.id,
      };
      setCart([...cart, productWithOptions]);
      addToast(`${product.name} adicionado ao carrinho!`, "success");
    }
  };

  const handleRemoveFromCart = (productId) => {
    const product = cart.find((item) => item.id === productId);
    setCart(cart.filter((item) => item.id !== productId));
    addToast(`${product?.name || "Produto"} removido do carrinho`, "error");
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleLogin = (userData) => {
    // Para login manual (email/senha)
    setUser(userData);
    setShowLoginModal(false);
    addToast(`Bem-vindo(a), ${userData.name}!`, "success");
    if (userData?.token) {
      localStorage.setItem('lunabe-token', userData.token);
      localStorage.setItem('lunabe-user', JSON.stringify(userData));
    }
  };

  const handleLogout = () => {
    // Clear local app auth state (server-side JWT is client-side only)
    setUser(null);
    setCart([]);
    localStorage.removeItem("lunabe-user");
    localStorage.removeItem("lunabe-token");
    localStorage.removeItem("lunabe-cart");
    addToast("Você saiu da sua conta", "info");
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem("lunabe-cart");
  };

  const getTotalItems = () =>
    cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () =>
    cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center flex flex-col items-center space-y-6 max-w-md">
          {/* Logo com animação */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-lunabe-pink/20 to-pink-600/20 rounded-3xl blur-2xl animate-pulse"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border-2 border-gray-100 dark:border-gray-700">
              <img
                className="w-20 h-20 rounded-2xl shadow-lg object-cover"
                src="/logo.jpg"
                alt="Lunabê Logo"
              />
            </div>
            {/* Anel giratório */}
            <div className="absolute -inset-3 border-4 border-lunabe-pink border-t-transparent rounded-3xl animate-spin"></div>
          </div>
          
          {/* Texto */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Lunabê
            </h2>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-lunabe-pink rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-lunabe-pink rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-lunabe-pink rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-4">
              {isCheckingAuth ? "Verificando autenticação..." : "Carregando sua loja..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col transition-colors duration-300">
        <Header
          cartCount={getTotalItems()}
          user={user}
          onLogout={handleLogout}
          onLoginClick={() => setShowLoginModal(true)}
        />

        <main className="flex-grow pt-20">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  onAddToCart={handleAddToCart}
                  user={user}
                  onLoginClick={() => setShowLoginModal(true)}
                />
              }
            />
            <Route
              path="/carrinho"
              element={
                <Cart
                  cart={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  totalPrice={getTotalPrice()}
                  user={user}
                />
              }
            />
            <Route
              path="/produto/:id"
              element={
                <ProductDetail
                  onAddToCart={handleAddToCart}
                  user={user}
                  onLoginClick={() => setShowLoginModal(true)}
                />
              }
            />

            <Route path="/admin" element={<Admin />} />

            <Route path="/minhas-compras" element={<MinhasCompras user={user} />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/success" element={<Success />} />
            <Route path="/pix-payment/:orderId" element={<PixPayment />} />
            <Route path="/google-redirect" element={<GoogleRedirect />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/termos-uso" element={<TermosUso />} />
            <Route path="/trocas-devolucoes" element={<TrocasDevolucoes />} />
            <Route path="/contato" element={<Contato />} />

          </Routes>
        </main>

        <Footer />
        <ToastContainer />

        {showLoginModal && (
          <LoginModal
            onLogin={handleLogin}
            onClose={() => setShowLoginModal(false)}
          />
        )}
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}