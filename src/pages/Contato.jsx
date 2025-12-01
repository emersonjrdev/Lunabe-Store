import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../hooks/useToast'

const Contato = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulação de envio (você pode integrar com um serviço de email real)
    setTimeout(() => {
      addToast('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link 
          to="/" 
          className="inline-flex items-center text-lunabe-pink hover:text-pink-600 dark:hover:text-pink-400 mb-6 transition-colors"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Voltar à loja
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Informações de Contato */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-10 border border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Entre em Contato
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Estamos aqui para ajudar! Fale conosco através dos canais abaixo.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-lunabe-pink/10 dark:bg-lunabe-pink/20 rounded-full p-3">
                  <i className="fas fa-envelope text-lunabe-pink text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">E-mail</h3>
                  <a 
                    href="mailto:lunabepijamas@gmail.com"
                    className="text-gray-700 dark:text-gray-300 hover:text-lunabe-pink transition-colors"
                  >
                    lunabepijamas@gmail.com
                  </a>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Respondemos em até 24 horas
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-lunabe-pink/10 dark:bg-lunabe-pink/20 rounded-full p-3">
                  <i className="fas fa-phone text-lunabe-pink text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Telefone</h3>
                  <a 
                    href="tel:+5511999999999"
                    className="text-gray-700 dark:text-gray-300 hover:text-lunabe-pink transition-colors"
                  >
                    (11) 99999-9999
                  </a>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Segunda a Sexta, das 9h às 18h
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-lunabe-pink/10 dark:bg-lunabe-pink/20 rounded-full p-3">
                  <i className="fas fa-map-marker-alt text-lunabe-pink text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Localização</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    São Paulo, SP
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Enviamos para todo o Brasil
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-lunabe-pink/10 dark:bg-lunabe-pink/20 rounded-full p-3">
                  <i className="fab fa-whatsapp text-lunabe-pink text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">WhatsApp</h3>
                  <a 
                    href="https://wa.me/5511999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 dark:text-gray-300 hover:text-lunabe-pink transition-colors"
                  >
                    (11) 99999-9999
                  </a>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Atendimento rápido via WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Siga-nos nas Redes Sociais</h3>
              <div className="flex space-x-4">
                <a 
                  href="https://instagram.com/lunabepijamas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a 
                  href="https://facebook.com/lunabepijamas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a 
                  href="https://tiktok.com/@lunabepijamas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center text-white dark:text-gray-900 hover:scale-110 transition-transform"
                  aria-label="TikTok"
                >
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Formulário de Contato */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-10 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Envie sua Mensagem
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Assunto *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white"
                >
                  <option value="">Selecione um assunto</option>
                  <option value="duvida">Dúvida sobre produto</option>
                  <option value="pedido">Status do pedido</option>
                  <option value="troca">Troca ou devolução</option>
                  <option value="sugestao">Sugestão</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Mensagem *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-lunabe-pink focus:border-transparent transition-all text-gray-800 dark:text-white resize-none"
                  placeholder="Escreva sua mensagem aqui..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-lunabe-pink to-pink-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Enviar Mensagem
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contato





