# Como Verificar o Email Remetente no SendGrid

## 🔴 Problema
O erro **403 (Forbidden)** acontece porque o SendGrid precisa verificar o email remetente antes de permitir o envio.

## ✅ Solução: Verificar um Single Sender (5 minutos)

### Passo 1: Acessar o SendGrid
1. Acesse: https://app.sendgrid.com
2. Faça login na sua conta

### Passo 2: Ir para Sender Authentication
1. No menu lateral esquerdo, clique em **Settings** (Configurações)
2. Depois clique em **Sender Authentication** (Autenticação de Remetente)

### Passo 3: Verificar um Single Sender
1. Clique no botão **Verify a Single Sender** (Verificar um Remetente Único)
2. Clique em **Create New Sender** (Criar Novo Remetente)

### Passo 4: Preencher os Dados
Preencha o formulário com:

- **From Email Address:** `lunabepijamas@gmail.com`
  - ✅ Este é o email oficial do Lunabe
  
- **From Name:** `Lunabe Pijamas`
  - Nome que aparecerá como remetente

- **Reply To:** (opcional)
  - Pode deixar vazio ou usar o mesmo email

- **Company Address:** 
  - Endereço da empresa (obrigatório)
  - Exemplo: `Rua José Ribeiro da Silva, Jardim Portão Vermelho, Vargem Grande Paulista/SP, 06735-322`

- **City:** `Vargem Grande Paulista`
- **State:** `SP`
- **Zip Code:** `06735-322`
- **Country:** `Brazil`

### Passo 5: Verificar o Email
1. Clique em **Create** (Criar)
2. O SendGrid enviará um email de verificação para `lunabepijamas@gmail.com`
3. **Acesse a caixa de entrada desse email**
4. Clique no link de verificação no email do SendGrid

### Passo 6: Configurar no Render
Após verificar o email, configure no Render:

1. Acesse o Render Dashboard
2. Vá no seu serviço (backend)
3. Clique em **Environment**
4. Adicione/atualize a variável:
   - **Key:** `EMAIL_FROM`
   - **Value:** `Lunabe Pijamas <lunabepijamas@gmail.com>`
     - ✅ Use o email oficial: `lunabepijamas@gmail.com`

### Passo 7: Fazer Deploy
1. Salve as alterações no Render
2. O Render fará deploy automaticamente
3. Aguarde alguns minutos

## ✅ Verificar se Funcionou

Após o deploy, quando um pedido for criado, você verá nos logs:

```
✅ SendGrid configurado para envio de emails
🔵 Email remetente: Lunabe Pijamas <lunabepijamas@gmail.com>
🔵 Enviando via SendGrid...
✅ Email enviado via SendGrid
🔵 Status: 202
```

**Status 202 = Sucesso!** ✅

## ⚠️ Importante

- O email no `EMAIL_FROM` **DEVE** ser o mesmo que você verificou no SendGrid
- Use o email oficial: `lunabepijamas@gmail.com`
- Depois de verificar, você pode usar esse email para enviar emails

## 📝 Resumo das Variáveis no Render

Certifique-se de ter estas variáveis configuradas:

```
SENDGRID_API_KEY=sua_api_key_aqui
EMAIL_FROM=Lunabe Pijamas <lunabepijamas@gmail.com>
```

**✅ Use o email oficial:** `lunabepijamas@gmail.com`

