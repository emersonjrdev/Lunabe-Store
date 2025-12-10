# Request/Response - Erro OAuth 2.0 Produção

## Informações do Estabelecimento

- **PV (Ponto de Venda):** 104847581
- **GUID (Client ID):** 128516bc-c758-4bca-b2d9-7856db7f9161
- **Ambiente:** Produção
- **URL do Webhook PIX:** https://www.lunabe.com.br/pix-payment/{orderId} (já aprovada)

---

## Request - Obter Access Token OAuth 2.0

### Endpoint
```
POST https://api.userede.com.br/redelabs/oauth2/token
```

### Headers
```
Content-Type: application/x-www-form-urlencoded
Authorization: Basic MTI4NTE2YmMtYzc1OC00YmNhLWIyZDktNzg1NmRiN2Y5MTYxOmNhZDA4YTdiYWVmNzQ3NjA4OGY0YTVlYzdlNTYxMWUz
```

**Nota:** O header Authorization usa Basic Auth com base64 de `{clientId}:{clientSecret}`

### Body
```
grant_type=client_credentials
```

### Credenciais Utilizadas
- **Client ID (GUID):** `128516bc-c758-4bca-b2d9-7856db7f9161` (36 caracteres)
- **Client Secret:** `cad08a7baef7476088f4a5ec7e5611e3` (32 caracteres)
- **Credentials String:** `128516bc-c758-4bca-b2d9-7856db7f9161:cad08a7baef7476088f4a5ec7e5611e3` (69 caracteres)

---

## Response Recebido

### Status HTTP
```
401 Unauthorized
```

### Body da Resposta
```json
{
  "error": "invalid_client"
}
```

---

## Erro Encontrado

**Erro:** `invalid_client`  
**Status:** 401 Unauthorized  
**Endpoint:** `https://api.userede.com.br/redelabs/oauth2/token`  
**Ambiente:** Produção

---

## Request - Criar Cobrança PIX (não executado devido ao erro OAuth)

### Endpoint
```
POST https://api.userede.com.br/erede/v2/transactions
```

### Headers (esperados após obter token)
```
Content-Type: application/json
Authorization: Bearer {access_token}
```

### Body (payload que seria enviado)
```json
{
  "kind": "Pix",
  "reference": "692f2c7c0007405987ef240f",
  "amount": 100,
  "affiliation": "104847581",
  "qrCode": {
    "dateTimeExpiration": "2025-12-02T19:14:20"
  },
  "orderId": "692f2c7c0007405987ef240f"
}
```

**Nota:** Este request não foi executado porque o token OAuth 2.0 não foi obtido.

---

## Logs do Sistema

### Logs de Debug
```
🔵 OAuth URL: https://api.userede.com.br/redelabs/oauth2/token
🔵 clientId (completo): 128516bc-c758-4bca-b2d9-7856db7f9161
🔵 clientId (tamanho): 36
🔵 clientSecret (presente): ✅ SIM
🔵 clientSecret (tamanho): 32
🔵 Credentials string (completo): 128516bc-c758-4bca-b2d9-7856db7f9161:cad08a7baef7476088f4a5ec7e5611e3
🔵 Credentials string (tamanho): 69
🔵 Body da requisição: grant_type=client_credentials
```

### Erro Retornado
```
❌ Status HTTP: 401
❌ Dados da resposta: { "error": "invalid_client" }
❌ Mensagem do erro: Request failed with status code 401
```

---

## Perguntas para o Suporte

1. As credenciais (GUID e Client Secret) estão corretas para produção?
2. O OAuth 2.0 está habilitado para o PV `104847581` em produção?
3. O GUID `128516bc-c758-4bca-b2d9-7856db7f9161` é válido para produção?
4. A chave de integração (`cad08a7baef7476088f4a5ec7e5611e3`) é a correta para OAuth 2.0?
5. Há alguma diferença entre a chave de integração (Basic Auth) e as credenciais OAuth 2.0?
6. Preciso de credenciais diferentes para OAuth 2.0 em produção?

---

## Informações Adicionais

- **URL do Backend:** https://lunabe-store.onrender.com
- **URL do Frontend:** https://www.lunabe.com.br
- **Ambiente:** Produção (não sandbox)
- **Objetivo:** Integração com API PIX e Link de Pagamento da Rede/Itaú

---

**Data:** 02/12/2025  
**Contato:** [Seu email ou telefone]











