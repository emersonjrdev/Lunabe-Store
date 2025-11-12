import React, { useState, useEffect } from 'react'

const ProductSearch = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const popularSearches = [
    'seda', 'algodão', 'inverno', 'verão', 'família', 
    'premium', 'camisola', 'short', 'conforto'
  ]

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    if (query.length > 2) {
      const filtered = popularSearches.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    onSearch(suggestion)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setQuery('')
    onSearch('')
    setShowSuggestions(false)
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="Buscar pijamas por nome, descrição ou tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setShowSuggestions(true)}
          className="w-full px-6 py-4 pl-12 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-300 transition-all duration-300 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl mt-2 z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
              Sugestões de busca
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 flex items-center space-x-3"
              >
                <i className="fas fa-search text-gray-400 text-sm"></i>
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Searches */}
      {!query && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
            Buscas populares:
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(search)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductSearch