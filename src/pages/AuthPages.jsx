import React, { useState } from 'react';
import { register, login } from '../api';

export function RegisterPage() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState('');
  async function handle(e) {
    e.preventDefault();
    const res = await register({ name, email, password });
    if (res.token) { localStorage.setItem('token', res.token); alert('Registrado'); window.location.href='/'; }
    else alert(res.error || 'Erro');
  }
  return (<form onSubmit={handle} className="p-4 max-w-md mx-auto">
    <h2 className="text-xl font-bold mb-2">Registrar</h2>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome" className="w-full p-2 mb-2" />
    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-2" />
    <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha" type="password" className="w-full p-2 mb-2" />
    <button className="px-4 py-2 bg-blue-600 text-white rounded">Registrar</button>
  </form>);
}

export function LoginPage() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  async function handle(e) {
    e.preventDefault();
    const res = await login({ email, password });
    if (res.token) { localStorage.setItem('token', res.token); alert('Logado'); window.location.href='/'; }
    else alert(res.error || 'Erro');
  }
  return (<form onSubmit={handle} className="p-4 max-w-md mx-auto">
    <h2 className="text-xl font-bold mb-2">Login</h2>
    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-2" />
    <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha" type="password" className="w-full p-2 mb-2" />
    <button className="px-4 py-2 bg-green-600 text-white rounded">Login</button>
  </form>);
}
