import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 py-12 mt-20 transition-all duration-300">
      <div className="container mx-auto px-6">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12 mb-10">
          {/* Logo e descrição */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <img
                  src="/logo.jpg"
                  alt="Lunabê Logo"
                  className="w-14 h-14 rounded-xl object-contain shadow-lg border border-gray-200 dark:border-gray-700"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-xl opacity-20 blur-sm"></div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                Lunabê Pijamas
              </h3>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md leading-relaxed">
              Pijamas com conforto e elegância — feitos com carinho para transformar suas noites
              em momentos de aconchego.  
            </p>

            <div className="flex space-x-4 mt-4">
              {[
                { icon: 'facebook', color: 'text-blue-500' },
                { icon: 'instagram', color: 'text-pink-500' },
                { icon: 'tiktok', color: 'text-gray-900 dark:text-gray-100' },
                { icon: 'whatsapp', color: 'text-green-500' }
              ].map((s, i) => (
                <a
                  key={i}
                  href="#"
                  className={`text-gray-500 dark:text-gray-400 hover:${s.color} transition-all text-xl hover:scale-110`}
                >
                  <i className={`fab fa-${s.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">
              Links Rápidos
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/carrinho"
                  className="hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  Carrinho
                </Link>
              </li>
              <li>
                <Link
                  to="/minhas-compras"
                  className="hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  Minhas Compras
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">
              Contato
            </h4>
            <ul className="space-y-4 text-gray-600 dark:text-gray-400">
              <li className="flex items-start space-x-3">
                <i className="fas fa-phone mt-1 text-gray-500"></i>
                <div>
                  <p className="font-medium">(11) 9999-9999</p>
                  <p className="text-sm">Seg a Sex: 9h às 18h</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <i className="fas fa-envelope mt-1 text-gray-500"></i>
                <div>
                  <p className="font-medium">lunabepijamas@gmail.com</p>
                  <p className="text-sm">Respondemos em até 24h</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <i className="fas fa-map-marker-alt mt-1 text-gray-500"></i>
                <div>
                  <p className="font-medium">São Paulo, SP</p>
                  <p className="text-sm">Enviamos para todo o Brasil</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-3 md:mb-0">
            &copy; {currentYear} <span className="font-semibold text-gray-700 dark:text-gray-200">Lunabê Pijamas</span>.  
            Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Trocas e Devoluções
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
