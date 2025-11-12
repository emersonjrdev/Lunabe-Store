import React, { useState } from 'react'
import { auth, googleProvider } from '../firebase'
import { signInWithPopup } from 'firebase/auth'

const LoginModal = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

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
    await new Promise((resolve) => setTimeout(resolve, 1200))

    if (isLogin) {
      onLogin({ email: formData.email, name: formData.email.split('@')[0], id: Date.now() })
    } else {
      onLogin({ email: formData.email, name: formData.name, id: Date.now() })
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      onLogin({
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        photo: user.photoURL
      })

      setIsLoading(false)
      onClose()
    } catch (error) {
      console.error("Erro ao logar com Google:", error)
      setIsLoading(false)
      alert("Erro ao tentar login com Google.")
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleClose = () => {
    if (!isLoading) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full animate-slide-up border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <button onClick={handleClose} disabled={isLoading} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl transition-colors disabled:opacity-50">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Formulário padrão */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-lunabe-pink ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                disabled={isLoading}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                placeholder="Sua senha"
                disabled={isLoading}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  placeholder="Confirme sua senha"
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 rounded-xl ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 px-6 py-4 rounded-xl font-semibold"
            >
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Ou continue com
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium transition-all"
              >
                <i className="fab fa-google text-red-500 mr-2"></i> Entrar com Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
