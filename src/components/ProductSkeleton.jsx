import React from 'react'

const ProductSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-100 dark:border-gray-700">
      <div className="h-48 sm:h-56 md:h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 relative shimmer">
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-12 h-4 sm:w-16 sm:h-6 bg-gray-300/50 dark:bg-gray-600/50 rounded-full"></div>
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-10 h-4 sm:w-12 sm:h-6 bg-gray-300/50 dark:bg-gray-600/50 rounded-lg"></div>
      </div>
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="h-4 sm:h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        
        {/* Size and Color Skeletons */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="flex space-x-1 sm:space-x-2">
            {[1, 2, 3].map(item => (
              <div key={item} className="w-6 h-4 sm:w-8 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="flex space-x-1 sm:space-x-2">
            {[1, 2, 3].map(item => (
              <div key={item} className="w-6 h-4 sm:w-8 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-2 space-y-2 sm:space-y-0">
          <div className="h-5 sm:h-7 bg-gray-300 dark:bg-gray-600 rounded w-16 sm:w-20"></div>
          <div className="h-8 sm:h-10 bg-gray-300 dark:bg-gray-600 rounded-lg sm:rounded-xl w-20 sm:w-24"></div>
        </div>
      </div>
    </div>
  )
}

export const ProductGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  )
}

export const ProductDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
        {/* Image Skeleton */}
        <div className="space-y-3 md:space-y-4">
          <div className="h-64 sm:h-80 md:h-96 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl md:rounded-2xl shimmer animate-pulse"></div>
          <div className="flex space-x-2 overflow-x-auto">
            {[1, 2, 3].map(item => (
              <div key={item} className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg flex-shrink-0 shimmer animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Info Skeleton */}
        <div className="space-y-4 md:space-y-6">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/4 shimmer animate-pulse"></div>
          <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-3/4 shimmer animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-full shimmer animate-pulse"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-2/3 shimmer animate-pulse"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-4/5 shimmer animate-pulse"></div>
          </div>
          
          <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl shimmer animate-pulse"></div>
          
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/3 shimmer animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(item => (
              <div key={item} className="w-12 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded shimmer animate-pulse"></div>
            ))}
          </div>

          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/3 shimmer animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map(item => (
              <div key={item} className="w-16 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded shimmer animate-pulse"></div>
            ))}
          </div>

          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/4 shimmer animate-pulse"></div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg shimmer animate-pulse"></div>
            <div className="h-8 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded shimmer animate-pulse"></div>
            <div className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg shimmer animate-pulse"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl flex-1 shimmer animate-pulse"></div>
            <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl flex-1 shimmer animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductSkeleton