# 🥑 Guia de Configuração do AbacatePay

## 📋 Pré-requisitos

Você precisa ter:
- ✅ Conta no AbacatePay aprovada
- ✅ API Key e Secret Key do AbacatePay
- ✅ Backend hospedado no Render (ou outro serviço com URL pública)

## 🔑 Passo 1: Obter Credenciais do AbacatePay

1. Acesse o painel do AbacatePay
2. Vá em **Integração** → **API**
3. Copie a **API Key**:
   - Clique no ícone de copiar (clipboard verde) ao lado da sua chave
   - A chave será copiada para a área de transferência
   - **IMPORTANTE**: A AbacatePay usa apenas uma chave de API (não há Secret Key separada)
   - O ambiente (dev/produção) é determinado automaticamente pela chave utilizada

## ⚙️ Passo 2: Configurar Variáveis de Ambiente no Render

No painel do Render (backend):

1. Acesse seu serviço backend
2. Vá em **Environment** (Variáveis de Ambiente)
3. Adicione as seguintes variáveis:

```env
# AbacatePay - Credencial (apenas uma chave é necessária)
ABACATEPAY_API_KEY=sua_api_key_aqui

# AbacatePay - URL (opcional, padrão já está correto)
ABACATEPAY_API_URL=https://api.abacatepay.com/v1

# URLs do Sistema (IMPORTANTE para webhooks)
BACKEND_URL=https://lunabe-store.onrender.com
FRONTEND_URL=https://seu-site.com.br

# Ambiente
NODE_ENV=production
```

**⚠️ IMPORTANTE:** 
- Substitua `sua_api_key_aqui` pela sua API Key do AbacatePay (cole a chave completa)
- **A AbacatePay usa apenas uma chave de API** - não há Secret Key separada
- O ambiente (dev/produção) é determinado automaticamente pela chave utilizada
- **BACKEND_URL**: `https://lunabe-store.onrender.com` (já configurado)
- Substitua `seu-site.com.br` pela URL real do seu frontend (ex: `www.lunabe.com.br`)
- A `BACKEND_URL` é usada para construir a URL do webhook que o AbacatePay vai chamar
- Todas as requisições vão para o mesmo endpoint: `https://api.abacatepay.com/v1`

## 🔗 Passo 3: Configurar Webhook no AbacatePay

O webhook é necessário para receber notificações de pagamento.

1. Acesse o painel do AbacatePay
2. Vá em **Integração** → **Webhook**
3. Clique em **Criar webhook** ou **+ Criar chave API**
4. Adicione a URL do webhook:

```
https://lunabe-store.onrender.com/api/webhooks/abacatepay
```

**Esta é a URL completa do seu webhook.**

4. Selecione os eventos que deseja receber:
   - ✅ `payment.paid` (Pagamento aprovado)
   - ✅ `payment.pending` (Pagamento pendente)
   - ✅ `payment.cancelled` (Pagamento cancelado)
   - ✅ `payment.failed` (Pagamento falhou)
   - ✅ `payment.refunded` (Pagamento reembolsado)

5. Salve a configuração

## 🧪 Passo 4: Testar a Integração

### Teste Local (Desenvolvimento)

1. Adicione as variáveis no arquivo `server/.env`:

```env
ABACATEPAY_API_KEY=sua_api_key
ABACATEPAY_API_URL=https://api.abacatepay.com/v1
BACKEND_URL=http://localhost:4001
FRONTEND_URL=http://localhost:5173
```

**Nota:** Use uma chave de API criada em "dev mode" no painel do AbacatePay para testar. O mesmo endpoint é usado, mas o ambiente é determinado pela chave.

2. Inicie o servidor:
```bash
cd server
npm run dev
```

3. Faça um pedido de teste no site
4. Verifique os logs do servidor para ver se a integração está funcionando

### Teste em Produção

1. Após configurar as variáveis no Render, faça um **redeploy** do serviço
2. Acesse o site em produção
3. Faça um pedido de teste
4. Verifique:
   - Se o checkout do AbacatePay abre corretamente
   - Se o pagamento é processado
   - Se o webhook recebe as notificações (verifique os logs do Render)

## 🔍 Verificar se Está Funcionando

### 1. Verificar Logs do Backend

No Render, vá em **Logs** e procure por:
- ✅ `Sessão de checkout AbacatePay criada com sucesso`
- ✅ `Webhook AbacatePay recebido`
- ❌ Se aparecer erros, verifique as credenciais

### 2. Testar Webhook

O AbacatePay pode ter uma opção para testar webhooks. Use isso para verificar se está recebendo as notificações.

### 3. Verificar Pedidos

Após um pagamento de teste:
1. Acesse o painel admin: `https://seu-site.com/admin`
2. Verifique se o pedido aparece com status correto
3. Verifique se o estoque foi reduzido (se o pagamento foi aprovado)

## 🐛 Solução de Problemas

### Erro: "API Key inválida" ou "401 Unauthorized"
- Verifique se copiou a API Key corretamente (chave completa, sem espaços)
- Certifique-se de que não há espaços extras antes ou depois da chave
- Verifique se a chave não foi revogada no painel do AbacatePay
- Certifique-se de que está usando a chave do ambiente correto (dev ou produção)

### Erro: "Webhook não recebido"
- Verifique se a URL do webhook está correta no painel do AbacatePay
- Certifique-se de que o backend está acessível publicamente
- Verifique os logs do Render para ver se há erros

### Erro: "Erro ao criar sessão de checkout"
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique os logs do servidor para mais detalhes
- Certifique-se de que a URL da API do AbacatePay está correta

### Pagamento não atualiza status
- Verifique se o webhook está configurado corretamente
- Verifique se o webhook está recebendo as notificações (logs)
- Verifique se a URL do webhook no AbacatePay está correta

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do Render
2. Verifique a documentação do AbacatePay
3. Entre em contato com o suporte do AbacatePay se necessário

## ✅ Checklist Final

- [ ] API Key configurada no Render
- [ ] Secret Key configurada no Render
- [ ] Webhook configurado no painel do AbacatePay
- [ ] URL do webhook aponta para o backend correto
- [ ] Backend redeployado após configurar variáveis
- [ ] Teste de pagamento realizado
- [ ] Webhook recebendo notificações (verificar logs)
- [ ] Pedidos aparecendo no admin com status correto

