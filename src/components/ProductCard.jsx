import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import LazyImage from './LazyImage'
import { getFullImageUrl } from '../utils/image'

const ProductCard = ({ product, onAddToCart, user, onLoginClick }) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'Único')
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || 'Padrão')
  const [isAdding, setIsAdding] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!product) return null

  // Função para obter estoque da variante selecionada
  const getVariantStock = () => {
    if (!product) return 0;
    
    // Se tem stockByVariant, usar ele
    if (product.stockByVariant) {
      const variant = `${selectedSize}-${selectedColor}`;
      // stockByVariant pode ser Map ou objeto
      if (product.stockByVariant instanceof Map) {
        return product.stockByVariant.get(variant) || 0;
      } else if (typeof product.stockByVariant === 'object') {
        return product.stockByVariant[variant] || 0;
      }
    }
    
    // Fallback para stock geral
    return product.stock !== undefined ? product.stock : 0;
  };

  const availableStock = getVariantStock();

  const handleAddToCart = async () => {
    if (!user) {
      onLoginClick()
      return
    }
    
    // Verificar estoque da variante selecionada
    if (availableStock === 0) {
      return // Produto esgotado para esta combinação, não adicionar
    }
    
    setIsAdding(true)
    const productWithOptions = {
      ...product,
      selectedSize,
      selectedColor
    }
    await new Promise(resolve => setTimeout(resolve, 400))
    onAddToCart(productWithOptions)
    setIsAdding(false)
  }
  
  const isOutOfStock = availableStock === 0

  const priceValue = product.price_cents ? (product.price_cents / 100) : (product.price || 0);
  const originalPriceValue = product.originalPrice_cents ? (product.originalPrice_cents / 100) : product.originalPrice;

  const discountPercentage = originalPriceValue && originalPriceValue > priceValue
    ? Math.round((1 - priceValue / originalPriceValue) * 100)
    : 0

  // Garantir que tem ID (usar _id se id não existir)
  const productId = product.id || product._id;
  
  if (!productId) {
    console.error("Produto sem ID:", product);
    return null;
  }

  const productImages = product.images || [];
  const hasMultipleImages = productImages.length > 1;
  const currentImage = productImages[currentImageIndex] || productImages[0] || product.image;
  
  // Garantir que sempre mostre pelo menos uma imagem
  const displayImage = currentImage || '/placeholder.jpg';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden card-hover border border-gray-200 dark:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] group">
      <Link 
        to={`/produto/${productId}`} 
        className="block relative group overflow-hidden"
        onClick={() => setCurrentImageIndex(0)}
      >
        {/* Container da imagem com aspect ratio vertical (corpo todo) */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-900">
          <LazyImage 
            src={getFullImageUrl(displayImage)}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          {/* Overlay no hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Indicador de múltiplas imagens */}
          {hasMultipleImages && (
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                <i className="fas fa-images"></i>
                <span>{currentImageIndex + 1}/{productImages.length}</span>
              </span>
            </div>
          )}

          {/* Navegação de imagens no hover */}
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-gray-800 z-20 cursor-pointer"
                aria-label="Imagem anterior"
              >
                <i className="fas fa-chevron-left text-gray-800 dark:text-white text-sm"></i>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-gray-800 z-20 cursor-pointer"
                aria-label="Próxima imagem"
              >
                <i className="fas fa-chevron-right text-gray-800 dark:text-white text-sm"></i>
              </button>
              
              {/* Indicadores de imagens */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      index === currentImageIndex
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2 z-10">
            {isOutOfStock && (
              <span className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm transform transition-all duration-300 group-hover:scale-110">
                <i className="fas fa-times-circle mr-1"></i>
                Esgotado
              </span>
            )}
            {!isOutOfStock && product.isNew && (
              <span className="bg-gradient-to-r from-lunabe-pink to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm animate-pulse transform transition-all duration-300 group-hover:scale-110">
                <i className="fas fa-star mr-1"></i>
                Novo
              </span>
            )}
            {!isOutOfStock && discountPercentage > 0 && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm">
                <i className="fas fa-tag mr-1"></i>
                -{discountPercentage}%
              </span>
            )}
          </div>

          {/* Botão de visualização rápida no hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <span className="text-gray-900 dark:text-white font-semibold text-sm flex items-center space-x-2">
                <i className="fas fa-eye"></i>
                <span>Ver Detalhes</span>
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-5 sm:p-6 space-y-4">
        <div>
          <Link to={`/produto/${productId}`}>
            <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-white mb-2 hover:text-lunabe-pink dark:hover:text-lunabe-pink transition-colors line-clamp-2 group-hover:underline">
              {product.name || 'Produto sem nome'}
            </h3>
          </Link>

          <p className="text-gray-600 dark:text-gray-400 line-clamp-2 text-sm leading-relaxed">
            {product.description || 'Produto incrível da Lunabê'}
          </p>
        </div>

        {/* Tamanhos e Cores - Layout mais compacto */}
        {(product.sizes?.length > 0 || product.colors?.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {product.sizes?.length > 0 && (
              <div className="flex items-center space-x-1">
                <i className="fas fa-ruler text-gray-400 text-xs"></i>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.slice(0, 3).map(size => (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedSize(size);
                      }}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  {product.sizes.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                      +{product.sizes.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            {product.colors?.length > 0 && (
              <div className="flex items-center space-x-1">
                <i className="fas fa-palette text-gray-400 text-xs"></i>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {product.colors.length} {product.colors.length === 1 ? 'cor' : 'cores'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Preço */}
        <div className="flex items-baseline space-x-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              R$ {priceValue.toFixed(2).replace('.', ',')}
            </span>
            {discountPercentage > 0 && (
              <>
                <span className="text-base text-gray-400 dark:text-gray-500 line-through">
                  R$ {(originalPriceValue || product.originalPrice).toFixed(2).replace('.', ',')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Estoque baixo */}
        {availableStock > 0 && availableStock <= 5 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
            <p className="text-xs text-orange-700 dark:text-orange-400 font-semibold flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Últimas {availableStock} {availableStock === 1 ? 'unidade' : 'unidades'}!
              {selectedSize && selectedColor && (
                <span className="ml-1 text-xs font-normal">
                  ({selectedSize} - {selectedColor})
                </span>
              )}
            </p>
          </div>
        )}

        {/* Botão de adicionar */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={`w-full bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-600 text-white px-4 py-3.5 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] font-semibold flex items-center justify-center space-x-2 text-sm ${
            (isAdding || isOutOfStock) ? 'opacity-50 cursor-not-allowed' : 'hover:from-gray-800 hover:to-gray-700'
          }`}
        >
          {isAdding ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Adicionando...</span>
            </>
          ) : isOutOfStock ? (
            <>
              <i className="fas fa-times-circle"></i>
              <span>Esgotado</span>
            </>
          ) : (
            <>
              <i className="fas fa-shopping-cart"></i>
              <span>Adicionar ao Carrinho</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ProductCard