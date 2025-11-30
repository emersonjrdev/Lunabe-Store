import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
// Firebase removed — product data comes from backend API
import LazyImage from "../components/LazyImage";
import { API_BASE } from '../api'
import { getFullImageUrl } from '../utils/image'
import { useToast } from "../hooks/useToast";

export default function ProductDetail({ onAddToCart, user, onLoginClick }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchProduct = async () => {
    if (!id) {
      console.error("ID do produto não fornecido");
      addToast("ID do produto inválido.", "error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/products/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          addToast("Produto não encontrado.", "error");
          setProduct(null);
          setIsLoading(false);
          return;
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data._id) {
        console.error("Dados do produto inválidos:", data);
        addToast("Erro ao carregar dados do produto.", "error");
        setProduct(null);
        setIsLoading(false);
        return;
      }

      setProduct(data);
      setSelectedSize(data.sizes?.[0] || "Único");
      setSelectedColor(data.colors?.[0] || "Padrão");
    } catch (err) {
      console.error("Erro ao buscar produto:", err);
      addToast("Erro ao carregar o produto. Tente novamente.", "error");
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  fetchProduct();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]);


  const handleAddToCart = () => {
    if (!user) {
      onLoginClick();
      addToast("Faça login para adicionar produtos ao carrinho!", "error");
      return;
    }

    if (!product) {
      addToast("Produto não disponível.", "error");
      return;
    }

    // Verificar estoque
    if (product.stock !== undefined && product.stock === 0) {
      addToast("Produto esgotado.", "error");
      return;
    }

    if (product.stock !== undefined && quantity > product.stock) {
      addToast(`Quantidade indisponível. Estoque: ${product.stock}`, "error");
      setQuantity(product.stock);
      return;
    }

    try {
      const productWithOptions = {
        ...product,
        selectedSize,
        selectedColor,
        quantity,
      };

      // normalize price fields
      productWithOptions.price_cents = product.price_cents || (product.price ? Math.round(product.price * 100) : 0);
      productWithOptions.price = productWithOptions.price_cents ? (productWithOptions.price_cents / 100) : (product.price || 0);

      // Garantir que tem ID
      if (!productWithOptions.id && !productWithOptions._id) {
        console.error("Produto sem ID:", productWithOptions);
        addToast("Erro: produto sem identificador.", "error");
        return;
      }

      // Usar _id se id não existir
      if (!productWithOptions.id && productWithOptions._id) {
        productWithOptions.id = productWithOptions._id;
      }

      onAddToCart(productWithOptions);
      addToast(`${product.name || 'Produto'} adicionado ao carrinho!`, "success");
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      addToast("Erro ao adicionar produto ao carrinho.", "error");
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/carrinho");
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lunabe-pink mx-auto mb-4"></div>
          <p>Carregando produto...</p>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-400">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <p>Produto não encontrado.</p>
          <Link to="/" className="btn-primary mt-4 inline-block">
            Voltar à Loja
          </Link>
        </div>
      </div>
    );

  // Calcular preço com segurança
  const priceValue = product?.price_cents 
    ? (product.price_cents / 100) 
    : (product?.price || 0);
  
  const originalPriceValue = product?.originalPrice_cents 
    ? (product.originalPrice_cents / 100) 
    : (product?.originalPrice || 0);

  const discount = originalPriceValue && originalPriceValue > priceValue && priceValue > 0
    ? Math.round((1 - priceValue / originalPriceValue) * 100)
    : 0;

  return (
    <div className="animate-fade-in container-responsive py-4 md:py-8">
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6 md:mb-8 mobile-padding">
        <Link to="/" className="hover:text-gray-800 dark:hover:text-white">
          Início
        </Link>
        <i className="fas fa-chevron-right text-xs"></i>
        <span className="text-gray-800 dark:text-white truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-16">
        {/* Galeria de Imagens do Produto */}
        <div className="space-y-4">
          {/* Imagem Principal - Aspect ratio vertical para corpo todo */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 group">
            <div className="aspect-[3/4] w-full overflow-hidden">
              <LazyImage
                src={getFullImageUrl(product?.images?.[selectedImage] || product?.image) || '/placeholder.jpg'}
                alt={product?.name || 'Produto'}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Badges na imagem principal */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
              {product.stock !== undefined && product.stock === 0 && (
                <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl backdrop-blur-sm">
                  <i className="fas fa-times-circle mr-2"></i>
                  Esgotado
                </span>
              )}
              {product.stock !== undefined && product.stock > 0 && product.isNew && (
                <span className="bg-gradient-to-r from-lunabe-pink to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl backdrop-blur-sm">
                  <i className="fas fa-star mr-2"></i>
                  Novo
                </span>
              )}
              {discount > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl backdrop-blur-sm">
                  <i className="fas fa-tag mr-2"></i>
                  -{discount}% OFF
                </span>
              )}
            </div>
          </div>
          
          {/* Miniaturas das Imagens */}
          {product?.images && product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((image, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-3 transition-all duration-300 ${
                    selectedImage === i
                      ? "border-lunabe-pink shadow-lg scale-105 ring-2 ring-lunabe-pink/50"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <LazyImage 
                    src={getFullImageUrl(image) || '/placeholder.jpg'} 
                    alt={`${product?.name || 'Produto'} - Vista ${i + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div className="space-y-5 md:space-y-6 mobile-padding lg:pl-0">
          {/* Título e Descrição */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              {product?.name || 'Produto sem nome'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
              {product?.description || 'Sem descrição disponível'}
            </p>
          </div>

          {/* Preço */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-5 border border-gray-200 dark:border-gray-600">
            <div className="flex items-baseline space-x-4">
              <div>
                <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  R$ {priceValue.toFixed(2).replace('.', ',')}
                </span>
                {discount > 0 && (
                  <div className="mt-2 flex items-center space-x-3">
                    <span className="text-lg sm:text-xl text-gray-400 dark:text-gray-500 line-through">
                      R$ {originalPriceValue.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      <i className="fas fa-tag mr-1"></i>
                      {discount}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>
            {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
              <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <p className="text-sm text-orange-700 dark:text-orange-400 font-semibold flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Últimas {product.stock} {product.stock === 1 ? 'unidade' : 'unidades'} disponível{product.stock === 1 ? '' : 'is'}!
                </p>
              </div>
            )}
          </div>

          {/* Tamanhos */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3 flex items-center">
              <i className="fas fa-ruler mr-2 text-lunabe-pink text-sm"></i>
              Tamanho
            </h3>
            <div className="flex flex-wrap gap-2">
              {product?.sizes && product.sizes.length > 0 ? (
                product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      selectedSize === size
                        ? "bg-gradient-to-r from-lunabe-pink to-pink-600 text-white shadow-md scale-105"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {size}
                  </button>
                ))
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">Tamanho único</span>
              )}
            </div>
          </div>

          {/* Cores */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3 flex items-center">
              <i className="fas fa-palette mr-2 text-lunabe-pink text-sm"></i>
              Cor
            </h3>
            <div className="flex flex-wrap gap-2">
              {product?.colors && product.colors.length > 0 ? (
                product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      selectedColor === color
                        ? "bg-gradient-to-r from-lunabe-pink to-pink-600 text-white shadow-md scale-105"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {color}
                  </button>
                ))
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">Cor padrão</span>
              )}
            </div>
          </div>

          {/* Estoque disponível */}
          {product.stock !== undefined && (
            <div className={`rounded-xl p-4 border-2 ${
              product.stock > 0 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              {product.stock > 0 ? (
                <p className="text-sm font-semibold flex items-center">
                  <i className="fas fa-check-circle text-green-600 dark:text-green-400 mr-2 text-lg"></i>
                  <span className="text-green-700 dark:text-green-400">
                    {product.stock} {product.stock === 1 ? 'unidade' : 'unidades'} disponível{product.stock === 1 ? '' : 'is'} em estoque
                  </span>
                </p>
              ) : (
                <p className="text-sm font-semibold flex items-center text-red-700 dark:text-red-400">
                  <i className="fas fa-times-circle mr-2 text-lg"></i>
                  Produto esgotado
                </p>
              )}
            </div>
          )}

          {/* Quantidade e Botões */}
          <div className="space-y-4">
            {/* Seletor de Quantidade */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className={`w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                      quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <i className="fas fa-minus text-sm"></i>
                  </button>
                  <span className="px-4 text-gray-900 dark:text-white min-w-12 text-center font-semibold text-base">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      const maxQty = product.stock !== undefined ? product.stock : 100;
                      setQuantity(Math.min(maxQty, quantity + 1));
                    }}
                    disabled={product.stock !== undefined && quantity >= product.stock}
                    className={`w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                      (product.stock !== undefined && quantity >= product.stock) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <i className="fas fa-plus text-sm"></i>
                  </button>
                </div>
                {product.stock !== undefined && quantity > product.stock && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Máximo: {product.stock}
                  </p>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock !== undefined && product.stock === 0}
                className={`flex-1 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-white px-5 py-3 rounded-xl font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 ${
                  (product.stock !== undefined && product.stock === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <i className="fas fa-shopping-cart"></i>
                <span>{product.stock === 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock !== undefined && product.stock === 0}
                className={`flex-1 bg-gradient-to-r from-lunabe-pink to-pink-600 text-white px-5 py-3 rounded-xl font-semibold text-base hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 ${
                  (product.stock !== undefined && product.stock === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <i className="fas fa-bolt"></i>
                <span>Comprar Agora</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}