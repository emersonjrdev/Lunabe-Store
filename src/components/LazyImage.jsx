import React, { useState } from 'react'

const LazyImage = ({ src, alt, className, ...props }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg shimmer"></div>
      )}
      {hasError ? (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <i className="fas fa-image text-gray-400 dark:text-gray-600 text-2xl"></i>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  )
}

export default LazyImage