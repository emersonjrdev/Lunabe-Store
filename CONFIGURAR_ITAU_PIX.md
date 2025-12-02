# 🏦 Guia de Configuração do PIX Itaú

## 📋 Pré-requisitos

Para usar a API do Itaú para gerar QR Codes PIX dinâmicos, você precisa:

- ✅ Conta no Itaú com acesso à API
- ✅ Client ID e Client Secret da API Itaú
- ✅ Chave PIX cadastrada no Itaú (CNPJ: `63824145000127`)
- ✅ Ambiente configurado (Sandbox ou Produção)

## 🔑 Passo 1: Obter Credenciais da API Itaú

1. Acesse o portal de desenvolvedores do Itaú:
   - **Sandbox**: https://developer.itau.com.br/sandbox
   - **Produção**: https://developer.itau.com.br

2. Crie uma aplicação ou use uma existente

3. Obtenha as credenciais:
   - **Client ID**: Identificador da sua aplicação
   - **Client Secret**: Chave secreta da aplicação

4. Configure os escopos necessários:
   - `cob.write` - Para criar cobranças PIX
   - `cob.read` - Para consultar cobranças PIX (opcional)

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

### 🔑 Credenciais Fornecidas

As credenciais da API Itaú já foram configuradas:

- **PIX Client ID**: `128516bc-c758-4bca-b2d9-7856db7f9161`
- **PIX Client Secret**: `cad08a7baef7476088f4a5ec7e5611e3`

### 📝 Configuração no Render (Produção)

No painel do Render, adicione as seguintes variáveis de ambiente:

```env
# Itaú PIX API - Credenciais
ITAU_CLIENT_ID=128516bc-c758-4bca-b2d9-7856db7f9161
ITAU_CLIENT_SECRET=cad08a7baef7476088f4a5ec7e5611e3

# Itaú PIX - Chave PIX (CNPJ)
ITAU_PIX_KEY=63824145000127

# Itaú PIX - Ambiente
ITAU_ENV=production
```

### 📝 Configuração Local (.env)

Para desenvolvimento local, crie um arquivo `.env` na pasta `server/`:

```env
# Itaú PIX API - Credenciais
ITAU_CLIENT_ID=128516bc-c758-4bca-b2d9-7856db7f9161
ITAU_CLIENT_SECRET=cad08a7baef7476088f4a5ec7e5611e3

# Itaú PIX - Chave PIX (CNPJ)
ITAU_PIX_KEY=63824145000127

# Itaú PIX - Ambiente
ITAU_ENV=production  # ou 'sandbox' para testes
```

**⚠️ IMPORTANTE:**
- As credenciais acima já estão configuradas e prontas para uso
- A chave PIX (`ITAU_PIX_KEY`) está cadastrada e ativa no Itaú
- Use `production` para ambiente real ou `sandbox` para testes

## 🔄 Passo 3: Como Funciona

### Modo API (Recomendado)
Quando `ITAU_CLIENT_ID` e `ITAU_CLIENT_SECRET` estão configurados:
- ✅ QR Codes dinâmicos gerados pela API do Itaú
- ✅ Códigos válidos e funcionais
- ✅ Consulta de status de pagamento possível
- ✅ Expiração configurável (padrão: 1 hora)

### Modo Fallback (Código Estático)
Se as credenciais não estiverem configuradas:
- ⚠️ Usa código PIX estático (pode não funcionar)
- ⚠️ QR Code pode ser inválido
- ⚠️ Não há consulta de status

## 📡 Endpoints da API

### Sandbox
- **Token**: `https://api.itau.com.br/sandbox/oauth/v2/token`
- **PIX**: `https://api.itau.com.br/sandbox/pix/v2/cob`

### Produção
- **Token**: `https://api.itau.com.br/oauth/v2/token`
- **PIX**: `https://api.itau.com.br/pix/v2/cob`

## 🧪 Testando

1. Configure as credenciais no `.env` ou no Render
2. Faça um pedido e selecione "PIX (Itaú)"
3. Verifique os logs do servidor:
   - `🔵 Usando API do Itaú para gerar PIX dinâmico...`
   - `✅ PIX gerado via API com sucesso`
4. Escaneie o QR Code gerado
5. O código deve ser válido e aceito pelo app do banco

## ❌ Troubleshooting

### Erro: "ITAU_CLIENT_ID e ITAU_CLIENT_SECRET são obrigatórios"
- **Solução**: Configure as variáveis de ambiente no Render ou `.env`

### Erro: "Token não retornado pela API Itaú"
- **Solução**: Verifique se as credenciais estão corretas
- **Solução**: Verifique se os escopos estão configurados (`cob.write`)

### Erro: "QR Code PIX não retornado pela API Itaú"
- **Solução**: Verifique se a chave PIX está cadastrada no Itaú
- **Solução**: Verifique se o payload está correto (valor, descrição, etc.)

### QR Code ainda inválido
- **Solução**: Certifique-se de que está usando a API (não o fallback)
- **Solução**: Verifique se a chave PIX está ativa no Itaú
- **Solução**: Teste no ambiente sandbox primeiro

## 📚 Documentação Oficial

- **Portal do Desenvolvedor Itaú**: https://developer.itau.com.br
- **Documentação PIX**: https://developer.itau.com.br/api/pix

## 🔒 Segurança

- ⚠️ **NUNCA** commite as credenciais no Git
- ✅ Use variáveis de ambiente sempre
- ✅ Mantenha o `Client Secret` seguro
- ✅ Use HTTPS em produção
- ✅ Revise as permissões da aplicação regularmente


