# Como Configurar Envio de Emails

## Variáveis de Ambiente Necessárias no Render

Para habilitar o envio de emails, você precisa configurar as seguintes variáveis de ambiente no Render:

### 1. EMAIL_USER
- **Descrição**: Seu endereço de email Gmail
- **Exemplo**: `seuemail@gmail.com`
- **Obrigatório**: Sim

### 2. EMAIL_PASS
- **Descrição**: Senha de App do Gmail (NÃO use sua senha normal do Gmail)
- **Como obter**: Veja instruções abaixo
- **Obrigatório**: Sim

### 3. EMAIL_FROM (Opcional)
- **Descrição**: Email remetente (se não configurado, usa EMAIL_USER)
- **Exemplo**: `Lunabe Pijamas <seuemail@gmail.com>`
- **Obrigatório**: Não

## Como Obter a Senha de App do Gmail

1. Acesse sua conta Google: https://myaccount.google.com/
2. Vá em **Segurança**
3. Ative a **Verificação em duas etapas** (se ainda não estiver ativada)
4. Role até **Senhas de app**
5. Clique em **Selecionar app** e escolha **Email**
6. Clique em **Selecionar dispositivo** e escolha **Outro (nome personalizado)**
7. Digite "Lunabe Store" e clique em **Gerar**
8. Copie a senha gerada (16 caracteres sem espaços)
9. Use essa senha no `EMAIL_PASS` no Render

## Configurar no Render

1. Acesse seu serviço no Render
2. Vá em **Environment**
3. Adicione as variáveis:
   - `EMAIL_USER`: seu email Gmail
   - `EMAIL_PASS`: a senha de app gerada
   - `EMAIL_FROM`: (opcional) email remetente formatado

## Verificar se Está Funcionando

Após configurar, verifique os logs do servidor no Render. Você deve ver:
- `✅ Servidor de email configurado e pronto para enviar emails`
- Quando um pedido for criado: `✅ Email de confirmação de pedido enviado com sucesso`
- Quando um pagamento for confirmado: `✅ Email de confirmação de pagamento enviado com sucesso`

## Emails Enviados

O sistema envia automaticamente:
1. **Email de Pedido Criado**: Quando o pedido é criado (aguardando pagamento)
2. **Email de Pagamento Confirmado**: Quando o pagamento é confirmado via webhook
3. **Email de Atualização de Status**: Quando o status do pedido muda (enviado, entregue, etc.)

## Problemas Comuns

### Email não está sendo enviado
- Verifique se `EMAIL_USER` e `EMAIL_PASS` estão configurados no Render
- Verifique os logs do servidor para ver mensagens de erro
- Certifique-se de estar usando uma **Senha de App**, não a senha normal do Gmail

### Erro de autenticação
- Verifique se a Verificação em duas etapas está ativada
- Gere uma nova Senha de App
- Certifique-se de que não há espaços na senha ao copiar

### Emails caindo em spam
- Isso é normal para emails transacionais
- O Gmail pode marcar como spam inicialmente
- Com o tempo, a reputação melhora




