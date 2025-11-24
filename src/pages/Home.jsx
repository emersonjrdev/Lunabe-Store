import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ProductSkeleton'
import ProductSearch from '../components/Search'

const Home = ({ onAddToCart, user, onLoginClick }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('name')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'))
        const productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setProducts(productList)
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) setSearchQuery(query)
  }, [searchParams])

  const filteredProducts = products
    .filter(product => {
      if (filter === 'new' && !product.isNew) return false
      if (filter === 'sale' && !product.originalPrice) return false
      if (filter === 'premium' && product.category !== 'premium') return false
      if (filter === 'inverno' && product.category !== 'inverno') return false
      if (filter === 'verao' && product.category !== 'verao') return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          (product.tags && product.tags.some(tag => tag.toLowerCase().includes(query)))
        )
      }

      return true
    })
    .sort((a, b) => {
      if (sort === 'price') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'new') return b.isNew - a.isNew
      return a.name.localeCompare(b.name)
    })

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query) setSearchParams({ q: query })
    else setSearchParams({})
  }

  const clearFilters = () => {
    setFilter('all')
    setSort('name')
    setSearchQuery('')
    setSearchParams({})
  }

  const activeFiltersCount = [filter !== 'all', sort !== 'name', searchQuery].filter(Boolean).length

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 md:py-24 overflow-hidden">
        <div className="container-responsive text-center relative z-10">
  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
    <span className="text-gray-800 dark:text-white">Conforto que </span>
    <span className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">Transforma</span>
    <span className="text-gray-800 dark:text-white"> suas Noites</span>
  </h1>
  <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-6 md:mb-10 leading-relaxed max-w-3xl mx-auto px-4">
    Descubra pijamas premium que combinam <span className="font-semibold text-gray-800 dark:text-white">elegância, conforto</span> e qualidade excepcional.
  </p>
  <button className="group bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 px-6 py-4 md:px-12 md:py-5 rounded-xl md:rounded-2xl text-base md:text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
    Descobrir Coleção
  </button>
</div>
      </section>

      {/* PRODUTOS */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container-responsive">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3 md:mb-4">Coleção Exclusiva</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Descubra pijamas que combinam estilo, conforto e qualidade premium em cada detalhe
            </p>
          </div>

          {/* Search + Filters */}
          <div className="mb-6 md:mb-8 space-y-4">
            <ProductSearch onSearch={handleSearch} initialQuery={searchQuery} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {['all', 'new', 'sale', 'premium'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-lg font-semibold transition-all ${
                      filter === f
                        ? 'bg-gray-800 dark:bg-gray-300 text-white dark:text-gray-900'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {f === 'all' ? 'Todos' :
                     f === 'new' ? 'Novidades' :
                     f === 'sale' ? 'Promoções' : 'Premium'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 justify-center md:justify-start w-full md:w-auto">
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800">
                    Limpar ({activeFiltersCount})
                  </button>
                )}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-3 py-2 text-sm md:px-4 md:py-2 md:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  <option value="name">Ordenar: Nome</option>
                  <option value="price">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                  <option value="rating">Melhor Avaliado</option>
                  <option value="new">Novidades</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              {searchQuery && ` para "${searchQuery}"`}
            </div>
          </div>

          {/* Lista de produtos */}
          {isLoading ? (
            <ProductGridSkeleton count={6} />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <i className="fas fa-search text-4xl md:text-6xl text-gray-300 dark:text-gray-600 mb-3 md:mb-4"></i>
              <h3 className="text-lg md:text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-4 text-sm md:text-base">
                {searchQuery ? `Não encontramos resultados para "${searchQuery}"` : 'Tente ajustar os filtros'}
              </p>
              <button onClick={clearFilters} className="btn-primary text-sm md:text-base">
                <i className="fas fa-times mr-2"></i> Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ProductCard
                    product={product}
                    onAddToCart={onAddToCart}
                    user={user}
                    onLoginClick={onLoginClick}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home