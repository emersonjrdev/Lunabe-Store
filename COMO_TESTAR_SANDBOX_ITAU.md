# 🧪 Como Testar API Itaú PIX em Sandbox

## 📋 Passo a Passo Rápido

### 1️⃣ Configurar no Render

No painel do Render:

1. Acesse: https://dashboard.render.com
2. Selecione seu serviço backend
3. Vá em **Environment**
4. Configure estas variáveis:

```
ITAU_CLIENT_ID=128516bc-c758-4bca-b2d9-7856db7f9161
ITAU_CLIENT_SECRET=cad08a7baef7476088f4a5ec7e5611e3
ITAU_PIX_KEY=63824145000127
ITAU_ENV=sandbox
```

**⚠️ IMPORTANTE:** Use `ITAU_ENV=sandbox` (não `production`)

5. Salve e aguarde o restart (alguns segundos)

### 2️⃣ Testar Credenciais

Acesse no navegador:
```
https://lunabe-store.onrender.com/api/orders/test-itau-credentials
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Credenciais válidas! Token obtido com sucesso."
}
```

### 3️⃣ Fazer Pedido de Teste

1. Acesse: https://www.lunabe.com.br
2. Adicione produtos ao carrinho
3. Vá para checkout
4. Selecione: **"PIX (Itaú)"**
5. Preencha os dados e finalize

**O que deve acontecer:**
- ✅ QR Code PIX é gerado
- ✅ QR Code aparece na tela
- ✅ QR Code é escaneável

## 🔍 Verificar se Funcionou

### ✅ Sinais de Sucesso:

1. Rota de teste retorna `success: true`
2. QR Code é gerado ao fazer pedido
3. Logs do Render mostram:
   - `🔵 Usando ambiente SANDBOX`
   - `✅ Token obtido com sucesso`
   - `✅ PIX gerado via API com sucesso`

### ❌ Se Der Erro 404:

**Problema:** Credenciais de sandbox com `ITAU_ENV=production`

**Solução:** Mude para `ITAU_ENV=sandbox` no Render

## 📝 Checklist

- [ ] Variáveis configuradas no Render
- [ ] `ITAU_ENV=sandbox` (não production)
- [ ] Servidor reiniciado
- [ ] Rota de teste retorna sucesso
- [ ] QR Code é gerado ao fazer pedido

## 💡 Dicas

1. **Sandbox é gratuito** - não precisa de certificado mTLS
2. **Use sandbox** para testar antes de produção
3. **QR Codes de sandbox** validam a integração (mesmo que não paguem de verdade)

## 🆘 Problemas Comuns

### "Erro 404"
- **Causa:** `ITAU_ENV=production` com credenciais de sandbox
- **Solução:** Mude para `ITAU_ENV=sandbox`

### "Credenciais não configuradas"
- **Causa:** Variáveis não estão no Render
- **Solução:** Adicione as 4 variáveis

## 🔗 Links

- Portal Itaú: https://devportal.itau.com.br
- Obter credenciais sandbox: https://devportal.itau.com.br/como-comecar

