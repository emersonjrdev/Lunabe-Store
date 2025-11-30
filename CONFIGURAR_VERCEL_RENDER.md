# 🔧 Configurar Frontend (Vercel) + Backend (Render)

## 📍 Situação Atual

- **Frontend:** Vercel (`https://www.lunabe.com.br`)
- **Backend:** Render (`https://lunabe-backend.onrender.com`)

---

## ✅ Passo 1: Configurar Variáveis no Vercel (Frontend)

### 1.1 Acessar o Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Faça login
3. Selecione o projeto **Lunabe Store** (ou o nome do seu projeto)

### 1.2 Adicionar Variáveis de Ambiente

1. No projeto, clique em **"Settings"**
2. No menu lateral, clique em **"Environment Variables"**
3. Adicione as seguintes variáveis:

#### Variável 1: API Base URL
- **Key:** `VITE_API_BASE`
- **Value:** `https://lunabe-backend.onrender.com`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Clique em **"Save"**

#### Variável 2: Google Client ID
- **Key:** `VITE_GOOGLE_CLIENT_ID`
- **Value:** `seu-client-id-aqui.apps.googleusercontent.com` (sem aspas, sem espaços)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Clique em **"Save"**

**⚠️ IMPORTANTE:**
- Substitua `seu-client-id-aqui.apps.googleusercontent.com` pelo Client ID real do Google Cloud Console
- **SEM** aspas ao redor do valor
- **SEM** espaços antes ou depois
- Marque todas as environments (Production, Preview, Development)

### 1.3 Fazer Redeploy

Após adicionar as variáveis:

1. Vá em **"Deployments"**
2. Encontre o último deployment
3. Clique nos **3 pontinhos (...)** → **"Redeploy"**
4. Ou faça um novo commit e push (o Vercel faz deploy automático)

**⚠️ IMPORTANTE:** 
- Variáveis de ambiente só são aplicadas em **novos builds**
- Você **DEVE** fazer redeploy após adicionar variáveis

---

## ✅ Passo 2: Configurar Variáveis no Render (Backend)

### 2.1 Acessar o Render Dashboard

1. Acesse: https://dashboard.render.com
2. Faça login
3. Selecione o **Web Service** (Backend)

### 2.2 Adicionar Variáveis de Ambiente

1. No Web Service, clique em **"Environment"**
2. Adicione/Verifique as seguintes variáveis:

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Servidor
PORT=10000
FRONTEND_URL=https://www.lunabe.com.br
BACKEND_URL=https://lunabe-backend.onrender.com

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com

# Email
EMAIL_USER=lunabepijamas@gmail.com
EMAIL_PASS=sua-senha-de-app-gmail
EMAIL_FROM=Lunabe Pijamas <lunabepijamas@gmail.com>

# AbacatePay
ABACATEPAY_API_KEY=sua-api-key-producao
ABACATEPAY_SECRET_KEY=seu-secret-key-producao
ABACATEPAY_API_URL=https://api.abacatepay.com/v1

# JWT
JWT_SECRET=seu-jwt-secret

# Admin
ADMIN_SECRET=sua-chave-admin

# Ambiente
NODE_ENV=production
```

**⚠️ IMPORTANTE:**
- `GOOGLE_CLIENT_ID` deve ser o **MESMO** do frontend (Vercel)
- `FRONTEND_URL` deve ser `https://www.lunabe.com.br` (URL do Vercel)

### 2.3 Render Reinicia Automaticamente

Após salvar variáveis, o Render reinicia automaticamente. Aguarde 1-2 minutos.

---

## ✅ Passo 3: Verificar Google Cloud Console

### 3.1 Verificar OAuth Client ID

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Encontre o OAuth Client ID que você está usando
3. Clique nele para ver os detalhes

### 3.2 Verificar URLs Configuradas

**Authorized JavaScript origins:**
```
https://www.lunabe.com.br
http://localhost:5173
```

**Authorized redirect URIs:**
```
https://www.lunabe.com.br/google-redirect
http://localhost:5173/google-redirect
```

**⚠️ IMPORTANTE:**
- `https://www.lunabe.com.br` deve estar nas URLs autorizadas
- Se não estiver, adicione e salve

---

## ✅ Passo 4: Verificar se Está Funcionando

### 4.1 Verificar no Console do Navegador

1. Acesse: `https://www.lunabe.com.br`
2. Abra o Console (F12)
3. Digite:
```javascript
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
console.log(import.meta.env.VITE_API_BASE)
```

**O que deve aparecer:**
- `VITE_GOOGLE_CLIENT_ID`: `xxxxx-xxxxx.apps.googleusercontent.com`
- `VITE_API_BASE`: `https://lunabe-backend.onrender.com`

**Se aparecer `undefined`:**
- Variável não está configurada no Vercel, OU
- Precisa fazer redeploy

### 4.2 Testar Login com Google

1. Acesse: `https://www.lunabe.com.br`
2. Clique em "Login"
3. Clique em "Entrar com Google"
4. Deve abrir a tela de seleção de conta do Google
5. Selecione uma conta
6. Deve fazer login com sucesso

---

## 🔍 Troubleshooting

### Problema: Variável aparece como `undefined` no console

**Causa:** Variável não configurada ou build antigo

**Solução:**
1. Verifique se a variável está no Vercel (Settings → Environment Variables)
2. Faça um **Redeploy** no Vercel
3. Aguarde o build completar
4. Teste novamente

### Problema: "The OAuth client was not found"

**Causa:** Client ID incorreto ou não existe

**Solução:**
1. Verifique se `VITE_GOOGLE_CLIENT_ID` está no Vercel
2. Verifique se o Client ID existe no Google Cloud Console
3. Certifique-se de que é o **MESMO** Client ID no Vercel e Render
4. Faça redeploy no Vercel após corrigir

### Problema: "CORS policy" ou "Network Error"

**Causa:** `FRONTEND_URL` no Render está incorreto

**Solução:**
1. No Render (Backend), verifique `FRONTEND_URL`
2. Deve ser: `https://www.lunabe.com.br`
3. **SEM** barra no final
4. Render reinicia automaticamente após salvar

### Problema: Frontend não conecta ao backend

**Causa:** `VITE_API_BASE` não configurado ou incorreto

**Solução:**
1. No Vercel, verifique `VITE_API_BASE`
2. Deve ser: `https://lunabe-backend.onrender.com`
3. **SEM** barra no final
4. Faça redeploy no Vercel

---

## 📋 Checklist Completo

### Vercel (Frontend):
- [ ] `VITE_API_BASE` configurado = `https://lunabe-backend.onrender.com`
- [ ] `VITE_GOOGLE_CLIENT_ID` configurado = Client ID do Google
- [ ] Variáveis marcadas para Production, Preview e Development
- [ ] Redeploy feito após adicionar variáveis
- [ ] Console do navegador mostra as variáveis corretamente

### Render (Backend):
- [ ] `GOOGLE_CLIENT_ID` configurado = **MESMO** Client ID do frontend
- [ ] `FRONTEND_URL` configurado = `https://www.lunabe.com.br`
- [ ] `BACKEND_URL` configurado = `https://lunabe-backend.onrender.com`
- [ ] Todas as outras variáveis configuradas (MongoDB, Email, etc.)

### Google Cloud Console:
- [ ] OAuth Client ID existe
- [ ] `https://www.lunabe.com.br` está em "Authorized JavaScript origins"
- [ ] `https://www.lunabe.com.br/google-redirect` está em "Authorized redirect URIs"
- [ ] OAuth Consent Screen configurado

---

## 🚀 Resumo Rápido

1. **Vercel** → Settings → Environment Variables → Adicionar:
   - `VITE_API_BASE=https://lunabe-backend.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com`

2. **Vercel** → Deployments → Redeploy (após adicionar variáveis)

3. **Render** → Environment → Verificar:
   - `GOOGLE_CLIENT_ID` = **MESMO** do Vercel
   - `FRONTEND_URL=https://www.lunabe.com.br`

4. **Google Cloud Console** → Verificar URLs de produção configuradas

5. **Testar** → Login com Google deve funcionar

---

## 🆘 Se Ainda Não Funcionar

Me envie:

1. **Screenshot das variáveis no Vercel:**
   - Settings → Environment Variables
   - (Pode ocultar parte do Client ID por segurança)

2. **Screenshot das variáveis no Render:**
   - Environment
   - (Pode ocultar parte do Client ID por segurança)

3. **Resultado do console.log:**
   - O que aparece quando você digita: `console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)`

4. **Data do último deploy no Vercel:**
   - Quando foi o último redeploy?

5. **Erro exato:**
   - Screenshot ou texto completo do erro

Com essas informações, consigo identificar exatamente qual é o problema! 🔍

