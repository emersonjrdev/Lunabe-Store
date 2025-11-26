import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://lunabe-store.onrender.com/products"; // seu backend no Render

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);

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
    if (password === adminPassword) setLoggedIn(true);
    else alert("Senha incorreta!");
  };

  const fetchProducts = async () => {
    const res = await axios.get(API_URL);
    setProducts(res.data);
  };

  useEffect(() => {
    if (loggedIn) fetchProducts();
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

    alert("Produto criado!");

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
    if (!window.confirm("Deseja apagar?")) return;
    await axios.delete(`${API_URL}/${id}`);
    fetchProducts();
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <div className="bg-white p-8 shadow-xl w-full max-w-sm rounded-xl">
          <h2 className="text-center text-2xl mb-4 font-bold">Admin Lunabê</h2>
          <input
            type="password"
            className="w-full p-3 border rounded-lg mb-4"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-8 shadow-xl rounded-xl">
        <h1 className="text-3xl font-bold text-center mb-6">Painel Administrativo</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <input type="text" name="name" placeholder="Nome" className="input" value={form.name} onChange={handleChange} required />

          <textarea name="description" placeholder="Descrição" className="input" value={form.description} onChange={handleChange} required />

          <input type="number" name="price" placeholder="Preço" className="input" value={form.price} onChange={handleChange} required />

          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />

          <input type="text" name="sizes" placeholder="Tamanhos (P,M,G...)" className="input" value={form.sizes} onChange={handleChange} />

          <input type="text" name="colors" placeholder="Cores (preto, branco, ...)" className="input" value={form.colors} onChange={handleChange} />

          <button type="submit" className="w-full bg-black text-white py-3 rounded-lg">
            Adicionar Produto
          </button>
        </form>

        <h2 className="text-xl font-bold mb-4">Produtos cadastrados</h2>

        {products.length === 0 ? (
          <p>Nenhum produto ainda.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((p) => (
              <div key={p._id} className="p-4 bg-gray-50 rounded-lg shadow">
                <img src={p.images?.[0]} className="w-full h-48 object-cover rounded mb-2" />
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-gray-600">{p.description}</p>
                <p className="font-bold mt-2">R$ {(p.price_cents / 100).toFixed(2)}</p>
                <button onClick={() => handleDelete(p._id)} className="w-full bg-red-500 text-white mt-3 py-2 rounded-lg">
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
