# Resposta para o Suporte da Rede

## ✅ Confirmação: Estamos usando PRODUÇÃO

Sim, estamos usando o ambiente de **produção**:
- **URL Base**: `https://payments-api.useredecloud.com.br`
- **Endpoint**: `POST https://payments-api.useredecloud.com.br/payment-link/v1/create`

## 📋 Configuração no Render

Para garantir que está em produção, configure no Render:
- **Variável**: `REDE_ENV`
- **Valor**: `production`

## 📤 Requisição Completa do Link de Pagamento

Quando você criar um pedido com cartão, os logs do servidor mostrarão a requisição completa. Procure por:

```
🔵 ========== REQUISIÇÃO COMPLETA PARA SUPORTE ==========
🔵 Método: POST
🔵 URL completa: https://payments-api.useredecloud.com.br/payment-link/v1/create
🔵 Ambiente: production
🔵 Headers:
🔵   Content-Type: application/json
🔵   Authorization: Bearer [token]
🔵   Company-number: 104847581
🔵 Body (Payload completo):
{
  "amount": 1.00,
  "expirationDate": "12/09/2025",
  "description": "Pedido [ID] - Lunabê",
  "installments": 12,
  "createdBy": "email@cliente.com",
  "paymentOptions": ["credit", "debit", "pix"],
  "comments": "Referência: [orderId]",
  "webhookUrl": "https://lunabe-store.onrender.com/api/webhooks/rede-payment-link"
}
```

## 🔍 Como Obter os Logs Completos

1. Acesse o Render Dashboard
2. Vá no seu serviço (backend)
3. Clique em **"Logs"**
4. Procure por: `========== REQUISIÇÃO COMPLETA PARA SUPORTE ==========`
5. Copie toda a seção que começa com esse log

## 📝 Informações para Enviar ao Suporte

Quando enviar ao suporte da Rede, inclua:

1. **Confirmação de ambiente**: Sim, estamos usando produção
2. **URL do endpoint**: `https://payments-api.useredecloud.com.br/payment-link/v1/create`
3. **Headers completos** (dos logs)
4. **Payload completo** (dos logs)
5. **PV/Company-number**: `104847581`
6. **Mensagem de erro**: `"User is not authorized to access this resource with an explicit deny in an identity-based policy"`

## ⚠️ Problema Identificado

O erro `"User is not authorized to access this resource with an explicit deny in an identity-based policy"` indica que:
- O produto Link de Pagamento precisa estar habilitado no portal da Rede
- As credenciais OAuth 2.0 precisam ter permissão para Payment Link API

## ✅ Checklist

- [x] Usando ambiente de produção
- [x] Endpoint correto: `/payment-link/v1/create`
- [x] Todos os parâmetros obrigatórios presentes (amount, expirationDate, description, installments)
- [x] Headers corretos (Authorization, Company-number)
- [ ] Link de Pagamento habilitado no portal da Rede
- [ ] Permissões OAuth 2.0 configuradas para Payment Link API




