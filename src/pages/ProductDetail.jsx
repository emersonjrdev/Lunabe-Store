import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import LazyImage from "../components/LazyImage";
import ProductCard from "../components/ProductCard";
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
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          setSelectedSize(data.sizes?.[0] || "Único");
          setSelectedColor(data.colors?.[0] || "Padrão");
        } else {
          addToast("Produto não encontrado!", "error");
        }
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
      <div className="text-center py-16 text-gray-600 dark:text-gray-400">
        Carregando produto...
      </div>
    );

  if (!product)
    return (
      <div className="text-center py-16 text-gray-600 dark:text-gray-400">
        Produto não encontrado.
      </div>
    );

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  return (
    <div className="animate-fade-in container mx-auto px-4 py-8">
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
        <Link to="/" className="hover:text-gray-800 dark:hover:text-white">
          Início
        </Link>
        <i className="fas fa-chevron-right text-xs"></i>
        <span className="text-gray-800 dark:text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            <LazyImage
              src={product.images?.[selectedImage] || product.image}
              alt={product.name}
              className="w-full h-96 object-cover rounded-xl"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i
                      ? "border-lunabe-pink"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <LazyImage src={image} alt={product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {product.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {product.description}
          </p>

          <div className="flex items-center space-x-4">
            <span className="text-4xl font-bold text-gray-800 dark:text-white">
              R$ {product.price.toFixed(2)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-2xl text-gray-400 line-through">
                  R$ {product.originalPrice.toFixed(2)}
                </span>
                <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Tamanho: {selectedSize}
            </h3>
            <div className="flex gap-2 mt-2">
              {product.sizes?.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedSize === size
                      ? "bg-lunabe-pink text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Cor: {selectedColor}
            </h3>
            <div className="flex gap-2 mt-2">
              {product.colors?.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedColor === color
                      ? "bg-lunabe-pink text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 text-gray-600 dark:text-gray-400"
              >
                -
              </button>
              <span className="px-3 text-gray-800 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 text-gray-600 dark:text-gray-400"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold"
            >
              Adicionar ao carrinho
            </button>

            <button
              onClick={handleBuyNow}
              className="bg-lunabe-pink text-white px-6 py-3 rounded-xl font-semibold"
            >
              Comprar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
