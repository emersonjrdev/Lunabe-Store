import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import LazyImage from "../components/LazyImage";
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
    try {
      const response = await fetch(`https://lunabe-store.onrender.com/api/products/${id}`);
      const data = await response.json();
      setProduct(data);
      setSelectedSize(data.sizes?.[0] || "Único");
      setSelectedColor(data.colors?.[0] || "Padrão");
    } catch (err) {
      console.error("Erro ao buscar produto:", err);
      addToast("Erro ao carregar o produto.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  fetchProduct();
}, [id]);


  const handleAddToCart = () => {
    if (!user) {
      onLoginClick();
      addToast("Faça login para adicionar produtos ao carrinho!", "error");
      return;
    }

    const productWithOptions = {
      ...product,
      selectedSize,
      selectedColor,
      quantity,
    };

    onAddToCart(productWithOptions);
    addToast(`${product.name} adicionado ao carrinho!`, "success");
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

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
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
              src={product.images?.[selectedImage] || product.image}
              alt={product.name}
              className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg md:rounded-xl"
            />
          </div>
          {product.images?.length > 1 && (
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
                    src={image} 
                    alt={product.name} 
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
            {product.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-responsive">
            {product.description}
          </p>

          <div className="flex items-center space-x-3 md:space-x-4">
            <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
              R$ {product.price.toFixed(2)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-xl sm:text-2xl text-gray-400 line-through">
                  R$ {product.originalPrice.toFixed(2)}
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
              {product.sizes?.map((size) => (
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
              ))}
            </div>
          </div>

          {/* Cores */}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Cor: {selectedColor}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.colors?.map((color) => (
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
              ))}
            </div>
          </div>

          {/* Quantidade e Botões */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-4 md:mt-6">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                -
              </button>
              <span className="px-4 text-gray-800 dark:text-white min-w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                +
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={handleAddToCart}
                className="btn-secondary order-2 sm:order-1"
              >
                Adicionar ao carrinho
              </button>

              <button
                onClick={handleBuyNow}
                className="btn-primary order-1 sm:order-2"
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