// Normalize API_BASE and remove trailing slash to avoid accidental double slashes
export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:4001').replace(/\/$/, '');

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Erro ao buscar produtos');
  return res.json();
}

export async function fetchProduct(id) {
  const res = await fetch(`${API_BASE}/api/products/${id}`);
  if (!res.ok) throw new Error('Erro ao buscar produto');
  return res.json();
}

export async function register(payload) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  return res.json();
}

export async function login(payload) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  return res.json();
}

export async function createCheckout(items, customer) {
  const res = await fetch(`${API_BASE}/api/orders`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items, customer })});
  return res.json();
}
