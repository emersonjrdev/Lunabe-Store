# Como Verificar Por Que os Emails Não Estão Funcionando

## 🔍 Passo 1: Verificar Configuração no Render

1. Acesse o Render Dashboard
2. Vá no seu serviço (backend)
3. Clique em **Environment**
4. Verifique se estas variáveis estão configuradas:

### Variáveis Obrigatórias:
- ✅ `EMAIL_USER`: seu email Gmail (ex: `lunabepijamas@gmail.com`)
- ✅ `EMAIL_PASS`: senha de app do Gmail (16 caracteres, não a senha normal)
- ⚠️ `EMAIL_FROM`: (opcional) `Lunabe Pijamas <lunabepijamas@gmail.com>`

## 🔍 Passo 2: Verificar Logs do Servidor

Após fazer um pedido, verifique os logs do Render. Você deve ver:

### Se email está configurado:
```
✅ Servidor de email configurado e pronto para enviar emails
🔵 Email remetente: lunabepijamas@gmail.com
```

### Quando um pedido é criado:
```
🔵 Tentando enviar email de confirmação de pedido...
🔵 ========== ENVIAR EMAIL DE PEDIDO ==========
🔵 Remetente: lunabepijamas@gmail.com
🔵 Destinatário: cliente@email.com
✅ Email de confirmação de pedido enviado com sucesso
```

### Se email NÃO está configurado:
```
⚠️ ========== EMAIL NÃO CONFIGURADO ==========
⚠️ EMAIL_USER: ❌ Não configurado
⚠️ EMAIL_PASS: ❌ Não configurado
```

## 🔍 Passo 3: Como Obter Senha de App do Gmail

Se `EMAIL_PASS` não está configurado ou está incorreto:

1. Acesse: https://myaccount.google.com/security
2. Ative **Verificação em duas etapas** (se não estiver ativada)
3. Vá em **Senhas de app**
4. Clique em **Selecionar app** → escolha **Email**
5. Clique em **Selecionar dispositivo** → escolha **Outro (nome personalizado)**
6. Digite "Lunabe Store" e clique em **Gerar**
7. **Copie a senha gerada** (16 caracteres, sem espaços)
8. Cole no `EMAIL_PASS` no Render

## 🔍 Passo 4: Erros Comuns

### Erro: "Invalid login"
- **Causa**: `EMAIL_PASS` está incorreto ou não é uma senha de app
- **Solução**: Gere uma nova senha de app e atualize no Render

### Erro: "Email não configurado"
- **Causa**: `EMAIL_USER` ou `EMAIL_PASS` não estão configurados
- **Solução**: Configure ambas as variáveis no Render

### Email não chega (mas não há erro)
- **Causa**: Email pode estar na pasta de spam
- **Solução**: Verifique a pasta de spam do destinatário

### Erro: "Connection timeout"
- **Causa**: Problema de rede ou firewall
- **Solução**: Verifique se o Render permite conexões SMTP (porta 587)

## ✅ Checklist de Verificação

- [ ] `EMAIL_USER` está configurado no Render
- [ ] `EMAIL_PASS` está configurado no Render (senha de app, não senha normal)
- [ ] Verificação em duas etapas está ativada no Gmail
- [ ] Senha de app foi gerada corretamente
- [ ] Logs mostram "Servidor de email configurado"
- [ ] Logs mostram tentativa de envio quando pedido é criado
- [ ] Não há erros nos logs relacionados a email

## 📞 Se Ainda Não Funcionar

1. Verifique os logs completos do Render
2. Procure por mensagens que começam com:
   - `🔵 ========== ENVIAR EMAIL`
   - `❌ ========== ERRO AO ENVIAR EMAIL`
   - `⚠️ EMAIL NÃO CONFIGURADO`

3. Compartilhe os logs para diagnóstico




