import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PaymentService from '../services/paymentService'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await PaymentService.getOrderById(id)
        setOrder(data)
      } catch (err) {
        console.error('Erro ao buscar pedido:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  if (loading) return <div className="text-center py-20">Carregando pedido...</div>
  if (!order) return <div className="text-center py-20">Pedido não encontrado</div>

  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-6">Acompanhar Pedido #{order._id.slice(-6).toUpperCase()}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        {order.address && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
            <h3 className="font-semibold mb-2">Endereço de entrega</h3>
            <p>{order.address.name}</p>
            <p>{order.address.street}</p>
            <p>{order.address.city} — {order.address.state} • {order.address.zip}</p>
            <p>{order.address.country} {order.address.phone && `• ${order.address.phone}`}</p>
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500">Realizado em {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
            <p className="font-semibold">Email: {order.email}</p>
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-sm ${order.status === 'Pago' || order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-4">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{it.name}</p>
                <p className="text-sm text-gray-500">Quantidade: {it.quantity}</p>
              </div>
              <div className="font-semibold">R$ {(it.price * it.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Stripe Session: {order.stripeSessionId}</p>
          </div>
          <div className="text-lg font-bold">Total: R$ {order.total?.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-6">
        <Link to="/minhas-compras" className="btn-secondary">Voltar às minhas compras</Link>
      </div>
    </div>
  )
}
