import React from 'react'
import { Link } from 'react-router-dom'

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-10 border border-gray-200 dark:border-gray-700">
          <Link 
            to="/" 
            className="inline-flex items-center text-lunabe-pink hover:text-pink-600 dark:hover:text-pink-400 mb-6 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Voltar à loja
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Política de Privacidade
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introdução</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                A Lunabê Pijamas ("nós", "nosso" ou "empresa") está comprometida em proteger a privacidade e os dados pessoais de nossos clientes. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nosso site e serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Informações que Coletamos</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Coletamos as seguintes informações quando você utiliza nossos serviços:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Dados de Cadastro:</strong> Nome, e-mail, senha (criptografada)</li>
                <li><strong>Dados de Compra:</strong> Endereço de entrega, telefone, informações de pagamento</li>
                <li><strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador, páginas visitadas</li>
                <li><strong>Dados de Autenticação:</strong> Informações do Google OAuth (quando você faz login com Google)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Como Utilizamos suas Informações</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Utilizamos suas informações pessoais para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Processar e entregar seus pedidos</li>
                <li>Comunicar sobre o status dos pedidos e envios</li>
                <li>Enviar notificações importantes sobre sua conta</li>
                <li>Melhorar nossos produtos e serviços</li>
                <li>Prevenir fraudes e garantir a segurança</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Compartilhamento de Informações</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Não vendemos suas informações pessoais. Compartilhamos dados apenas com:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Provedores de Pagamento:</strong> AbacatePay para processar pagamentos</li>
                <li><strong>Serviços de Entrega:</strong> Empresas de logística para envio dos produtos</li>
                <li><strong>Prestadores de Serviços:</strong> Cloudinary (imagens), Google (autenticação)</li>
                <li><strong>Autoridades Legais:</strong> Quando exigido por lei</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Segurança dos Dados</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados pessoais, incluindo criptografia, autenticação segura e controle de acesso. No entanto, nenhum método de transmissão pela internet é 100% seguro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Seus Direitos (LGPD)</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar anonimização, bloqueio ou eliminação de dados</li>
                <li>Solicitar portabilidade dos dados</li>
                <li>Revogar seu consentimento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Cookies e Tecnologias Similares</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do site e personalizar conteúdo. Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Retenção de Dados</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Alterações nesta Política</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas através do nosso site ou por e-mail.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Contato</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>E-mail:</strong> lunabepijamas@gmail.com
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Telefone:</strong> (11) 99999-9999
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Horário de atendimento:</strong> Segunda a Sexta, das 9h às 18h
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoliticaPrivacidade

