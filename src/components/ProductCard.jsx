import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import LazyImage from './LazyImage'
import { getFullImageUrl } from '../utils/image'

const ProductCard = ({ product, onAddToCart, user, onLoginClick }) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'Único')
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || 'Padrão')
  const [isAdding, setIsAdding] = useState(false)

  if (!product) return null

  const handleAddToCart = async () => {
    if (!user) {
      onLoginClick()
      return
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

  const discountPercentage = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg overflow-hidden card-hover border border-gray-100 dark:border-gray-700">
      <Link to={`/produto/${product.id}`} className="block relative group">
       <LazyImage 
     src={getFullImageUrl(product.images?.[0]) || '/placeholder.jpg'}
    alt={product.name}
    className="w-full h-48 sm:h-56 md:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
  />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>

        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col space-y-1 sm:space-y-2">
          {product.isNew && (
            <span className="bg-lunabe-pink text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">Novo</span>
          )}
          {product.originalPrice && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs sm:text-sm font-bold shadow-lg">
              -{discountPercentage}%
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 sm:p-6">
        <Link to={`/produto/${product.id}`}>
          <h3 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-white mb-2 hover:text-lunabe-pink dark:hover:text-lunabe-pink transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">
          {product.description || 'Produto incrível da Lunabê'}
        </p>

        {/* Tamanhos */}
        {product.sizes?.length > 0 && (
          <div className="mb-2 sm:mb-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Tamanho:</label>
            <div className="flex flex-wrap gap-1">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedSize === size
                      ? 'bg-gray-800 dark:bg-gray-300 text-white dark:text-gray-900'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cores */}
        {product.colors?.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Cor:</label>
            <div className="flex flex-wrap gap-1">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedColor === color
                      ? 'bg-gray-800 dark:bg-gray-300 text-white dark:text-gray-900'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preço e botão */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              R$ {product.price?.toFixed(2) || '0,00'}
            </span>
            {product.originalPrice && (
              <span className="text-sm sm:text-base text-gray-500 dark:text-gray-400 line-through">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base ${
              isAdding ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isAdding ? (
              <>
                <i className="fas fa-spinner fa-spin text-xs sm:text-sm"></i>
                <span className="text-xs sm:text-sm">Adicionando...</span>
              </>
            ) : (
              <>
                <i className="fas fa-shopping-cart text-xs sm:text-sm"></i>
                <span className="text-xs sm:text-sm">Adicionar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard