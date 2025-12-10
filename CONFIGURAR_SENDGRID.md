# Como Configurar SendGrid para Emails

## ✅ SendGrid Implementado!

O código agora está pronto para usar SendGrid, que resolve o problema de timeout no Render.

## 📋 Passos para Configurar

### 1. Criar Conta no SendGrid (Gratuito)

1. Acesse: https://sendgrid.com
2. Clique em **"Start for free"** ou **"Sign Up"**
3. Preencha o formulário:
   - Email
   - Senha
   - Nome da empresa: **Lunabe Pijamas**
4. Confirme seu email

### 2. Criar API Key

1. Após fazer login, vá em **Settings** → **API Keys**
2. Clique em **"Create API Key"**
3. Dê um nome: **Lunabe Store**
4. Selecione **"Full Access"** (ou apenas **"Mail Send"** se preferir)
5. Clique em **"Create & View"**
6. **COPIE A API KEY** (ela só aparece uma vez!)

### 3. Configurar no Render

1. Acesse seu serviço no Render
2. Vá em **Environment**
3. Adicione/atualize estas variáveis:

   **OBRIGATÓRIO:**
   - `SENDGRID_API_KEY`: Cole a API Key que você copiou
   
   **OPCIONAL:**
   - `EMAIL_FROM`: `Lunabe Pijamas <noreply@lunabe.com.br>` (ou seu email verificado)

4. **Remova** (se existir):
   - `EMAIL_USER` (não precisa mais)
   - `EMAIL_PASS` (não precisa mais)

### 4. Verificar Email Remetente

1. No SendGrid, vá em **Settings** → **Sender Authentication**
2. Você pode usar o domínio sandbox ou verificar seu próprio domínio
3. Para começar rápido, use o email que você usou para criar a conta
4. O `EMAIL_FROM` deve ser um email verificado no SendGrid

### 5. Deploy e Teste

1. Após configurar, o Render fará deploy automaticamente
2. Verifique os logs - deve aparecer:
   ```
   ✅ SendGrid configurado para envio de emails
   ```
3. Faça um pedido de teste
4. Verifique se o email chegou!

## ✅ Vantagens do SendGrid

- ✅ Funciona perfeitamente no Render (sem timeout)
- ✅ Plano gratuito: 100 emails/dia
- ✅ Melhor entrega (menos spam)
- ✅ API rápida e confiável
- ✅ Dashboard para ver estatísticas

## 🔄 Fallback Automático

O código tem fallback automático:
- **Prioridade 1**: SendGrid (se `SENDGRID_API_KEY` estiver configurado)
- **Prioridade 2**: Gmail SMTP (se `EMAIL_USER` e `EMAIL_PASS` estiverem configurados)

## 📊 Limites do Plano Gratuito

- **100 emails/dia** (suficiente para começar)
- Para mais, considere upgrade ou usar Gmail SMTP como backup

## 🎉 Pronto!

Após configurar `SENDGRID_API_KEY` no Render, os emails começarão a funcionar automaticamente!










