import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://lunabe-store.onrender.com/products";

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
        <h1 className="text-3xl font-bold mb-8 text-center">🛍️ Produtos Lunabê</h1>

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

        <h2 className="text-2xl font-semibold mb-4">Produtos cadastrados</h2>

        {products.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum produto cadastrado.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((p) => (
              <div key={p._id} className="p-4 border rounded-lg bg-gray-50">
                <img
                  src={p.images?.[0]}
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
      </div>
    </div>
  );
};

export default Admin;