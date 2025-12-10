import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from '../api'
import { getFullImageUrl } from '../utils/image'

const API_URL = `${API_BASE}/api/products`;

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [editingId, setEditingId] = useState(null); // ID do produto sendo editado
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    images: [],
    sizes: "",
    colors: "",
    category: "feminino", // Categoria padrão
    stockByVariant: {}, // { "P-Rosa": 10, "M-Azul": 5, ... }
  });

  const adminPassword = "lunabe25";

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (password === adminPassword) {
      setLoggedIn(true);
      setPassword(""); // Limpar senha após login
    } else {
      alert("Senha incorreta!");
      setPassword(""); // Limpar campo
    }
  };

  const fetchProducts = async () => {
    const res = await axios.get(API_URL);
    setProducts(res.data);
  };

  const fetchOrders = async () => {
    try {
      console.log('🔵 Buscando pedidos...');
      console.log('🔵 API_BASE:', API_BASE);
      console.log('🔵 Admin password:', adminPassword);
      const res = await axios.get(`${API_BASE}/api/orders/all`, { 
        headers: { 'x-admin-key': adminPassword } 
      });
      console.log('✅ Pedidos recebidos:', res.data);
      console.log('✅ Quantidade de pedidos:', res.data?.length || 0);
      setOrders(res.data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar pedidos (admin):', err);
      console.error('❌ Response:', err?.response);
      console.error('❌ Status:', err?.response?.status);
      console.error('❌ Data:', err?.response?.data);
      const errorMsg = err?.response?.data?.error || err.message || 'Erro desconhecido';
      alert(`Não foi possível buscar os pedidos: ${errorMsg}`);
      setOrders([]); // Garantir que orders seja um array vazio em caso de erro
    }
  }

  useEffect(() => {
    if (loggedIn) {
      fetchProducts();
      fetchOrders();
    }
  }, [loggedIn]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Atualizar estoque por variante quando sizes ou colors mudarem
  useEffect(() => {
    if (form.sizes && form.colors) {
      const sizes = form.sizes.split(',').map(s => s.trim()).filter(Boolean);
      const colors = form.colors.split(',').map(c => c.trim()).filter(Boolean);
      
      // Só atualizar se sizes ou colors realmente mudaram
      const currentVariants = Object.keys(form.stockByVariant || {});
      const expectedVariants = sizes.flatMap(size => 
        colors.map(color => `${size}-${color}`)
      );
      
      // Verificar se precisa atualizar
      const needsUpdate = expectedVariants.some(v => !form.stockByVariant[v]) ||
        currentVariants.some(v => !expectedVariants.includes(v));
      
      if (needsUpdate) {
        const newStockByVariant = { ...form.stockByVariant };
        
        // Garantir que todas as combinações existam
        sizes.forEach(size => {
          colors.forEach(color => {
            const variant = `${size}-${color}`;
            if (!newStockByVariant[variant]) {
              newStockByVariant[variant] = parseInt(form.stock) || 0;
            }
          });
        });
        
        // Remover variantes que não existem mais
        Object.keys(newStockByVariant).forEach(variant => {
          const [size, color] = variant.split('-');
          if (!sizes.includes(size) || !colors.includes(color)) {
            delete newStockByVariant[variant];
          }
        });
        
        setForm(prev => ({ ...prev, stockByVariant: newStockByVariant }));
      }
    }
  }, [form.sizes, form.colors, form.stock]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price_cents", Number(form.price) * 100);
    formData.append("stock", Number(form.stock) || 0);
    formData.append("sizes", form.sizes);
    formData.append("colors", form.colors);
    formData.append("category", form.category || "feminino");
    
    // Adicionar estoque por variante se existir
    if (Object.keys(form.stockByVariant || {}).length > 0) {
      formData.append("stockByVariant", JSON.stringify(form.stockByVariant));
    }

    // Adicionar múltiplas imagens (até 13) - apenas novas imagens
    form.images.forEach((image) => {
      // Se for um File (nova imagem), adicionar ao FormData
      if (image instanceof File) {
        formData.append("images", image);
      }
    });

    try {
      if (editingId) {
        // Atualizar produto existente
        await axios.put(`${API_URL}/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("✅ Produto atualizado com sucesso!");
      } else {
        // Criar novo produto
        await axios.post(API_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("✅ Produto adicionado!");
      }

      // Limpar formulário
      setForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        images: [],
        sizes: "",
        colors: "",
        category: "feminino",
        stockByVariant: {},
      });
      setEditingId(null);

      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(`❌ Erro ao salvar produto: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEdit = (product) => {
    // Preencher formulário com dados do produto
    setEditingId(product._id);
    
    // Processar imagens: manter URLs existentes e usar getFullImageUrl para garantir URLs completas
    const existingImages = (product.images || []).map(img => getFullImageUrl(img));
    
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price_cents ? (product.price_cents / 100).toFixed(2) : "",
      stock: product.stock || "",
      images: existingImages, // URLs das imagens existentes (strings)
      sizes: product.sizes ? product.sizes.join(', ') : "",
      colors: product.colors ? product.colors.join(', ') : "",
      category: product.category || "feminino",
      stockByVariant: product.stockByVariant 
        ? (product.stockByVariant instanceof Map 
          ? Object.fromEntries(product.stockByVariant) 
          : product.stockByVariant)
        : {},
    });
    
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    // Limpar URLs de blob se houver
    form.images.forEach((image) => {
      if (image instanceof File) {
        // Não precisamos limpar aqui, será limpo quando o componente desmontar
      }
    });
    
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      images: [],
      sizes: "",
      colors: "",
      category: "feminino",
      stockByVariant: {},
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja remover este produto?")) {
      await axios.delete(`${API_URL}/${id}`);
      fetchProducts();
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 md:p-10 w-full max-w-md animate-slide-up border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full mb-4">
              <i className="fas fa-lock text-white text-2xl"></i>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
              Painel Administrativo
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Digite sua senha para continuar
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-key text-gray-400"></i>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin(e);
                  }
                }}
                placeholder="Digite sua senha"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400"
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Entrar
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <i className="fas fa-shield-alt mr-1"></i>
              Acesso restrito a administradores
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                <i className="fas fa-store mr-3 text-gray-900 dark:text-white"></i>
                Painel Administrativo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Gerencie produtos e pedidos da loja
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={()=>setShowOrders(false)} 
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  !showOrders 
                    ? 'bg-gray-900 dark:bg-gray-700 text-white shadow-lg' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-box mr-2"></i>
                Produtos
              </button>
              <button 
                onClick={()=>setShowOrders(true)} 
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  showOrders 
                    ? 'bg-gray-900 dark:bg-gray-700 text-white shadow-lg' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-shopping-cart mr-2"></i>
                Pedidos ({orders.length})
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Deseja sair do painel administrativo?")) {
                    setLoggedIn(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Formulário de Cadastro/Edição de Produtos */}
        {!showOrders && (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 md:p-8 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus-circle'} mr-3 text-gray-900 dark:text-white`}></i>
                {editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h2>
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancelar Edição
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <i className="fas fa-tag mr-2"></i>
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ex: Pijama Floral"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <i className="fas fa-dollar-sign mr-2"></i>
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Ex: 89.90"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <i className="fas fa-box mr-2"></i>
                    Estoque (quantidade) *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="Ex: 50"
                    min="0"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <i className="fas fa-align-left mr-2"></i>
                  Descrição *
                </label>
                <textarea
                  name="description"
                  placeholder="Descreva o produto em detalhes..."
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <i className="fas fa-tags mr-2"></i>
                  Categoria *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white"
                >
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="infantil">Infantil</option>
                  <option value="familia">Família</option>
                  <option value="natal">Especial de Natal</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <i className="fas fa-ruler mr-2"></i>
                    Tamanhos (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    name="sizes"
                    placeholder="Ex: P, M, G, GG"
                    value={form.sizes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <i className="fas fa-palette mr-2"></i>
                    Cores (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    name="colors"
                    placeholder="Ex: Rosa, Azul, Branco"
                    value={form.colors}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <i className="fas fa-tags mr-2"></i>
                    Categoria/Classificação *
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white"
                  >
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                    <option value="infantil">Infantil</option>
                    <option value="familia">Família</option>
                    <option value="especial-natal">Especial de Natal</option>
                  </select>
                </div>
              </div>

              {/* Estoque por Cor/Tamanho */}
              {form.sizes && form.colors && form.sizes.trim() && form.colors.trim() && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <i className="fas fa-boxes mr-2"></i>
                    Estoque por Cor e Tamanho
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(() => {
                      const sizes = form.sizes.split(',').map(s => s.trim()).filter(Boolean);
                      const colors = form.colors.split(',').map(c => c.trim()).filter(Boolean);
                      const variants = [];
                      
                      sizes.forEach(size => {
                        colors.forEach(color => {
                          variants.push({ size, color, variant: `${size}-${color}` });
                        });
                      });
                      
                      return variants.map(({ size, color, variant }) => (
                        <div key={variant} className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400 w-20 truncate">
                            {size} - {color}:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={form.stockByVariant[variant] || 0}
                            onChange={(e) => {
                              const newStockByVariant = {
                                ...form.stockByVariant,
                                [variant]: parseInt(e.target.value) || 0
                              };
                              setForm({ ...form, stockByVariant: newStockByVariant });
                            }}
                            className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-800 dark:text-white"
                          />
                        </div>
                      ));
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    Configure o estoque individual para cada combinação de cor e tamanho
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <i className="fas fa-images mr-2"></i>
                  Imagens do Produto * (até 13 imagens)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="product-images-input"
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      // Combinar com imagens existentes (até 13 no total)
                      const combinedImages = [...form.images, ...newFiles].slice(0, 13);
                      setForm({ ...form, images: combinedImages });
                      // Resetar o input para permitir selecionar mais arquivos
                      e.target.value = '';
                    }}
                    required={form.images.length === 0}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent transition-all text-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                  />
                </div>
                {form.images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      <i className="fas fa-check-circle mr-1"></i>
                      {form.images.length} {form.images.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}
                      {form.images.length >= 13 && (
                        <span className="ml-2 text-orange-600 dark:text-orange-400">
                          (máximo atingido)
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {form.images.map((image, index) => {
                        // Verificar se é uma URL (string) ou um File
                        const imageUrl = image instanceof File 
                          ? URL.createObjectURL(image)
                          : (typeof image === 'string' ? image : null);
                        
                        if (!imageUrl) return null;
                        
                        return (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Preview ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                              onError={(e) => {
                                // Se a imagem falhar ao carregar, mostrar placeholder
                                e.target.src = 'https://via.placeholder.com/80?text=Imagem';
                              }}
                            />
                            <div className="absolute top-0 left-0 bg-black/60 text-white text-xs px-1 rounded">
                              {index + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = form.images.filter((_, i) => i !== index);
                                setForm({ ...form, images: newImages });
                                // Limpar URL criada se for File
                                if (image instanceof File && imageUrl.startsWith('blob:')) {
                                  URL.revokeObjectURL(imageUrl);
                                }
                              }}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {form.images.length < 13 && (
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('product-images-input')?.click();
                        }}
                        className="mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                      >
                        <i className="fas fa-plus mr-1"></i>
                        Adicionar mais imagens ({13 - form.images.length} restantes)
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                <i className={`fas ${editingId ? 'fa-save' : 'fa-plus-circle'} mr-2`}></i>
                {editingId ? 'Salvar Alterações' : 'Adicionar Produto'}
              </button>
            </form>
          </div>
        )}

        {!showOrders && (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <i className="fas fa-box-open mr-3 text-gray-900 dark:text-white"></i>
                Produtos Cadastrados
              </h2>
              <span className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-semibold">
                {products.length} {products.length === 1 ? 'produto' : 'produtos'}
              </span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum produto cadastrado ainda.</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Use o formulário acima para adicionar o primeiro produto.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <div key={p._id} className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <div className="relative">
                      <img
                        src={getFullImageUrl(p.images?.[0]) || '/placeholder.jpg'}
                        alt={p.name}
                        className="w-full h-56 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="px-3 py-1 bg-black bg-opacity-75 text-white text-xs font-semibold rounded-full">
                          {p.stock || 0} em estoque
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                        {p.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          R$ {(p.price_cents / 100).toFixed(2).replace('.', ',')}
                        </p>
                        {(p.sizes && p.sizes.length > 0) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <i className="fas fa-ruler mr-1"></i>
                            {p.sizes.length} {p.sizes.length === 1 ? 'tamanho' : 'tamanhos'}
                          </span>
                        )}
                      </div>
                      {(p.colors && p.colors.length > 0) && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <i className="fas fa-palette mr-1"></i>
                            Cores: {p.colors.join(', ')}
                          </p>
                        </div>
                      )}
                      {/* Mostrar estoque por variante se existir */}
                      {p.stockByVariant && (p.stockByVariant instanceof Map ? p.stockByVariant.size > 0 : Object.keys(p.stockByVariant || {}).length > 0) && (
                        <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Estoque por Variante:</p>
                          <div className="space-y-1">
                            {(p.stockByVariant instanceof Map 
                              ? Array.from(p.stockByVariant.entries())
                              : Object.entries(p.stockByVariant || {})
                            ).map(([variant, qty]) => (
                              <div key={variant} className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">{variant}:</span>
                                <span className="font-semibold text-gray-800 dark:text-white">{qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showOrders && (
          <div>
            {/* Solicitações de Devolução */}
            {orders.filter(o => o.returnRequest && o.returnRequest.requestedAt).length > 0 && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-yellow-800 dark:text-yellow-300 mb-4 flex items-center gap-2">
                  <i className="fas fa-undo"></i>
                  Solicitações de Devolução ({orders.filter(o => o.returnRequest && o.returnRequest.requestedAt).length})
                </h2>
                <div className="space-y-4">
                  {orders
                    .filter(o => o.returnRequest && o.returnRequest.requestedAt)
                    .map((o) => (
                      <div key={o._id} className="p-4 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg bg-white dark:bg-gray-800">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg text-yellow-900 dark:text-yellow-200">
                              Pedido #{o._id.slice(-8)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {o.email} • {new Date(o.createdAt).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Solicitado em: {new Date(o.returnRequest.requestedAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-sm">
                            <span className={`px-3 py-1 rounded-full font-semibold ${
                              o.returnRequest.status === 'pending' 
                                ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                                : o.returnRequest.status === 'approved'
                                ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                                : o.returnRequest.status === 'rejected'
                                ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {o.returnRequest.status === 'pending' ? 'Aguardando Análise' :
                               o.returnRequest.status === 'approved' ? 'Aprovada' :
                               o.returnRequest.status === 'rejected' ? 'Rejeitada' : 'Concluída'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                          <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Motivo da Devolução:</p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">{o.returnRequest.reason || 'Não informado'}</p>
                        </div>

                        <div className="mt-3">
                          <h4 className="font-semibold mb-2">Itens do Pedido:</h4>
                          <ul className="space-y-1">
                            {o.items.map((it, idx) => {
                              const specs = [];
                              if (it.selectedSize) specs.push(`Tamanho: ${it.selectedSize}`);
                              if (it.selectedColor) specs.push(`Cor: ${it.selectedColor}`);
                              const specsText = specs.length > 0 ? ` (${specs.join(', ')})` : '';
                              
                              return (
                                <li key={idx} className="flex justify-between py-1 text-sm">
                                  <span>{it.name} x{it.quantity}{specsText}</span>
                                  <span className="font-semibold">R$ {(it.price * it.quantity).toFixed(2)}</span>
                                </li>
                              );
                            })}
                          </ul>
                          <p className="mt-2 font-bold text-lg">
                            Total: R$ {(o.total || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-4 flex gap-2 flex-wrap">
                          <select 
                            id={`return-status-${o._id}`} 
                            defaultValue={o.returnRequest.status}
                            className="p-2 border rounded bg-white dark:bg-gray-700"
                          >
                            <option value="pending">Aguardando Análise</option>
                            <option value="approved">Aprovar</option>
                            <option value="rejected">Rejeitar</option>
                            <option value="completed">Concluir</option>
                          </select>
                          <button 
                            onClick={async () => {
                              const status = document.getElementById(`return-status-${o._id}`)?.value;
                              const notes = prompt('Adicione uma nota (opcional):') || '';
                              try {
                                await axios.patch(
                                  `${API_BASE}/api/orders/${o._id}/return-status`, 
                                  { status, notes }, 
                                  { headers: { 'x-admin-key': adminPassword } }
                                );
                                fetchOrders();
                                alert('Status da devolução atualizado');
                              } catch (err) {
                                console.error(err);
                                alert('Erro ao atualizar status da devolução');
                              }
                            }}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                          >
                            Atualizar Status
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Pedidos ({orders.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchOrders()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🔄 Atualizar
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('Deseja limpar todos os pedidos de teste? Isso vai deletar pedidos com emails de teste ou sem pagamento real.')) {
                      try {
                        const res = await axios.delete(`${API_BASE}/api/orders/test/cleanup`, {
                          headers: { 'x-admin-key': adminPassword }
                        });
                        alert(`✅ ${res.data.deleted || res.data.message} pedidos deletados`);
                        fetchOrders();
                      } catch (err) {
                        console.error(err);
                        alert('Erro ao limpar pedidos de teste');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  🗑️ Limpar Pedidos de Teste
                </button>
              </div>
            </div>
            {orders.length === 0 ? (
              <p className="text-center text-gray-500">Nenhum pedido encontrado.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o._id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Pedido #{o._id.slice(-8)}</p>
                        <p className="text-sm text-gray-600">{o.email} • {new Date(o.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-sm">
                        <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800">{o.status}</span>
                      </div>
                    </div>

                    {o.deliveryType === 'pickup' ? (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded">
                        <p className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <i className="fas fa-store"></i>
                          Retirada na Loja
                        </p>
                        {o.pickupAddress && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{o.pickupAddress}</p>
                        )}
                        {(() => {
                          // Tentar obter o pickupSchedule de diferentes formas
                          const schedule = o.pickupSchedule || o.pickup_schedule;
                          
                          console.log('🔵 Verificando pickupSchedule para pedido:', o._id);
                          console.log('🔵 pickupSchedule:', schedule);
                          console.log('🔵 Tipo:', typeof schedule);
                          console.log('🔵 É Date?', schedule instanceof Date);
                          
                          if (!schedule) {
                            console.log('⚠️ pickupSchedule não encontrado');
                            return (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                                Horário não agendado
                              </p>
                            );
                          }
                          
                          try {
                            // Tentar converter para Date de diferentes formas
                            let scheduleDate;
                            if (schedule instanceof Date) {
                              scheduleDate = schedule;
                            } else if (typeof schedule === 'string') {
                              scheduleDate = new Date(schedule);
                            } else if (schedule.$date) {
                              // Formato MongoDB
                              scheduleDate = new Date(schedule.$date);
                            } else if (schedule.toString) {
                              scheduleDate = new Date(schedule.toString());
                            } else {
                              scheduleDate = new Date(schedule);
                            }
                            
                            console.log('🔵 Data convertida:', scheduleDate);
                            console.log('🔵 Data toString:', scheduleDate.toString());
                            console.log('🔵 Data toISOString:', scheduleDate.toISOString());
                            console.log('🔵 É válida?', !isNaN(scheduleDate.getTime()));
                            
                            // Verificar se a data é válida
                            if (isNaN(scheduleDate.getTime())) {
                              console.error('❌ Data inválida:', schedule);
                              return (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                                  Data inválida: {String(schedule)}
                                </p>
                              );
                            }
                            
                            // A data foi salva com timezone do Brasil (-03:00)
                            // Ao exibir, precisamos garantir que está no timezone correto
                            // Se a data foi salva como "2025-12-10T12:00:00-03:00", 
                            // ao ler do MongoDB pode vir como UTC, então ajustamos
                            
                            // Criar uma nova data ajustada para o timezone do Brasil
                            const brasilOffset = -3 * 60; // UTC-3 em minutos
                            const utcTime = scheduleDate.getTime() + (scheduleDate.getTimezoneOffset() * 60000);
                            const brasilTime = new Date(utcTime + (brasilOffset * 60000));
                            
                            // Ou simplesmente usar toLocaleString com timezone
                            const dateStr = scheduleDate.toLocaleString('pt-BR', { 
                              timeZone: 'America/Sao_Paulo',
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric'
                            });
                            
                            const timeStr = scheduleDate.toLocaleTimeString('pt-BR', { 
                              timeZone: 'America/Sao_Paulo',
                              hour: '2-digit', 
                              minute: '2-digit'
                            });
                            
                            console.log('🔵 Data original:', scheduleDate);
                            console.log('🔵 Data ajustada Brasil:', brasilTime);
                            console.log('🔵 Data string (Brasil):', dateStr);
                            console.log('🔵 Hora string (Brasil):', timeStr);
                            
                            return (
                              <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border border-blue-200">
                                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                                  <i className="fas fa-calendar-alt mr-1"></i>
                                  Agendamento:
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                  {dateStr}
                                </p>
                                <p className="text-sm font-semibold text-lunabe-pink dark:text-pink-400 mt-1">
                                  <i className="fas fa-clock mr-1"></i>
                                  {timeStr}
                                </p>
                              </div>
                            );
                          } catch (error) {
                            console.error('❌ Erro ao processar pickupSchedule:', error, schedule);
                            return (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                                Erro ao exibir agendamento: {error.message}
                              </p>
                            );
                          }
                        })()}
                      </div>
                    ) : o.address && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-700 border border-gray-100 rounded">
                        <p className="font-medium">{o.address.name} • {o.address.phone}</p>
                        <p className="text-sm text-gray-600">{o.address.street}</p>
                        <p className="text-sm text-gray-600">{o.address.city} — {o.address.state} • {o.address.zip} — {o.address.country}</p>
                      </div>
                    )}

                    <div className="mt-3">
                      <h4 className="font-semibold">Itens</h4>
                      <ul className="mt-2">
                        {o.items.map((it, idx) => {
                          const specs = [];
                          if (it.selectedSize) specs.push(`Tamanho: ${it.selectedSize}`);
                          if (it.selectedColor) specs.push(`Cor: ${it.selectedColor}`);
                          const specsText = specs.length > 0 ? ` (${specs.join(', ')})` : '';
                          
                          return (
                            <li key={idx} className="flex justify-between py-2 border-b last:border-b-0">
                              <div className="flex-1">
                                <span className="font-medium">{it.name} x{it.quantity}</span>
                                {specsText && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {specsText}
                                  </div>
                                )}
                              </div>
                              <span className="font-semibold">R$ {(it.price * it.quantity).toFixed(2)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="mt-3 flex items-center space-x-2">
                      <select defaultValue={o.status} id={`status-${o._id}`} className="p-2 border rounded" >
                        <option> Aguardando pagamento </option>
                        <option> Processando </option>
                        <option> Enviado </option>
                        <option> Pago </option>
                        <option> Entregue </option>
                      </select>
                      <button onClick={async (e)=>{
                        const sel = document.getElementById(`status-${o._id}`)
                        const value = sel?.value
                        try {
                          await axios.patch(`${API_BASE}/api/orders/${o._id}/status`, { status: value }, { headers: { 'x-admin-key': adminPassword } })
                          fetchOrders()
                          alert('Status atualizado')
                        } catch (err) { console.error(err); alert('Erro ao atualizar status') }
                      }} className="px-3 py-1 bg-blue-600 text-white rounded">Atualizar status</button>

                      <input id={`track-${o._id}`} placeholder="Tracking code" className="p-2 border rounded" />
                      <button onClick={async ()=>{
                        const t = document.getElementById(`track-${o._id}`)?.value
                        try {
                          await axios.patch(`${API_BASE}/api/orders/${o._id}/tracking`, { trackingCode: t }, { headers: { 'x-admin-key': adminPassword } })
                          fetchOrders()
                          alert('Tracking salvo')
                        } catch (err) { console.error(err); alert('Erro ao salvar tracking') }
                      }} className="px-3 py-1 bg-green-600 text-white rounded">Salvar tracking</button>
                      
                      <button 
                        onClick={async () => {
                          if (window.confirm(`Deseja deletar o pedido #${o._id.slice(-8)}?`)) {
                            try {
                              await axios.delete(`${API_BASE}/api/orders/${o._id}`, {
                                headers: { 'x-admin-key': adminPassword }
                              });
                              alert('Pedido deletado');
                              fetchOrders();
                            } catch (err) {
                              console.error(err);
                              alert('Erro ao deletar pedido');
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;