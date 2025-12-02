# 🔍 Verificação da Integração API Itaú PIX

## ✅ O que foi verificado e ajustado

### 1. **Autenticação OAuth2**
- ✅ Formato correto: `Basic` authentication com `client_id:client_secret` em base64
- ✅ Escopos atualizados: `cob.write cob.read` (antes era apenas `cob.write`)
- ✅ URL do token: `https://api.itau.com.br/oauth/v2/token` (produção) ou `/sandbox/oauth/v2/token` (sandbox)

### 2. **Criação de Cobrança PIX**
- ✅ Endpoint: `PUT /pix/v2/cob/{txId}`
- ✅ Valor formatado como string com 2 decimais: `"123.45"` (não número)
- ✅ Payload correto conforme documentação:
  ```json
  {
    "calendario": {
      "expiracao": 3600
    },
    "valor": {
      "original": "123.45"
    },
    "chave": "63824145000127",
    "solicitacaoPagador": "Descrição do pagamento"
  }
  ```

### 3. **Consulta de QR Code via Location**
- ✅ Adicionado fallback: se o QR Code não vier direto na resposta, consulta via `/pix/v2/loc/{locationId}/qrcode`

### 4. **Logs Detalhados**
- ✅ Logs completos para diagnóstico de problemas
- ✅ Rota de teste: `/api/orders/test-itau-credentials`

## ⚠️ Pontos Importantes da Documentação Itaú

### **Autenticação mTLS (Produção)**
Segundo a documentação oficial do Itaú:
- **Sandbox**: Usa apenas OAuth2 (client_id + client_secret) ✅ **Estamos usando isso**
- **Produção**: Requer **mTLS (mutual TLS)** com certificado dinâmico ⚠️ **Pode ser o problema**

### **Certificado Dinâmico para Produção**
Para usar em produção, é necessário:
1. Contatar o gerente de conta no Itaú
2. Solicitar Client ID e Token Temporário
3. Gerar certificado dinâmico
4. Configurar mTLS no servidor

**Isso significa que apenas client_id e client_secret podem não ser suficientes para produção!**

## 🔧 Possíveis Causas do Erro

### 1. **Credenciais não configuradas no Render**
- Verificar se `ITAU_CLIENT_ID` e `ITAU_CLIENT_SECRET` estão no painel do Render
- Verificar se não há espaços extras ou caracteres inválidos

### 2. **Ambiente incorreto**
- Se `ITAU_ENV=production` mas as credenciais são de sandbox (ou vice-versa)
- Verificar qual ambiente as credenciais pertencem

### 3. **Chave PIX não cadastrada**
- A chave PIX (`63824145000127`) precisa estar cadastrada e ativa no Itaú
- Verificar se a chave está correta e habilitada para recebimentos

### 4. **Falta de Certificado mTLS (Produção)**
- Se estiver tentando usar em produção sem certificado dinâmico
- **Solução**: Usar sandbox primeiro ou obter certificado para produção

### 5. **Escopos insuficientes**
- ✅ **Corrigido**: Agora usa `cob.write cob.read`

## 🧪 Como Testar

### 1. **Testar Credenciais**
```
GET https://lunabe-store.onrender.com/api/orders/test-itau-credentials
```

### 2. **Verificar Logs do Render**
- Acesse: https://dashboard.render.com
- Selecione o serviço backend
- Vá em **Logs**
- Procure por mensagens com 🔵, ❌, ✅

### 3. **Verificar Variáveis de Ambiente**
No Render, confirme:
```
ITAU_CLIENT_ID=128516bc-c758-4bca-b2d9-7856db7f9161
ITAU_CLIENT_SECRET=cad08a7baef7476088f4a5ec7e5611e3
ITAU_PIX_KEY=63824145000127
ITAU_ENV=sandbox  # ou production (mas precisa de certificado)
```

## 📚 Documentação Oficial

- **Portal Itaú for Developers**: https://devportal.itau.com.br
- **Como Começar**: https://devportal.itau.com.br/como-comecar
- **Certificado Dinâmico**: https://devportal.itau.com.br/certificado-dinamico-credenciais
- **Autenticação mTLS**: https://devportal.itau.com.br/autenticacao-documentacao

## 🎯 Próximos Passos

1. **Se estiver em Sandbox**: Verificar se as credenciais são de sandbox
2. **Se estiver em Produção**: Verificar se tem certificado mTLS configurado
3. **Testar a rota de diagnóstico**: `/api/orders/test-itau-credentials`
4. **Verificar logs detalhados** no Render para ver o erro exato

## 💡 Recomendação

**Para começar, use SANDBOX:**
```
ITAU_ENV=sandbox
```

Isso não requer certificado mTLS e permite testar a integração completa antes de ir para produção.

