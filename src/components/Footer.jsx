import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  // Links das redes sociais
  const socialLinks = [
    { 
      icon: 'facebook', 
      color: 'hover:text-blue-500',
      url: 'https://facebook.com/lunabepijamas',
      label: 'Facebook Lunabê'
    },
    { 
      icon: 'instagram', 
      color: 'hover:text-pink-500',
      url: 'https://instagram.com/lunabepijamas',
      label: 'Instagram Lunabê'
    },
    { 
      icon: 'tiktok', 
      color: 'hover:text-gray-900 dark:hover:text-gray-100',
      url: 'https://tiktok.com/@lunabepijamas',
      label: 'TikTok Lunabê'
    },
    { 
      icon: 'whatsapp', 
      color: 'hover:text-green-500',
      url: 'https://wa.me/5511999999999',
      label: 'WhatsApp Lunabê'
    }
  ]

  // Links de políticas
  const policyLinks = [
    { name: 'Política de Privacidade', url: '/politica-privacidade' },
    { name: 'Termos de Uso', url: '/termos-uso' },
    { name: 'Trocas e Devoluções', url: '/trocas-devolucoes' }
  ]

  return (
    <footer className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 py-8 md:py-12 mt-20 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-10">
          {/* Logo e descrição */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
              <div className="relative flex justify-center sm:justify-start">
                <img
                  src="/logo.jpg"
                  alt="Lunabê Logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain shadow-lg border border-gray-200 dark:border-gray-700"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-xl opacity-20 blur-sm"></div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                  Lunabê Pijamas
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Conforto e elegância para suas noites
                </p>
              </div>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md leading-relaxed text-sm sm:text-base text-center sm:text-left">
              Pijamas com conforto e elegância — feitos com carinho para transformar suas noites
              em momentos de aconchego.  
            </p>

            <div className="flex justify-center sm:justify-start space-x-4 mt-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-500 dark:text-gray-400 ${social.color} transition-all text-lg sm:text-xl hover:scale-110`}
                  aria-label={social.label}
                  title={social.label}
                >
                  <i className={`fab fa-${social.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">
              Links Rápidos
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { to: "/", label: "Início" },
                { to: "/carrinho", label: "Carrinho" },
                { to: "/minhas-compras", label: "Minhas Compras" },
                { to: "/contato", label: "Contato" }
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="hover:text-gray-900 dark:hover:text-white transition-all text-sm sm:text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">
              Contato
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-gray-600 dark:text-gray-400">
              <li className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <i className="fas fa-phone text-gray-500 text-sm"></i>
                  <div>
                    <a 
                      href="tel:+5511999999999" 
                      className="font-medium text-sm sm:text-base hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      (11) 99999-9999
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Seg a Sex: 9h às 18h</p>
                  </div>
                </div>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <i className="fas fa-envelope text-gray-500 text-sm"></i>
                  <div>
                    <a 
                      href="mailto:lunabepijamas@gmail.com"
                      className="font-medium text-sm sm:text-base hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      lunabepijamas@gmail.com
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Respondemos em até 24h</p>
                  </div>
                </div>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <i className="fas fa-map-marker-alt text-gray-500 text-sm"></i>
                  <div>
                    <p className="font-medium text-sm sm:text-base">São Paulo, SP</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enviamos para todo o Brasil</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-3 md:mb-0 text-center md:text-left text-xs sm:text-sm">
            &copy; {currentYear} <span className="font-semibold text-gray-700 dark:text-gray-200">Lunabê Pijamas</span>.  
            Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
            {policyLinks.map((policy, index) => (
              <Link 
                key={index} 
                to={policy.url}
                className="hover:text-gray-900 dark:hover:text-white transition-colors text-xs sm:text-sm"
              >
                {policy.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer