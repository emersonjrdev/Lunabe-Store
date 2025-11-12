import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import MinhasCompras from "./pages/MinhasCompras";
import Success from "./pages/Success";
import ProductDetail from "./pages/ProductDetail";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import Footer from "./components/Footer";
import { useToast } from "./hooks/useToast";

function AppContent() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast, ToastContainer } = useToast();
  const { isDark } = useTheme();

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

  useEffect(() => {
    const savedCart = localStorage.getItem("lunabe-cart");
    const savedUser = localStorage.getItem("lunabe-user");
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem("lunabe-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("lunabe-user", JSON.stringify(user));
  }, [user]);

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
      const productWithOptions = {
        ...product,
        selectedSize: safeSize,
        selectedColor: safeColor,
        uniqueId,
        quantity: 1,
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
    setUser(userData);
    setShowLoginModal(false);
    addToast(`Bem-vindo(a), ${userData.name}!`, "success");
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem("lunabe-user");
    localStorage.removeItem("lunabe-cart");
    addToast("Você saiu da sua conta", "error");
  };

  const getTotalItems = () =>
    cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () =>
    cart.reduce((total, item) => total + item.price * item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center flex flex-col items-center space-y-4">
          <div className="relative">
            <img
              className="w-16 h-16 rounded-xl shadow-lg animate-pulse"
              src="/logo.jpg"
              alt="Lunabê Logo"
            />
            <div className="absolute -inset-2 border-2 border-lunabe-pink border-t-transparent rounded-xl animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white animate-pulse">
            Lunabê
          </h2>
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

            <Route path="/minhas-compras" element={<MinhasCompras />} />
            <Route path="/success" element={<Success />} />

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
