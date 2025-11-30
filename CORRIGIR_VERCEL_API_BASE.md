# 🔧 Corrigir: Frontend tentando acessar localhost em vez do Render

## ❌ Problema

O frontend no Vercel está tentando acessar:
```
localhost:4001/api/products
```

Em vez de:
```
https://lunabe-backend.onrender.com/api/products
```

## 🔍 Causa

A variável `VITE_API_BASE` não está sendo aplicada no build do Vercel, ou o build é antigo.

---

## ✅ Solução Passo a Passo

### Passo 1: Verificar Variável no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Procure por `VITE_API_BASE`

**Verifique:**
- [ ] A variável existe?
- [ ] O valor é: `https://lunabe-backend.onrender.com`?
- [ ] Está marcada para **Production**, **Preview** e **Development**?
- [ ] **NÃO** tem aspas ao redor do valor?
- [ ] **NÃO** tem espaços antes ou depois?

**Se NÃO existir ou estiver incorreta:**
1. Clique em **"Add New"** (ou edite a existente)
2. **Key:** `VITE_API_BASE`
3. **Value:** `https://lunabe-backend.onrender.com` (sem aspas, sem espaços)
4. Marque: ✅ Production, ✅ Preview, ✅ Development
5. Clique em **"Save"**

### Passo 2: Fazer Redeploy no Vercel

**⚠️ CRÍTICO:** Variáveis de ambiente só são aplicadas em **novos builds**!

1. No Vercel, vá em **"Deployments"**
2. Encontre o último deployment
3. Clique nos **3 pontinhos (...)** → **"Redeploy"**
4. Ou faça um novo commit e push (o Vercel faz deploy automático)

**Aguarde o build completar** (2-5 minutos)

### Passo 3: Verificar se Funcionou

1. Acesse: `https://www.lunabe.com.br`
2. Abra o Console (F12)
3. Digite:
```javascript
console.log(import.meta.env.VITE_API_BASE)
```

**O que deve aparecer:**
- ✅ `https://lunabe-backend.onrender.com` → **CORRETO**
- ❌ `undefined` → Variável não configurada ou build antigo
- ❌ `http://localhost:4001` → Build antigo (precisa redeploy)

### Passo 4: Limpar Cache do Navegador

Após o redeploy:

1. Pressione `Ctrl + Shift + R` (hard refresh)
2. Ou limpe o cache do navegador
3. Teste novamente

---

## 🔍 Verificar no Código

O código já está correto em `src/api.js`:

```javascript
export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:4001').replace(/\/$/, '');
```

Isso significa:
- Se `VITE_API_BASE` estiver configurado → usa ele
- Se não estiver → usa `localhost:4001` (fallback para desenvolvimento)

**O problema é que o Vercel não está aplicando a variável no build.**

---

## 🐛 Problemas Comuns

### Problema 1: Variável não aparece no console

**Sintoma:** `console.log(import.meta.env.VITE_API_BASE)` retorna `undefined`

**Causa:** 
- Variável não configurada no Vercel, OU
- Build antigo (precisa redeploy)

**Solução:**
1. Verifique se `VITE_API_BASE` está no Vercel
2. Faça **Redeploy** no Vercel
3. Aguarde o build completar
4. Limpe o cache do navegador
5. Teste novamente

### Problema 2: Variável aparece mas ainda usa localhost

**Sintoma:** Variável está configurada mas ainda tenta acessar localhost

**Causa:** Build antigo em cache

**Solução:**
1. Faça **Redeploy** no Vercel
2. Limpe o cache do navegador completamente
3. Teste em uma aba anônima/privada

### Problema 3: Variável tem aspas ou espaços

**Sintoma:** Variável configurada mas não funciona

**Causa:** Formato incorreto

**Solução:**
1. No Vercel, edite a variável
2. Remova **TODAS** as aspas
3. Remova espaços antes e depois
4. Deve ficar exatamente: `https://lunabe-backend.onrender.com`
5. Salve e faça redeploy

---

## 📋 Checklist Completo

Antes de testar, verifique:

- [ ] `VITE_API_BASE` configurado no Vercel
- [ ] Valor: `https://lunabe-backend.onrender.com` (sem aspas, sem espaços)
- [ ] Marcado para Production, Preview e Development
- [ ] **Redeploy feito** após adicionar/editar variável
- [ ] Build do Vercel completou com sucesso
- [ ] Cache do navegador limpo
- [ ] Console mostra a variável corretamente
- [ ] Requisições vão para o Render, não localhost

---

## 🚀 Comandos para Testar

### No Console do Navegador (F12):

```javascript
// Verificar variável
console.log(import.meta.env.VITE_API_BASE)

// Deve mostrar: https://lunabe-backend.onrender.com

// Testar requisição
fetch('https://lunabe-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)

// Deve retornar: {ok: true, message: "Servidor funcionando! 🚀"}
```

### Verificar no Network Tab:

1. Abra DevTools (F12)
2. Vá em **Network**
3. Recarregue a página
4. Procure por requisições para `/api/products`
5. **URL deve ser:** `https://lunabe-backend.onrender.com/api/products`
6. **NÃO deve ser:** `localhost:4001/api/products`

---

## 🆘 Se Ainda Não Funcionar

Me envie:

1. **Screenshot das variáveis no Vercel:**
   - Settings → Environment Variables
   - Mostre a variável `VITE_API_BASE`

2. **Resultado do console.log:**
   - O que aparece quando você digita: `console.log(import.meta.env.VITE_API_BASE)`

3. **Data do último deploy:**
   - Quando foi o último redeploy no Vercel?

4. **Screenshot do erro no Network:**
   - DevTools → Network
   - Mostre a requisição que está falhando
   - Qual URL está sendo usada?

5. **Logs do build do Vercel:**
   - Deployments → Último deployment → Build Logs
   - Há algum erro relacionado a variáveis de ambiente?

Com essas informações, consigo identificar exatamente qual é o problema! 🔍

