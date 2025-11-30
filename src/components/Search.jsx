import React, { useState, useEffect } from 'react'

const ProductSearch = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  const clearSearch = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="Buscar pijamas por nome, descrição ou tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 pl-10 pr-10 sm:pl-12 sm:pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-300 transition-all duration-300 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
        />
        <i className="fas fa-search absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base"></i>
        
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <i className="fas fa-times text-sm sm:text-base"></i>
          </button>
        )}
      </form>
    </div>
  )
}

export default ProductSearch