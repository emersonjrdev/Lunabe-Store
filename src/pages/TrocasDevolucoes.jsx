import React from 'react'
import { Link } from 'react-router-dom'

const TrocasDevolucoes = () => {
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
            Política de Trocas e Devoluções
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Garantimos sua satisfação com nossos produtos
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4 flex items-center">
                <i className="fas fa-shield-alt mr-3"></i>
                Garantia de Satisfação
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Você tem <strong>7 dias corridos</strong> a partir da data de recebimento do produto para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor (CDC).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Condições para Trocas e Devoluções</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">
                    <i className="fas fa-check-circle mr-2"></i>
                    Produto pode ser trocado/devolvido se:
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Estiver com etiqueta original</li>
                    <li>Não tiver sido usado ou lavado</li>
                    <li>Estiver na embalagem original</li>
                    <li>Apresentar defeito de fabricação</li>
                    <li>Não corresponder à descrição do site</li>
                    <li>For enviado incorretamente (tamanho/cor diferente)</li>
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                  <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
                    <i className="fas fa-times-circle mr-2"></i>
                    Produto NÃO pode ser trocado/devolvido se:
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Já foi usado ou lavado</li>
                    <li>Está sem etiqueta original</li>
                    <li>Está danificado por uso inadequado</li>
                    <li>Passou do prazo de 7 dias</li>
                    <li>Foi personalizado ou alterado</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Como Solicitar Troca ou Devolução</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="bg-lunabe-pink text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
                    Entre em Contato
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Envie um e-mail para <strong>lunabepijamas@gmail.com</strong> ou ligue para <strong>(11) 99999-9999</strong> informando:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Número do pedido</li>
                    <li>Motivo da troca/devolução</li>
                    <li>Fotos do produto (se houver defeito)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="bg-lunabe-pink text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
                    Aguarde Aprovação
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Analisaremos sua solicitação em até <strong>2 dias úteis</strong> e enviaremos as instruções de envio.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="bg-lunabe-pink text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
                    Envie o Produto
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Envie o produto na embalagem original para o endereço que forneceremos. O frete de devolução é por conta do cliente, exceto em casos de defeito ou erro nosso.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="bg-lunabe-pink text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">4</span>
                    Receba o Reembolso/Troca
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Após recebermos e analisarmos o produto, processaremos o reembolso ou envio da troca em até <strong>5 dias úteis</strong>.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Formas de Reembolso</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 space-y-3">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-money-bill-wave text-lunabe-pink mt-1"></i>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">PIX</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reembolso em até 3 dias úteis</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-credit-card text-lunabe-pink mt-1"></i>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Cartão de Crédito</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reembolso em até 2 faturas (conforme operadora)</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Troca por Tamanho/Cor</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Se precisar trocar por outro tamanho ou cor:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>O produto deve estar em perfeito estado (sem uso)</li>
                <li>Você pode escolher outro tamanho ou cor do mesmo produto</li>
                <li>Se houver diferença de preço, será ajustado</li>
                <li>O frete da nova entrega é por nossa conta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Produtos com Defeito</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Se o produto apresentar defeito de fabricação:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Você tem até <strong>90 dias</strong> para reclamar (garantia legal)</li>
                <li>O frete de devolução é por nossa conta</li>
                <li>Enviaremos um produto novo ou reembolsaremos</li>
                <li>Envie fotos do defeito para análise rápida</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contato</h2>
              <div className="bg-lunabe-pink/10 dark:bg-lunabe-pink/20 rounded-lg p-5 space-y-3">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">E-mail:</strong> lunabepijamas@gmail.com
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Telefone:</strong> (11) 99999-9999
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Horário:</strong> Segunda a Sexta, das 9h às 18h
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrocasDevolucoes




