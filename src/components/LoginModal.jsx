import React, { useState, useEffect, useRef } from 'react'
import { initGoogleIdentity, promptGoogle } from '../services/googleAuth'
import { API_BASE, login, register } from '../api'

const LoginModal = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Detectar se é mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const fallbackTimerRef = useRef(null);
  const credentialReceivedRef = useRef(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      credentialReceivedRef.current = false; // Reset flag

      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        alert('Google Client ID não configurado (VITE_GOOGLE_CLIENT_ID). Verifique .env');
        setIsLoading(false);
        return;
      }

      // Trigger the Google Identity prompt (handles mobile & desktop)
      try {
        promptGoogle();
      } catch (err) {
        console.warn('promptGoogle falhou — usando fallback popup', err);
        fallbackPopup(import.meta.env.VITE_GOOGLE_CLIENT_ID);
        return;
      }

      // If the prompt doesn't produce a credential (FedCM or prompt failed silently),
      // open the popup fallback after a longer wait. If credential arrives earlier we'll clear it.
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => {
        // Only open fallback if we haven't received a credential yet
        if (!credentialReceivedRef.current) {
          console.log('Google prompt demorou — abrindo popup alternativo');
          fallbackPopup(import.meta.env.VITE_GOOGLE_CLIENT_ID);
        }
      }, 6000); // Aumentado de 4s para 6s
    } catch (error) {
      console.error("Erro ao logar com Google:", error)
      setIsLoading(false)
      
      if (error.message?.includes('initialized')) {
        // ignore
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
    
    try {
      let response;
      
      if (isLogin) {
        // Fazer login real
        response = await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        // Fazer registro real
        response = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      }

      if (response.error) {
        // Erro retornado pela API
        setErrors({ submit: response.error });
        alert(response.error);
        setIsLoading(false);
        return;
      }

      if (response.token && response.user) {
        // Login/Registro bem-sucedido
        localStorage.setItem('lunabe-token', response.token);
        localStorage.setItem('lunabe-user', JSON.stringify(response.user));
        
        onLogin({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          token: response.token
        });
        
        // Limpar formulário
        setFormData({ email: '', password: '', name: '', confirmPassword: '' });
      } else {
        // Resposta inesperada
        setErrors({ submit: 'Erro inesperado. Tente novamente.' });
        alert('Erro inesperado. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao fazer login/registro:', error);
      const errorMessage = error.message || 'Erro ao conectar com o servidor. Verifique sua conexão.';
      setErrors({ submit: errorMessage });
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    let initialized = false;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    initGoogleIdentity(clientId, async (resp) => {
      // resp.credential é o id_token (JWT)
      if (!resp?.credential) return;
      
      // Mark that we received a credential
      credentialReceivedRef.current = true;
      
      // Cancel popup fallback since we got the credential
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: resp.credential })
        });

        const json = await res.json();
        if (res.ok) {
          // store server token & user
          localStorage.setItem('lunabe-token', json.token);
          const merged = { id: json.user.id, email: json.user.email, name: json.user.name, serverId: json.user.id };
          localStorage.setItem('lunabe-user', JSON.stringify(merged));
          onLogin(merged);
          onClose();
        } else {
          alert('Erro ao autenticar no servidor: ' + (json.error || JSON.stringify(json)));
        }
      } catch (err) {
        console.error('Erro ao chamar /api/auth/google:', err);
        alert('Erro ao autenticar com Google');
      } finally {
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('Erro ao inicializar Google Identity:', err);
    });

    // fallback handler for popup redirect
    const onMessage = async (evt) => {
      try {
        if (evt.origin !== window.location.origin) return;
        const data = evt.data || {};
        if (data.type !== 'google-id-token') return;
        const idToken = data.idToken;
        if (!idToken) return;

        // Mark that we received a credential
        credentialReceivedRef.current = true;
        
        // Clear fallback timer if set
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }

        setIsLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
          const json = await res.json();
          if (res.ok) {
            localStorage.setItem('lunabe-token', json.token);
            const merged = { id: json.user.id, email: json.user.email, name: json.user.name, serverId: json.user.id };
            localStorage.setItem('lunabe-user', JSON.stringify(merged));
            onLogin(merged);
            onClose();
          } else {
            alert('Erro ao autenticar no servidor: ' + (json.error || JSON.stringify(json)));
          }
        } catch (err) {
          console.error('Erro no fallback auth:', err);
          alert('Erro ao autenticar com Google (fallback)');
        } finally {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('message handler error', err);
      }
    };

    window.addEventListener('message', onMessage);

    return () => {
      initialized = false;
      window.removeEventListener('message', onMessage);
    };
  }, []);

  // Fallback popup route — opens Google OAuth2 endpoint which will redirect to /google-redirect
  const fallbackPopup = (clientId) => {
    const redirectUri = `${window.location.origin}/google-redirect`;
    const nonce = Math.random().toString(36).slice(2);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'id_token');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('prompt', 'select_account');

    const popup = window.open(url.toString(), 'google_oauth', 'width=600,height=700');
    if (!popup) {
      alert('Não foi possível abrir a janela de login. Permita popups e tente novamente.');
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
                {/* If you want to render the auto button uncomment below; we prefer a custom button that triggers the prompt */}
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