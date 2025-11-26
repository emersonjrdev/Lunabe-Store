import React, { useState, useEffect } from "react";

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_cents: "",
    stock: "",
    image: null,
  });

  const adminPassword = "lunabe25";

  const handleLogin = () => {
    if (password === adminPassword) {
      setLoggedIn(true);
    } else {
      alert("Senha incorreta!");
    }
  };

  // GET PRODUCTS DO SEU BACKEND
  const fetchProducts = async () => {
    const res = await fetch("https://api.lunabe.com.br/products");
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    if (loggedIn) fetchProducts();
  }, [loggedIn]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // CREATE PRODUCT (ENVIO DA IMAGEM LOCAL)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("price_cents", form.price_cents);
    fd.append("stock", form.stock);

    if (form.image) {
      fd.append("image", form.image);
    }

    const res = await fetch("https://api.lunabe.com.br/products", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      alert("Erro ao criar produto");
      return;
    }

    alert("Produto criado com sucesso!");

    setForm({
      name: "",
      description: "",
      price_cents: "",
      stock: "",
      image: null,
    });

    fetchProducts();
  };

  // DELETE PRODUCT
  const handleDelete = async (id) => {
    if (window.confirm("Deseja remover este produto?")) {
      await fetch(`https://api.lunabe.com.br/products/${id}`, {
        method: "DELETE",
      });
      fetchProducts();
    }
  };

  // LOGIN
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

  // PAINEL
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
            name="price_cents"
            placeholder="Preço (centavos)"
            value={form.price_cents}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="number"
            name="stock"
            placeholder="Estoque"
            value={form.stock}
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

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg"
          >
            Adicionar Produto
          </button>
        </form>

        {/* LISTA */}
        <h2 className="text-2xl font-semibold mb-4">Produtos cadastrados</h2>

        {products.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum produto cadastrado.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((p) => (
              <div key={p._id} className="p-4 border rounded-lg bg-gray-50">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                )}
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
