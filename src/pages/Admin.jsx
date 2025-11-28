import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from '../api'
import { getFullImageUrl } from '../utils/image'

const API_URL = `${API_BASE}/api/products`;

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: null,
    sizes: "",
    colors: "",
  });

  const adminPassword = "lunabe25";

  const handleLogin = () => {
    if (password === adminPassword) {
      setLoggedIn(true);
    } else {
      alert("Senha incorreta!");
    }
  };

  const fetchProducts = async () => {
    const res = await axios.get(API_URL);
    setProducts(res.data);
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/orders/all`, { headers: { 'x-admin-key': adminPassword } });
      setOrders(res.data);
    } catch (err) {
      console.error('Erro ao buscar pedidos (admin):', err?.response?.data || err.message);
      alert('Não foi possível buscar os pedidos. Verifique a chave de admin no servidor.');
    }
  }

  useEffect(() => {
    if (loggedIn) {
      fetchProducts();
      fetchOrders();
    }
  }, [loggedIn]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price_cents", Number(form.price) * 100);
    formData.append("stock", 10);
    formData.append("sizes", form.sizes);
    formData.append("colors", form.colors);

    if (form.image) {
      formData.append("image", form.image);
    }

    await axios.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert("✅ Produto adicionado!");

    setForm({
      name: "",
      description: "",
      price: "",
      image: null,
      sizes: "",
      colors: "",
    });

    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja remover este produto?")) {
      await axios.delete(`${API_URL}/${id}`);
      fetchProducts();
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <div className="bg-white shadow-xl rounded-xl p-10 w-full max-w-sm text-center">
          <h2 className="text-3xl font-bold mb-4">Painel Administrativo</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha do admin"
            className="w-full p-3 mb-4 border rounded-lg"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-black text-white py-3 rounded-lg"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-left">🛍️ Painel Administrativo</h1>
          <div className="flex items-center space-x-2">
            <button onClick={()=>setShowOrders(false)} className={`px-3 py-1 rounded ${!showOrders? 'bg-black text-white' : 'bg-gray-200'}`}>Produtos</button>
            <button onClick={()=>setShowOrders(true)} className={`px-3 py-1 rounded ${showOrders? 'bg-black text-white' : 'bg-gray-200'}`}>Pedidos ({orders.length})</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <input
            type="text"
            name="name"
            placeholder="Nome do produto"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg"
          />

          <textarea
            name="description"
            placeholder="Descrição"
            value={form.description}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="number"
            name="price"
            placeholder="Preço"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({ ...form, image: e.target.files[0] })
            }
            className="w-full"
          />

          <input
            type="text"
            name="sizes"
            placeholder="Tamanhos separados por vírgula"
            value={form.sizes}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="text"
            name="colors"
            placeholder="Cores separadas por vírgula"
            value={form.colors}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg"
          >
            Adicionar Produto
          </button>
        </form>

        {!showOrders && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Produtos cadastrados</h2>

            {products.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum produto cadastrado.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
            {products.map((p) => (
              <div key={p._id} className="p-4 border rounded-lg bg-gray-50">
                <img
                  src={getFullImageUrl(p.images?.[0]) || '/placeholder.jpg'}
                  alt={p.name}
                  className="w-full h-48 object-cover rounded-lg mb-2"
                />
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {p.description}
                </p>
                <p className="text-lg font-semibold mt-2">
                  R$ {(p.price_cents / 100).toFixed(2)}
                </p>

                <button
                  onClick={() => handleDelete(p._id)}
                  className="w-full mt-3 bg-red-500 text-white py-2 rounded-lg"
                >
                  Excluir
                </button>
              </div>
            ))}
              </div>
            )}
          </>
        )}

        {showOrders && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Pedidos</h2>
            {orders.length === 0 ? (
              <p className="text-center text-gray-500">Nenhum pedido encontrado.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o._id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Pedido #{o._id.slice(-8)}</p>
                        <p className="text-sm text-gray-600">{o.email} • {new Date(o.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-sm">
                        <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800">{o.status}</span>
                      </div>
                    </div>

                    {o.address && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-700 border border-gray-100 rounded">
                        <p className="font-medium">{o.address.name} • {o.address.phone}</p>
                        <p className="text-sm text-gray-600">{o.address.street}</p>
                        <p className="text-sm text-gray-600">{o.address.city} — {o.address.state} • {o.address.zip} — {o.address.country}</p>
                      </div>
                    )}

                    <div className="mt-3">
                      <h4 className="font-semibold">Itens</h4>
                      <ul className="mt-2">
                        {o.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between py-1 border-b last:border-b-0">
                            <span>{it.name} x{it.quantity}</span>
                            <span>R$ {(it.price * it.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 flex items-center space-x-2">
                      <select defaultValue={o.status} id={`status-${o._id}`} className="p-2 border rounded" >
                        <option> Aguardando pagamento </option>
                        <option> Processando </option>
                        <option> Enviado </option>
                        <option> Pago </option>
                        <option> Entregue </option>
                      </select>
                      <button onClick={async (e)=>{
                        const sel = document.getElementById(`status-${o._id}`)
                        const value = sel?.value
                        try {
                          await axios.patch(`${API_BASE}/api/orders/${o._id}/status`, { status: value }, { headers: { 'x-admin-key': adminPassword } })
                          fetchOrders()
                          alert('Status atualizado')
                        } catch (err) { console.error(err); alert('Erro ao atualizar status') }
                      }} className="px-3 py-1 bg-blue-600 text-white rounded">Atualizar status</button>

                      <input id={`track-${o._id}`} placeholder="Tracking code" className="p-2 border rounded" />
                      <button onClick={async ()=>{
                        const t = document.getElementById(`track-${o._id}`)?.value
                        try {
                          await axios.patch(`${API_BASE}/api/orders/${o._id}/tracking`, { trackingCode: t }, { headers: { 'x-admin-key': adminPassword } })
                          fetchOrders()
                          alert('Tracking salvo')
                        } catch (err) { console.error(err); alert('Erro ao salvar tracking') }
                      }} className="px-3 py-1 bg-green-600 text-white rounded">Salvar tracking</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;