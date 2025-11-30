# 🔍 Diagnosticar Erro Google OAuth

## ❌ Erro: "The OAuth client was not found" (401: invalid_client)

Vamos diagnosticar passo a passo:

---

## 🔍 Passo 1: Verificar Client ID no Render

### Frontend (Static Site):
1. Acesse o Render Dashboard
2. Vá no seu **Static Site** (Frontend)
3. Clique em **"Environment"**
4. Procure por `VITE_GOOGLE_CLIENT_ID`
5. **Copie o valor** (sem mostrar aqui por segurança)

**Verifique:**
- [ ] A variável existe?
- [ ] O valor está no formato: `xxxxx-xxxxx.apps.googleusercontent.com`?
- [ ] Não tem espaços antes/depois?
- [ ] Não tem aspas?

### Backend (Web Service):
1. Acesse o Render Dashboard
2. Vá no seu **Web Service** (Backend)
3. Clique em **"Environment"**
4. Procure por `GOOGLE_CLIENT_ID`
5. **Copie o valor**

**Verifique:**
- [ ] A variável existe?
- [ ] O valor é **IGUAL** ao do frontend?
- [ ] Não tem espaços antes/depois?
- [ ] Não tem aspas?

---

## 🔍 Passo 2: Verificar no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Vá em **"APIs & Services"** → **"Credentials"**
3. Encontre o **OAuth 2.0 Client ID** que você está usando
4. Clique nele para ver os detalhes

**Verifique:**

### Authorized JavaScript origins:
- [ ] `https://www.lunabe.com.br` está listado?
- [ ] `http://localhost:5173` está listado?

### Authorized redirect URIs:
- [ ] `https://www.lunabe.com.br/google-redirect` está listado?
- [ ] `http://localhost:5173/google-redirect` está listado?

### Client ID:
- [ ] O Client ID mostrado é o mesmo que está no Render?

---

## 🔍 Passo 3: Verificar OAuth Consent Screen

1. No Google Cloud Console, vá em **"OAuth consent screen"**
2. Verifique o status

**Verifique:**
- [ ] O consent screen está publicado ou em modo de teste?
- [ ] Se está em modo de teste, seu email está em "Test users"?
- [ ] O "App name" está configurado?

---

## 🔍 Passo 4: Testar no Console do Navegador

1. Acesse o site hospedado: `https://www.lunabe.com.br`
2. Abra o Console (F12)
3. Digite:
```javascript
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
```

**O que deve aparecer:**
- O Client ID completo (ex: `123456-abc.apps.googleusercontent.com`)
- **NÃO** deve aparecer `undefined`
- **NÃO** deve aparecer `http://localhost:4001`

---

## 🔍 Passo 5: Verificar Logs do Backend

1. No Render, vá no seu **Web Service**
2. Clique em **"Logs"**
3. Tente fazer login com Google
4. Veja se aparece algum erro relacionado ao Google

**Procure por:**
- Erros de "GOOGLE_CLIENT_ID missing"
- Erros de "Invalid idToken"
- Erros de verificação do token

---

## 🔍 Passo 6: Verificar Redeploy

**Importante:** Após alterar variáveis no Render, o serviço precisa ser redeployado!

1. No Render, vá no seu **Static Site**
2. Verifique se há um deploy recente após você adicionar `VITE_GOOGLE_CLIENT_ID`
3. Se não houver, clique em **"Manual Deploy"** → **"Deploy latest commit"**

**Faça o mesmo para o Backend:**
1. Vá no **Web Service**
2. Verifique se há um deploy recente após você adicionar `GOOGLE_CLIENT_ID`
3. Se não houver, clique em **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Client ID não aparece no console

**Sintoma:** `console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)` retorna `undefined`

**Causa:** Variável não configurada ou build antigo

**Solução:**
1. Verifique se `VITE_GOOGLE_CLIENT_ID` está no Render
2. Faça um **Manual Deploy** do frontend
3. Aguarde o build completar
4. Teste novamente

### Problema 2: Client ID diferente no frontend e backend

**Sintoma:** Frontend funciona mas backend rejeita o token

**Causa:** Client IDs diferentes

**Solução:**
1. Use o **MESMO** Client ID no frontend (`VITE_GOOGLE_CLIENT_ID`) e backend (`GOOGLE_CLIENT_ID`)
2. Faça redeploy de ambos
3. Teste novamente

### Problema 3: URLs não correspondem

**Sintoma:** Erro "redirect_uri_mismatch"

**Causa:** URL de produção não está nas "Authorized redirect URIs"

**Solução:**
1. No Google Cloud Console, adicione exatamente:
   - `https://www.lunabe.com.br/google-redirect`
2. **SEM** barra no final
3. **COM** `https://`
4. Salve e aguarde alguns minutos

### Problema 4: OAuth Consent Screen em modo de teste

**Sintoma:** Erro "Access blocked: This app's request is invalid"

**Causa:** App em modo de teste e email não está em "Test users"

**Solução:**
1. Vá em "OAuth consent screen"
2. Adicione seu email em "Test users"
3. Ou publique o app (se estiver pronto)

---

## 📋 Checklist Completo

- [ ] `VITE_GOOGLE_CLIENT_ID` configurado no Render (Frontend)
- [ ] `GOOGLE_CLIENT_ID` configurado no Render (Backend)
- [ ] Client IDs são **IGUAIS** no frontend e backend
- [ ] Client ID existe no Google Cloud Console
- [ ] `https://www.lunabe.com.br` está em "Authorized JavaScript origins"
- [ ] `https://www.lunabe.com.br/google-redirect` está em "Authorized redirect URIs"
- [ ] OAuth Consent Screen configurado
- [ ] Frontend foi redeployado após adicionar variável
- [ ] Backend foi redeployado após adicionar variável
- [ ] Console do navegador mostra o Client ID corretamente
- [ ] Testou o login novamente

---

## 🆘 Se Ainda Não Funcionar

Me envie estas informações:

1. **Screenshot do OAuth Client ID no Google Cloud Console**
   - Mostrando as URLs configuradas

2. **Valor do Client ID no Render (Frontend)**
   - Apenas confirme se está configurado (não mostre o ID completo)

3. **Valor do Client ID no Render (Backend)**
   - Apenas confirme se está configurado (não mostre o ID completo)

4. **Resultado do console.log no navegador:**
   - O que aparece quando você digita: `console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)`

5. **Erro exato que aparece:**
   - Screenshot ou texto completo do erro

6. **Logs do backend no Render:**
   - Qualquer erro relacionado ao Google OAuth

---

## 💡 Dica Extra

Se você criou um **novo** Client ID no Google Cloud Console:
1. Certifique-se de copiar o Client ID **completo**
2. Configure no Render (Frontend e Backend)
3. Faça redeploy de ambos
4. Aguarde 2-3 minutos
5. Teste novamente

Às vezes o Google demora alguns minutos para propagar as mudanças.

