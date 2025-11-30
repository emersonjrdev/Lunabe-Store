import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const Header = ({ cartCount, user, onLogout, onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navegar para a home com o parâmetro de busca
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsMenuOpen(false) // Fechar menu mobile se estiver aberto
    }
  }

  const handleLogout = () => {
    onLogout()
    setIsMenuOpen(false)
  }

  const handleLogoDoubleClick = () => {
    navigate('/admin')
  }

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg py-3 md:py-4 fixed top-0 w-full z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo e Menu Mobile */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>

          {/* Logo */}
          <div
            onDoubleClick={handleLogoDoubleClick}
            className="flex items-center space-x-2 md:space-x-3 group cursor-pointer"
          >
            <div className="relative">
              <img
                className="w-10 h-10 md:w-14 md:h-14 object-contain rounded-lg md:rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                src="/logo.jpg"
                alt="Lunabê Logo"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg md:rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                Lunabê
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
                Pijamas & Conforto
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-300 transition-all duration-300 text-sm md:text-base"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </form>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {['/', '/carrinho'].map((path) => (
            <Link
              key={path}
              to={path}
              className={`font-semibold transition-all duration-300 hover:text-gray-800 dark:hover:text-white hover:scale-105 text-sm lg:text-base ${
                location.pathname === path
                  ? 'text-gray-800 dark:text-white border-b-2 border-gray-700 dark:border-gray-300 transform scale-105'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {path === '/' ? 'Início' : 'Carrinho'}
            </Link>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Search Mobile */}
          <button className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300">
            <i className="fas fa-search text-lg"></i>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 md:p-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300"
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-lg md:text-xl`}></i>
          </button>

          {/* Cart - só mostrar contador se usuário estiver logado */}
          <Link to="/carrinho" className="relative p-2 md:p-3 group">
            <div className="relative">
              <i className="fas fa-shopping-cart text-lg md:text-xl text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-all duration-300 group-hover:scale-110"></i>
              {user && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 text-xs rounded-full w-4 h-4 md:w-6 md:h-6 flex items-center justify-center font-bold shadow-lg animate-bounce text-[10px] md:text-xs">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center space-x-2 md:space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-3 py-2 md:px-4 md:py-2 rounded-xl md:rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-200 rounded-full flex items-center justify-center text-white dark:text-gray-900 font-semibold shadow-lg text-sm md:text-base">
                  {(user?.name?.charAt(0) || user?.email?.charAt(0) || '?').toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate max-w-20 md:max-w-32">
                    {user.name || user.email || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Minha conta</p>
                </div>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 md:w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl md:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="px-3 md:px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.name || user.email || 'Usuário'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                <Link
                  to="/carrinho"
                  className="w-full text-left px-3 md:px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 md:space-x-3 text-sm md:text-base"
                >
                  <i className="fas fa-shopping-cart text-gray-400 dark:text-gray-500 w-4 md:w-5"></i>
                  <span>Meu Carrinho</span>
                </Link>
                <Link
                  to="/minhas-compras"
                  className="w-full text-left px-3 md:px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 md:space-x-3 text-sm md:text-base"
                >
                  <i className="fas fa-box text-gray-400 dark:text-gray-500 w-4 md:w-5"></i>
                  <span>Minhas Compras</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 md:px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2 md:space-x-3 text-sm md:text-base"
                >
                  <i className="fas fa-sign-out-alt text-red-400 dark:text-red-500 w-4 md:w-5"></i>
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 px-3 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg flex items-center space-x-2 group text-sm md:text-base"
            >
              <i className="fas fa-user group-hover:scale-110 transition-transform text-sm md:text-base"></i>
              <span className="hidden sm:inline">Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 py-4 px-4 animate-slide-down">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-300 transition-all duration-300"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </form>

          {/* Mobile Navigation */}
          <nav className="space-y-3">
            {['/', '/carrinho', '/minhas-compras'].map((path) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-3 px-4 rounded-xl transition-all duration-300 font-semibold ${
                  location.pathname === path
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {path === '/' ? 'Início' : path === '/carrinho' ? 'Carrinho' : 'Minhas Compras'}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header