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
    <div className="fixed top-24 right-4 md:right-6 z-50 space-y-3 max-w-sm w-full md:w-auto">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 md:p-5 rounded-2xl shadow-2xl border-l-4 min-w-80 backdrop-blur-md transform transition-all duration-500 animate-slide-in-right relative overflow-hidden ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-green-100/80 dark:from-green-900/30 dark:to-green-800/20 border-green-500 text-green-800 dark:text-green-300'
              : toast.type === 'error'
              ? 'bg-gradient-to-r from-red-50 to-red-100/80 dark:from-red-900/30 dark:to-red-800/20 border-red-500 text-red-800 dark:text-red-300'
              : toast.type === 'warning'
              ? 'bg-gradient-to-r from-yellow-50 to-yellow-100/80 dark:from-yellow-900/30 dark:to-yellow-800/20 border-yellow-500 text-yellow-800 dark:text-yellow-300'
              : 'bg-gradient-to-r from-blue-50 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-500 text-blue-800 dark:text-blue-300'
          }`}
        >
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
            <div 
              className={`h-full ${
                toast.type === 'success' ? 'bg-green-500' :
                toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              } animate-shrink`}
              style={{ animationDuration: '4s' }}
            ></div>
          </div>
          
          <div className="flex items-start space-x-3 relative z-10">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              toast.type === 'success' ? 'bg-green-500/20 dark:bg-green-500/30' :
              toast.type === 'error' ? 'bg-red-500/20 dark:bg-red-500/30' :
              toast.type === 'warning' ? 'bg-yellow-500/20 dark:bg-yellow-500/30' :
              'bg-blue-500/20 dark:bg-blue-500/30'
            }`}>
              <i className={`fas ${
                toast.type === 'success' 
                  ? 'fa-check-circle text-green-600 dark:text-green-400' 
                  : toast.type === 'error'
                  ? 'fa-exclamation-circle text-red-600 dark:text-red-400'
                  : toast.type === 'warning'
                  ? 'fa-exclamation-triangle text-yellow-600 dark:text-yellow-400'
                  : 'fa-info-circle text-blue-600 dark:text-blue-400'
              } text-lg animate-scale-in`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm md:text-base leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:scale-110 p-1"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  return { addToast, ToastContainer, removeToast }
}