import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
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
    const snapshot = await getDocs(collection(db, "products"));
    setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    if (loggedIn) fetchProducts();
  }, [loggedIn]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "products"), {
      ...form,
      price: parseFloat(form.price),
      sizes: form.sizes.split(",").map((s) => s.trim()),
      colors: form.colors.split(",").map((c) => c.trim()),
      createdAt: new Date(),
    });

    alert("✅ Produto adicionado!");
    setForm({
      name: "",
      description: "",
      price: "",
      image: "",
      sizes: "",
      colors: "",
    });
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja remover este produto?")) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  // Tela de Login
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-10 w-full max-w-md text-center border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Painel Administrativo
          </h2>
          <p className="text-gray-500 mb-6">
            Digite a senha de administrador para continuar.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de admin"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 mb-6 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // Painel de Produtos
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
          🛍️ Painel de Produtos Lunabê
        </h1>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <input
            type="text"
            name="name"
            placeholder="Nome do produto"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <textarea
            name="description"
            placeholder="Descrição"
            value={form.description}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <input
            type="number"
            name="price"
            placeholder="Preço"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <input
            type="text"
            name="image"
            placeholder="URL da imagem"
            value={form.image}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <input
            type="text"
            name="sizes"
            placeholder="Tamanhos (separados por vírgula)"
            value={form.sizes}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <input
            type="text"
            name="colors"
            placeholder="Cores (separadas por vírgula)"
            value={form.colors}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200"
          >
            Adicionar Produto
          </button>
        </form>

        {/* Lista de Produtos */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Produtos Cadastrados
        </h2>
        {products.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6">
            Nenhum produto cadastrado ainda.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  {product.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-300 text-sm line-clamp-2">
                  {product.description}
                </p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-2">
                  R$ {product.price.toFixed(2)}
                </p>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-all"
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
