import { useState } from 'react'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-24 right-6 z-50 space-y-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-2xl shadow-2xl border-l-4 min-w-80 backdrop-blur-sm transform transition-all duration-300 animate-slide-up ${
            toast.type === 'success' 
              ? 'bg-green-50/95 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300'
              : toast.type === 'error'
              ? 'bg-red-50/95 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300'
              : toast.type === 'warning'
              ? 'bg-yellow-50/95 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-300'
              : 'bg-blue-50/95 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <i className={`fas ${
              toast.type === 'success' 
                ? 'fa-check-circle text-green-500' 
                : toast.type === 'error'
                ? 'fa-exclamation-circle text-red-500'
                : toast.type === 'warning'
                ? 'fa-exclamation-triangle text-yellow-500'
                : 'fa-info-circle text-blue-500'
            } text-lg`}></i>
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  return { addToast, ToastContainer, removeToast }
}