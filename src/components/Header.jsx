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
      console.log('Buscar por:', searchQuery)
    }
  }

  const handleLogout = () => {
    onLogout()
    setIsMenuOpen(false)
  }

  // 👉 Novo: clique duplo na logo abre /admin
  const handleLogoDoubleClick = () => {
    navigate('/admin')
  }

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg py-4 fixed top-0 w-full z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <div
          onDoubleClick={handleLogoDoubleClick}
          className="flex items-center space-x-3 group cursor-pointer"
        >
          <div className="relative">
            <img
              className="w-14 h-14 object-contain rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
              src="/logo.jpg"
              alt="Lunabê Logo"
            />
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
              Lunabê
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Pijamas & Conforto
            </p>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-300 transition-all duration-300"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </form>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className={`font-semibold transition-all duration-300 hover:text-gray-800 dark:hover:text-white hover:scale-105 ${
              location.pathname === '/'
                ? 'text-gray-800 dark:text-white border-b-2 border-gray-700 dark:border-gray-300 transform scale-105'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Início
          </Link>
          <Link
            to="/carrinho"
            className={`font-semibold transition-all duration-300 hover:text-gray-800 dark:hover:text-white hover:scale-105 ${
              location.pathname === '/carrinho'
                ? 'text-gray-800 dark:text-white border-b-2 border-gray-700 dark:border-gray-300 transform scale-105'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Carrinho
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all duration-300"
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
          </button>

          {/* Cart */}
          <Link to="/carrinho" className="relative p-3 group">
            <div className="relative">
              <i className="fas fa-shopping-cart text-xl text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-all duration-300 group-hover:scale-110"></i>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-bounce">
                  {cartCount}
                </span>
              )}
            </div>
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-4 py-2 rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                <div className="h-10 w-10 bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-200 rounded-full flex items-center justify-center text-white dark:text-gray-900 font-semibold shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Minha conta</p>
                </div>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                <Link
                  to="/carrinho"
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                >
                  <i className="fas fa-shopping-cart text-gray-400 dark:text-gray-500 w-5"></i>
                  <span>Meu Carrinho</span>
                </Link>
                <Link
  to="/minhas-compras"
  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
>
  <i className="fas fa-box text-gray-400 dark:text-gray-500 w-5"></i>
  <span>Minhas Compras</span>
</Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3"
                >
                  <i className="fas fa-sign-out-alt text-red-400 dark:text-red-500 w-5"></i>
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg flex items-center space-x-2 group"
            >
              <i className="fas fa-user group-hover:scale-110 transition-transform"></i>
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
