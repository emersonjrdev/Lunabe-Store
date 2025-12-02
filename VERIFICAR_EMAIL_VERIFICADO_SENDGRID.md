# Como Verificar se o Email Está Verificado no SendGrid

## 🔴 Problema
O erro 403 continua porque o email `lunabepijamas@gmail.com` pode não estar verificado no SendGrid.

## ✅ Passo a Passo para Verificar

### 1. Acessar o SendGrid Dashboard
1. Acesse: https://app.sendgrid.com
2. Faça login na sua conta

### 2. Verificar Sender Authentication
1. No menu lateral esquerdo, clique em **Settings** (Configurações)
2. Depois clique em **Sender Authentication** (Autenticação de Remetente)

### 3. Verificar se o Email Está na Lista
Você deve ver uma seção chamada **"Single Sender Verification"** ou **"Verified Senders"**.

Procure por `lunabepijamas@gmail.com` na lista.

### 4. Se o Email NÃO Estiver Verificado:

1. Clique em **"Verify a Single Sender"** (Verificar um Remetente Único)
2. Clique em **"Create New Sender"** (Criar Novo Remetente)
3. Preencha o formulário:
   - **From Email Address:** `lunabepijamas@gmail.com`
   - **From Name:** `Lunabe Pijamas`
   - **Reply To:** `lunabepijamas@gmail.com`
   - **Company Address:** `Rua José Ribeiro da Silva`
   - **City:** `Vargem Grande Paulista`
   - **State:** `São Paulo`
   - **ZIP Code:** `06735-322`
   - **Country:** `Brazil`
   - **Nickname:** `Lunabe`
4. Clique em **"Create"** (Criar)
5. **Acesse a caixa de entrada de `lunabepijamas@gmail.com`**
6. **Clique no link de verificação** no email do SendGrid

### 5. Se o Email JÁ Estiver na Lista:

Verifique o **status**:
- ✅ **"Verified"** (Verificado) = OK, está funcionando
- ⚠️ **"Pending"** (Pendente) = Precisa verificar o email
- ❌ **"Unverified"** (Não verificado) = Precisa verificar

Se estiver "Pending" ou "Unverified":
1. Clique no email na lista
2. Verifique se há um botão **"Resend Verification Email"** (Reenviar Email de Verificação)
3. Clique e verifique o email novamente

## ✅ Verificar no Render

Após verificar o email no SendGrid, certifique-se de que no Render está configurado:

1. Acesse o Render Dashboard
2. Vá no seu serviço (backend)
3. Clique em **Environment**
4. Verifique se existe a variável:
   - **Key:** `EMAIL_FROM`
   - **Value:** `Lunabe Pijamas <lunabepijamas@gmail.com>`
     - ⚠️ **IMPORTANTE:** O email dentro de `< >` deve ser exatamente `lunabepijamas@gmail.com`

## 🔍 Verificar Permissões da API Key

1. No SendGrid Dashboard, vá em **Settings > API Keys**
2. Encontre a API Key que você está usando
3. Clique em **Edit** (Editar)
4. Verifique se a permissão **"Mail Send"** está habilitada
5. Se não estiver, habilite e salve

## ✅ Testar Novamente

Após verificar tudo:
1. Faça um novo pedido no site
2. Verifique os logs do Render
3. Você deve ver:
   ```
   ✅ Email enviado via SendGrid
   🔵 Status: 202
   ```

**Status 202 = Sucesso!** ✅

## ⚠️ Se Ainda Der Erro 403

Verifique os logs do Render. Agora eles mostrarão:
- A mensagem exata do SendGrid
- Qual email remetente está sendo usado
- Se a API Key está configurada

Com essas informações, será mais fácil identificar o problema.

