import React from 'react'

const ProductSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-100 dark:border-gray-700">
      <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 relative">
        <div className="absolute top-3 left-3 w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="absolute top-3 right-3 w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      </div>
      <div className="p-6 space-y-4">
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <div key={star} className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
          <div className="w-10 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-1"></div>
        </div>
        
        {/* Size and Color Skeletons */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="flex space-x-2">
            {[1, 2, 3].map(item => (
              <div key={item} className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="flex space-x-2">
            {[1, 2, 3].map(item => (
              <div key={item} className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-xl w-24"></div>
        </div>
      </div>
    </div>
  )
}

export const ProductGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  )
}

export const ProductDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Skeleton */}
        <div className="space-y-4">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="flex space-x-2">
            {[1, 2, 3].map(item => (
              <div key={item} className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>

        {/* Info Skeleton */}
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(item => (
              <div key={item} className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>

          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="flex space-x-2">
            {[1, 2, 3].map(item => (
              <div key={item} className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>

          <div className="flex space-x-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductSkeleton