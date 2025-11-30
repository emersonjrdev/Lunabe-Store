import React from 'react'
import { Link } from 'react-router-dom'

const TermosUso = () => {
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
            Termos de Uso
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Aceitação dos Termos</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Ao acessar e utilizar o site da Lunabê Pijamas, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve utilizar nosso site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Uso do Site</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Você concorda em utilizar nosso site apenas para fins legais e de acordo com estes termos. É proibido:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Usar o site de forma fraudulenta ou enganosa</li>
                <li>Tentar acessar áreas restritas do site</li>
                <li>Interferir no funcionamento do site</li>
                <li>Reproduzir, copiar ou revender produtos sem autorização</li>
                <li>Usar dados coletados do site para fins comerciais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Conta de Usuário</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Ao criar uma conta, você é responsável por:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Manter a confidencialidade de suas credenciais de login</li>
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Notificar-nos imediatamente sobre uso não autorizado</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Produtos e Preços</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Nos esforçamos para garantir que as informações dos produtos sejam precisas, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Preços podem ser alterados sem aviso prévio</li>
                <li>Imagens dos produtos são meramente ilustrativas</li>
                <li>Reservamo-nos o direito de limitar quantidades</li>
                <li>Produtos sujeitos à disponibilidade de estoque</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Pagamentos</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Aceitamos pagamentos via PIX através do AbacatePay. Todos os pagamentos são processados de forma segura. Você é responsável por fornecer informações de pagamento precisas e atualizadas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Entrega</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                As entregas são realizadas pelos Correios ou transportadoras parceiras. Prazos estimados:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Regiões metropolitanas: 2-5 dias úteis</li>
                <li>Interior: 5-10 dias úteis</li>
                <li>Prazos podem variar conforme localidade</li>
                <li>Frete grátis para compras acima de R$ 150,00</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Propriedade Intelectual</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Todo o conteúdo do site, incluindo textos, gráficos, logos, imagens e software, é propriedade da Lunabê Pijamas ou de seus licenciadores e está protegido por leis de direitos autorais e outras leis de propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Limitação de Responsabilidade</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                A Lunabê Pijamas não será responsável por danos indiretos, incidentais ou consequenciais resultantes do uso ou incapacidade de usar o site, incluindo perda de dados ou lucros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Modificações dos Termos</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas através do site. O uso continuado do site após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Lei Aplicável</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais competentes de São Paulo, SP.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Contato</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Para questões sobre estes termos, entre em contato:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>E-mail:</strong> lunabepijamas@gmail.com
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Telefone:</strong> (11) 99999-9999
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermosUso

