import React, { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...product,
        price: parseFloat(product.price),
        originalPrice: parseFloat(product.originalPrice) || null,
        stock: parseInt(product.stock),
        sizes: product.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: product.colors.split(',').map(c => c.trim()).filter(Boolean),
        createdAt: new Date()
      })
      alert("Produto cadastrado com sucesso!")
      navigate("/admin")
    } catch (error) {
      console.error("Erro ao adicionar produto:", error)
      alert("Erro ao cadastrar produto. Verifique o console.")
    }
  }

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
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={product[field.name]}
                onChange={handleChange}
                required={field.name !== 'originalPrice'}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-lunabe-pink text-white py-3 rounded-xl hover:opacity-90 transition font-semibold"
          >
            Salvar Produto
          </button>
        </form>
      </div>
    </div>
  )
}
