import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AddProduct() {
  const navigate = useNavigate()
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    sizes: '',
    colors: '',
    stock: '',
    rating: 5,
    reviews: 0,
    isNew: true,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setProduct(prev => ({ ...prev, [name]: value }))
  }

  // Page deprecated — product creation now handled via the Admin panel that uses the server API.
  useEffect(()=>{
    alert('Página removida: use o Painel Administrativo (/admin) para adicionar produtos')
    navigate('/admin')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Adicionar Novo Produto</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Nome', name: 'name', type: 'text' },
            { label: 'Descrição', name: 'description', type: 'text' },
            { label: 'Preço', name: 'price', type: 'number' },
            { label: 'Preço Original (opcional)', name: 'originalPrice', type: 'number' },
            { label: 'Imagem (URL)', name: 'image', type: 'text' },
            { label: 'Tamanhos (separados por vírgula)', name: 'sizes', type: 'text' },
            { label: 'Cores (separadas por vírgula)', name: 'colors', type: 'text' },
            { label: 'Estoque', name: 'stock', type: 'number' },
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg">Página descontinuada — redirecionando para o painel administrativo...</p>
              </div>
            </div>
          )
        }
