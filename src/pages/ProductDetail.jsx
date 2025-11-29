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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
        {/* Imagens do Produto */}
        <div className="space-y-3 md:space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-3 md:p-4">
            <LazyImage
              src={getFullImageUrl(product?.images?.[selectedImage] || product?.image) || '/placeholder.jpg'}
              alt={product?.name || 'Produto'}
              className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg md:rounded-xl"
            />
          </div>
          {product?.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((image, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i
                      ? "border-lunabe-pink"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <LazyImage 
                    src={getFullImageUrl(image) || '/placeholder.jpg'} 
                    alt={product?.name || 'Produto'} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div className="space-y-4 md:space-y-6 mobile-padding lg:pl-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            {product?.name || 'Produto sem nome'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-responsive">
            {product?.description || 'Sem descrição disponível'}
          </p>

          <div className="flex items-center space-x-3 md:space-x-4">
            <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
              R$ {priceValue.toFixed(2)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-xl sm:text-2xl text-gray-400 line-through">
                  R$ {originalPriceValue.toFixed(2)}
                </span>
                <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          {/* Tamanhos */}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Tamanho: {selectedSize}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product?.sizes && product.sizes.length > 0 ? (
                product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg transition-all ${
                      selectedSize === size
                        ? "bg-lunabe-pink text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {size}
                  </button>
                ))
              ) : (
                <span className="text-sm text-gray-500">Nenhum tamanho disponível</span>
              )}
            </div>
          </div>

          {/* Cores */}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Cor: {selectedColor}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product?.colors && product.colors.length > 0 ? (
                product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg transition-all ${
                      selectedColor === color
                        ? "bg-lunabe-pink text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {color}
                  </button>
                ))
              ) : (
                <span className="text-sm text-gray-500">Nenhuma cor disponível</span>
              )}
            </div>
          </div>

          {/* Estoque disponível */}
          {product.stock !== undefined && (
            <div className="mt-4">
              {product.stock > 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <strong className="text-green-600 dark:text-green-400">
                    {product.stock} {product.stock === 1 ? 'unidade' : 'unidades'} disponível{product.stock === 1 ? '' : 'is'}
                  </strong>
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                  <i className="fas fa-times-circle mr-2"></i>
                  Produto esgotado
                </p>
              )}
            </div>
          )}

          {/* Quantidade e Botões */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-4 md:mt-6">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className={`w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded ${
                  quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                -
              </button>
              <span className="px-4 text-gray-800 dark:text-white min-w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => {
                  const maxQty = product.stock !== undefined ? product.stock : 100;
                  setQuantity(Math.min(maxQty, quantity + 1));
                }}
                disabled={product.stock !== undefined && quantity >= product.stock}
                className={`w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded ${
                  (product.stock !== undefined && quantity >= product.stock) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                +
              </button>
            </div>
            {product.stock !== undefined && quantity > product.stock && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Quantidade máxima: {product.stock}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={handleAddToCart}
                disabled={product.stock !== undefined && product.stock === 0}
                className={`btn-secondary order-2 sm:order-1 ${
                  (product.stock !== undefined && product.stock === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {product.stock === 0 ? 'Produto Esgotado' : 'Adicionar ao carrinho'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock !== undefined && product.stock === 0}
                className={`btn-primary order-1 sm:order-2 ${
                  (product.stock !== undefined && product.stock === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Comprar Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}