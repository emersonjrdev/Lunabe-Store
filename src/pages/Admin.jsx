import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    sizes: "",
    colors: "",
    category: "",
    isNew: false,
    originalPrice: "",
    stock: "",
  });
  const [loading, setLoading] = useState(false);

  const adminPassword = "lunabe25";

  const handleLogin = () => {
    if (password === adminPassword) {
      setLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
    } else {
      alert("Senha incorreta!");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "products"));
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      alert("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar se já está logado
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn) {
      setLoggedIn(true);
      fetchProducts();
    }
  }, []);

  useEffect(() => {
    if (loggedIn) fetchProducts();
  }, [loggedIn]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "products"), {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        stock: parseInt(form.stock) || 0,
        sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(",").map((c) => c.trim()).filter(Boolean),
        rating: 5,
        reviews: 0,
        createdAt: new Date(),
      });

      alert("✅ Produto adicionado com sucesso!");
      setForm({
        name: "",
        description: "",
        price: "",
        image: "",
        sizes: "",
        colors: "",
        category: "",
        isNew: false,
        originalPrice: "",
        stock: "",
      });
      fetchProducts();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      alert("❌ Erro ao adicionar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja remover este produto?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        alert("✅ Produto removido com sucesso!");
        fetchProducts();
      } catch (error) {
        console.error("Erro ao remover produto:", error);
        alert("❌ Erro ao remover produto");
      }
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem("adminLoggedIn");
  };

  // Tela de Login
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-10 w-full max-w-md text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-lunabe-pink rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-lock text-white text-xl"></i>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Painel Administrativo
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm md:text-base">
            Digite a senha de administrador para continuar.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de admin"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lunabe-pink mb-6 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-lunabe-pink hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // Painel de Produtos
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-4 md:p-8 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              🛍️ Painel de Produtos Lunabê
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seus produtos e estoque
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Sair
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-10 p-4 md:p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Adicionar Novo Produto
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                name="name"
                placeholder="Nome do produto"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição *
              </label>
              <textarea
                name="description"
                placeholder="Descrição do produto"
                value={form.description}
                onChange={handleChange}
                required
                rows="3"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL da Imagem *
              </label>
              <input
                type="url"
                name="image"
                placeholder="https://exemplo.com/imagem.jpg"
                value={form.image}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tamanhos (separados por vírgula)
              </label>
              <input
                type="text"
                name="sizes"
                placeholder="P, M, G, GG"
                value={form.sizes}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cores (separadas por vírgula)
              </label>
              <input
                type="text"
                name="colors"
                placeholder="Azul, Verde, Rosa"
                value={form.colors}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              >
                <option value="">Selecione uma categoria</option>
                <option value="premium">Premium</option>
                <option value="inverno">Inverno</option>
                <option value="verao">Verão</option>
                <option value="basico">Básico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estoque
              </label>
              <input
                type="number"
                name="stock"
                placeholder="0"
                value={form.stock}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preço Original (para promoção)
              </label>
              <input
                type="number"
                step="0.01"
                name="originalPrice"
                placeholder="0.00"
                value={form.originalPrice}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lunabe-pink"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isNew"
                checked={form.isNew}
                onChange={handleChange}
                className="w-4 h-4 text-lunabe-pink bg-gray-100 border-gray-300 rounded focus:ring-lunabe-pink"
              />
              <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Produto Novo
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lunabe-pink hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Adicionando...
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2"></i>
                Adicionar Produto
              </>
            )}
          </button>
        </form>

        {/* Lista de Produtos */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Produtos Cadastrados ({products.length})
            </h2>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lunabe-pink mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando produtos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-2xl">
              <i className="fas fa-box-open text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum produto cadastrado ainda.</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Adicione seu primeiro produto usando o formulário acima.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-300 text-sm line-clamp-2 mb-2">
                    {product.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-semibold text-lunabe-pink">
                      R$ {product.price?.toFixed(2) || '0.00'}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        R$ {product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.isNew && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Novo</span>
                    )}
                    {product.category && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{product.category}</span>
                    )}
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      Estoque: {product.stock || 0}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-all duration-200 font-semibold"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;