import { getFullImageUrl } from './utils/image'

export function addToCart(product, qty=1) {
  const raw = localStorage.getItem('cart');
  let cart = raw ? JSON.parse(raw) : [];
  const idx = cart.findIndex(i=>i.id===product.id);
  if (idx>=0) cart[idx].quantity += qty; else cart.push({ id: product.id, name: product.name, price_cents: product.price_cents, image: getFullImageUrl(product.images && product.images[0]) || null, quantity: qty });
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function getCart() {
  return JSON.parse(localStorage.getItem('cart')||'[]');
}

export function clearCart() { localStorage.removeItem('cart'); }
