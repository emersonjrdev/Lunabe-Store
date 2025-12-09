# Solução para Problema de Email no Render

## ⚠️ Problema Identificado

O Render está bloqueando conexões SMTP diretas ao Gmail, causando timeout (`ETIMEDOUT`).

## ✅ Soluções Recomendadas

### Opção 1: Usar SendGrid (Recomendado)

SendGrid é um serviço de email transacional compatível com Render e oferece plano gratuito (100 emails/dia).

#### Passos:

1. **Criar conta no SendGrid**
   - Acesse: https://sendgrid.com
   - Crie uma conta gratuita
   - Verifique seu email

2. **Criar API Key**
   - Vá em Settings → API Keys
   - Clique em "Create API Key"
   - Dê um nome (ex: "Lunabe Store")
   - Selecione "Full Access" ou "Mail Send"
   - Copie a API Key gerada

3. **Configurar no Render**
   - Adicione variável: `SENDGRID_API_KEY` = sua API Key
   - Adicione variável: `EMAIL_FROM` = `Lunabe Pijamas <noreply@lunabe.com.br>`
   - (Opcional) Remova `EMAIL_USER` e `EMAIL_PASS` se não usar mais Gmail

4. **Atualizar código**
   - O código precisa ser modificado para usar SendGrid ao invés de Gmail SMTP

### Opção 2: Usar Mailgun

Mailgun também oferece plano gratuito (5.000 emails/mês).

#### Passos:

1. **Criar conta no Mailgun**
   - Acesse: https://www.mailgun.com
   - Crie uma conta gratuita
   - Verifique seu domínio ou use o domínio sandbox

2. **Obter credenciais**
   - API Key: encontrada no dashboard
   - Domain: seu domínio verificado ou sandbox

3. **Configurar no Render**
   - `MAILGUN_API_KEY` = sua API Key
   - `MAILGUN_DOMAIN` = seu domínio
   - `EMAIL_FROM` = `Lunabe Pijamas <noreply@seu-dominio.com>`

### Opção 3: Contatar Suporte do Render

Se preferir continuar usando Gmail:

1. Entre em contato com o suporte do Render
2. Informe que precisa de conexões SMTP (porta 587 ou 465)
3. Peça para verificar se há bloqueio de firewall
4. Solicite whitelist para smtp.gmail.com

## 🔧 Implementação Rápida com SendGrid

Se quiser que eu implemente SendGrid, posso:
1. Instalar o pacote `@sendgrid/mail`
2. Modificar `server/utils/mailer.js` para usar SendGrid
3. Manter a mesma interface (as funções continuam iguais)

## 📊 Comparação

| Serviço | Plano Grátis | Facilidade | Compatibilidade Render |
|---------|--------------|------------|------------------------|
| Gmail SMTP | ✅ | ⭐⭐⭐ | ❌ Bloqueado |
| SendGrid | 100 emails/dia | ⭐⭐⭐⭐⭐ | ✅ Excelente |
| Mailgun | 5.000 emails/mês | ⭐⭐⭐⭐ | ✅ Excelente |

## 💡 Recomendação

**Use SendGrid** - É o mais fácil de configurar, tem boa documentação e funciona perfeitamente com Render.

Quer que eu implemente SendGrid agora?









