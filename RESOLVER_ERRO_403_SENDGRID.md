# Como Resolver o Erro 403 (Forbidden) do SendGrid

## 🔴 Problema
O erro **403 (Forbidden)** do SendGrid geralmente significa que:
1. O email remetente não está verificado no SendGrid
2. A API Key não tem permissões de "Mail Send"
3. O domínio não está autenticado no SendGrid

## ✅ Soluções

### Opção 1: Verificar um Email Remetente (Single Sender) - MAIS RÁPIDO

1. **Acesse o SendGrid Dashboard:**
   - Vá em: https://app.sendgrid.com
   - Faça login

2. **Vá em Settings > Sender Authentication:**
   - No menu lateral, clique em **Settings**
   - Depois clique em **Sender Authentication**

3. **Verifique um Single Sender:**
   - Clique em **Verify a Single Sender**
   - Clique em **Create New Sender**
   - Preencha:
     - **From Email Address:** `noreply@lunabe.com.br` (ou seu email)
     - **From Name:** `Lunabe Pijamas`
     - **Reply To:** (opcional)
     - **Company Address:** (seu endereço)
   - Clique em **Create**
   - **Verifique o email** que o SendGrid enviará para você

4. **Configure no Render:**
   - Adicione a variável de ambiente:
     - Key: `EMAIL_FROM`
     - Value: `Lunabe Pijamas <noreply@lunabe.com.br>` (use o email que você verificou)

5. **Faça o deploy novamente**

### Opção 2: Autenticar o Domínio (Recomendado para Produção)

1. **Acesse o SendGrid Dashboard:**
   - Vá em: https://app.sendgrid.com
   - Settings > Sender Authentication

2. **Autentique o Domínio:**
   - Clique em **Authenticate Your Domain**
   - Selecione o provedor DNS (Hostinger)
   - Adicione os registros DNS que o SendGrid fornecer

3. **Configure no Render:**
   - Adicione a variável de ambiente:
     - Key: `EMAIL_FROM`
     - Value: `Lunabe Pijamas <noreply@lunabe.com.br>`

### Opção 3: Verificar Permissões da API Key

1. **Acesse o SendGrid Dashboard:**
   - Vá em: Settings > API Keys

2. **Verifique a API Key:**
   - Encontre a API Key que você está usando
   - Clique em **Edit**
   - Certifique-se de que **Mail Send** está habilitado
   - Salve as alterações

## 🔍 Verificar se Está Funcionando

Após configurar, você verá nos logs do Render:

```
✅ SendGrid configurado para envio de emails
🔵 Email remetente: Lunabe Pijamas <noreply@lunabe.com.br>
🔵 Enviando via SendGrid...
✅ Email enviado via SendGrid
```

## ⚠️ Importante

- O email no campo `from` **DEVE** estar verificado no SendGrid
- Se usar `noreply@lunabe.com.br`, você precisa verificar esse email específico OU autenticar o domínio `lunabe.com.br`
- A API Key precisa ter permissão de **Mail Send**

## 📝 Exemplo de Configuração no Render

Variáveis de ambiente necessárias:

```
SENDGRID_API_KEY=sua_api_key_aqui
EMAIL_FROM=Lunabe Pijamas <noreply@lunabe.com.br>
```

**IMPORTANTE:** Substitua `noreply@lunabe.com.br` pelo email que você verificou no SendGrid!

