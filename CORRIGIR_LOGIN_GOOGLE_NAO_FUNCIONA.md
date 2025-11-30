# 🔧 Corrigir: Login Google Não Funciona (Popup Abre Mas Não Loga)

## ❌ Problema

- ✅ Popup do Google abre
- ✅ Não dá erro de "invalid_client" mais
- ❌ Mas não faz login (não retorna para o app)

## 🔍 Possíveis Causas

### 1. Client ID Diferente no Vercel

O log mostra: `1234567890-abcdefgh....` (parece ser um exemplo/placeholder)

**Verificar:**
1. Vercel → Settings → Environment Variables
2. Procure por `VITE_GOOGLE_CLIENT_ID`
3. O valor deve ser: `1082183966234-8cju9q8oivsbk7mq3slolhttdn1s8odj.apps.googleusercontent.com`

**Se estiver diferente:**
- Edite e corrija para o Client ID real
- Faça redeploy

### 2. Client ID Diferente no Render (Backend)

O backend também precisa ter o **MESMO** Client ID.

**Verificar:**
1. Render → Web Service → Environment
2. Procure por `GOOGLE_CLIENT_ID`
3. Deve ser: `1082183966234-8cju9q8oivsbk7mq3slolhttdn1s8odj.apps.googleusercontent.com`

**Se estiver diferente:**
- Edite e corrija
- Render reinicia automaticamente

### 3. URLs de Redirect Não Configuradas

**Verificar no Google Cloud Console:**
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no OAuth Client ID
3. Verifique **"Authorized redirect URIs"**:
   - ✅ `https://www.lunabe.com.br/google-redirect`
   - ✅ `http://localhost:5173/google-redirect`

**Se não estiver:**
- Adicione as URLs
- Salve

### 4. Popup Não Está Retornando o Token

O popup pode estar abrindo mas não retornando o token corretamente.

**Verificar no Console:**
Após clicar em "Entrar com Google", veja os logs:
- `🔐 Google Identity retornou resposta:` → Deve mostrar "com credential"
- `✅ Credential recebido` → Deve aparecer
- `📤 Enviando token para:` → Deve mostrar a URL do backend
- `📥 Resposta do backend:` → Deve mostrar "Sucesso" ou "Erro"

---

## ✅ Solução Passo a Passo

### Passo 1: Verificar Client ID no Vercel

1. Vercel → Settings → Environment Variables
2. Verifique `VITE_GOOGLE_CLIENT_ID`
3. Deve ser: `1082183966234-8cju9q8oivsbk7mq3slolhttdn1s8odj.apps.googleusercontent.com`
4. Se estiver diferente, edite e corrija
5. Faça redeploy

### Passo 2: Verificar Client ID no Render

1. Render → Web Service → Environment
2. Verifique `GOOGLE_CLIENT_ID`
3. Deve ser: `1082183966234-8cju9q8oivsbk7mq3slolhttdn1s8odj.apps.googleusercontent.com` (MESMO do Vercel)
4. Se estiver diferente, edite e corrija

### Passo 3: Verificar URLs no Google Cloud Console

1. Google Cloud Console → Credentials → OAuth Client ID
2. Verifique **"Authorized redirect URIs"**:
   - `https://www.lunabe.com.br/google-redirect`
   - `http://localhost:5173/google-redirect`
3. Se não estiver, adicione e salve

### Passo 4: Testar e Verificar Logs

1. Acesse: `https://www.lunabe.com.br`
2. Abra o Console (F12)
3. Clique em "Login" → "Entrar com Google"
4. Veja os logs no console:
   - Deve aparecer: `🔐 Google Identity retornou resposta: Sim com credential`
   - Deve aparecer: `✅ Credential recebido`
   - Deve aparecer: `📤 Enviando token para: https://lunabe-store.onrender.com/api/auth/google`
   - Deve aparecer: `📥 Resposta do backend: Sucesso` ou `Erro`

**Se aparecer erro:**
- Copie a mensagem de erro completa
- Me envie para diagnosticar

---

## 🐛 Problemas Comuns

### Problema: "Client ID não corresponde"

**Erro:** Backend retorna erro de verificação do token

**Causa:** Client IDs diferentes no Vercel e Render

**Solução:**
- Use o **MESMO** Client ID no Vercel (`VITE_GOOGLE_CLIENT_ID`) e Render (`GOOGLE_CLIENT_ID`)

### Problema: "redirect_uri_mismatch"

**Erro:** Google retorna erro ao tentar fazer login

**Causa:** URL de redirect não está nas "Authorized redirect URIs"

**Solução:**
- Adicione `https://www.lunabe.com.br/google-redirect` no Google Cloud Console

### Problema: Popup abre mas não retorna token

**Sintoma:** Popup abre, você seleciona conta, mas nada acontece

**Causa:** Popup não está enviando o token de volta

**Solução:**
- Verifique se a rota `/google-redirect` está funcionando
- Verifique os logs no console para ver se o token está sendo recebido

---

## 📋 Checklist

- [ ] `VITE_GOOGLE_CLIENT_ID` no Vercel = `1082183966234-8cju9q8oivsbk7mq3slolhttdn1s8odj.apps.googleusercontent.com`
- [ ] `GOOGLE_CLIENT_ID` no Render = **MESMO** Client ID
- [ ] URLs de redirect configuradas no Google Cloud Console
- [ ] Redeploy feito no Vercel após corrigir variável
- [ ] Console mostra logs de debug ao tentar login
- [ ] Token está sendo recebido (logs mostram "com credential")
- [ ] Backend está respondendo (logs mostram "Sucesso" ou "Erro")

---

## 🆘 Se Ainda Não Funcionar

Me envie:

1. **Screenshot das variáveis no Vercel:**
   - `VITE_GOOGLE_CLIENT_ID` (pode ocultar parte por segurança)

2. **Screenshot das variáveis no Render:**
   - `GOOGLE_CLIENT_ID` (pode ocultar parte por segurança)

3. **Logs completos do console:**
   - Copie todos os logs que aparecem ao tentar fazer login
   - Especialmente os que começam com 🔐, ✅, 📤, 📥, ❌

4. **Erro exato (se houver):**
   - Mensagem de erro completa

Com essas informações, consigo identificar exatamente qual é o problema! 🔍

