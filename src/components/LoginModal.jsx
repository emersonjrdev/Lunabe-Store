import React, { useState, useEffect } from 'react'
import { auth, googleProvider } from '../firebase'
import { signInWithPopup, signInWithRedirect } from 'firebase/auth'

const LoginModal = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Detectar se é mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      
      if (isMobile()) {
        // No mobile, usar redirect
        console.log('Iniciando redirect para mobile...')
        await signInWithRedirect(auth, googleProvider)
        // O App.jsx vai lidar com o resultado do redirect
      } else {
        // No desktop, usar popup
        const result = await signInWithPopup(auth, googleProvider)
        console.log('Login com popup bem-sucedido')
        // O App.jsx vai detectar a mudança via onAuthStateChanged
        onClose()
      }
    } catch (error) {
      console.error("Erro ao logar com Google:", error)
      setIsLoading(false)
      
      if (error.code === 'auth/popup-blocked') {
        alert('Popup bloqueado! Usando redirecionamento...')
        await signInWithRedirect(auth, googleProvider)
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Popup fechado pelo usuário')
      } else {
        alert('Erro ao fazer login com Google: ' + error.message)
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'E-mail inválido'
    if (!formData.password) newErrors.password = 'Senha é obrigatória'
    else if (formData.password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    if (!isLogin) {
      if (!formData.name) newErrors.name = 'Nome é obrigatório'
      else if (formData.name.length < 2) newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    
    // Simular login manual (sem Firebase)
    await new Promise((resolve) => setTimeout(resolve, 1200))

    if (isLogin) {
      onLogin({ 
        email: formData.email, 
        name: formData.email.split('@')[0], 
        id: Date.now().toString() 
      })
    } else {
      onLogin({ 
        email: formData.email, 
        name: formData.name, 
        id: Date.now().toString() 
      })
    }
    
    setIsLoading(false)
    // Limpar formulário
    setFormData({ email: '', password: '', name: '', confirmPassword: '' })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl max-w-md w-full animate-slide-up border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-8">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <button 
              onClick={handleClose} 
              disabled={isLoading} 
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-lg md:text-xl transition-colors disabled:opacity-50"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Formulário padrão */}
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  disabled={isLoading}
                  className={`w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-lunabe-pink text-sm md:text-base ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                {errors.name && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                disabled={isLoading}
                className={`w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-lg md:rounded-xl text-sm md:text-base ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                Senha
              </label>
              <input
                type="password"
                placeholder="Sua senha"
                disabled={isLoading}
                className={`w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-lg md:rounded-xl text-sm md:text-base ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              {errors.password && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  placeholder="Confirme sua senha"
                  disabled={isLoading}
                  className={`w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-lg md:rounded-xl text-sm md:text-base ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Processando...</span>
                </div>
              ) : (
                isLogin ? 'Entrar' : 'Cadastrar'
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-4 md:mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                  Ou continue com
                </span>
              </div>
            </div>

            <div className="mt-3 md:mt-4 grid grid-cols-1 gap-2 md:gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 md:py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none text-sm md:text-base"
              >
                <i className="fab fa-google text-red-500 mr-2"></i> 
                {isLoading ? 'Conectando...' : 'Entrar com Google'}
              </button>
            </div>
          </div>

          {/* Toggle entre Login e Cadastro */}
          <div className="mt-4 md:mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
              className="text-lunabe-pink hover:text-pink-600 dark:hover:text-pink-400 transition-colors text-sm md:text-base disabled:opacity-50"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>

          {/* Aviso para mobile */}
          {isMobile() && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                <i className="fas fa-info-circle mr-1"></i>
                No mobile, você será redirecionado para fazer login com Google
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginModal