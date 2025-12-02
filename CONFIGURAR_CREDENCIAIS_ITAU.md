# 🔑 Configuração das Credenciais Itaú

## ✅ Credenciais Configuradas

As credenciais da API Itaú foram fornecidas e estão prontas para configuração:

### 📋 Credenciais Fornecidas

- **PIX Client ID**: `128516bc-c758-4bca-b2d9-7856db7f9161`
- **PIX Client Secret**: `cad08a7baef7476088f4a5ec7e5611e3`
- **Chave PIX (CNPJ)**: `63824145000127`

## 🚀 Como Configurar no Render

1. Acesse o painel do Render: https://dashboard.render.com
2. Selecione o serviço do backend (Lunabe-Store)
3. Vá em **Environment** (Variáveis de Ambiente)
4. Adicione ou atualize as seguintes variáveis:

```
ITAU_CLIENT_ID=128516bc-c758-4bca-b2d9-7856db7f9161
ITAU_CLIENT_SECRET=cad08a7baef7476088f4a5ec7e5611e3
ITAU_PIX_KEY=63824145000127
ITAU_ENV=production
```

5. Clique em **Save Changes**
6. O serviço será reiniciado automaticamente

## 🧪 Como Configurar Localmente

1. Crie um arquivo `.env` na pasta `server/` (se não existir)
2. Adicione as seguintes linhas:

```env
ITAU_CLIENT_ID=128516bc-c758-4bca-b2d9-7856db7f9161
ITAU_CLIENT_SECRET=cad08a7baef7476088f4a5ec7e5611e3
ITAU_PIX_KEY=63824145000127
ITAU_ENV=production
```

3. Reinicie o servidor

## ✅ Verificação

Após configurar, você pode verificar se está funcionando:

1. Faça um pedido de teste
2. Selecione "PIX (Itaú)" como método de pagamento
3. Verifique os logs do servidor - deve aparecer:
   - `🔵 Usando API do Itaú para gerar PIX dinâmico...`
   - `✅ PIX gerado via API com sucesso`
4. O QR Code gerado deve ser válido e escaneável

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite o arquivo `.env` no Git
- Mantenha as credenciais seguras
- Não compartilhe essas chaves publicamente
- Use apenas em ambiente de produção confiável

## 📞 Suporte

Se houver problemas:
1. Verifique se as variáveis estão configuradas corretamente
2. Verifique os logs do servidor para erros
3. Certifique-se de que a chave PIX está ativa no Itaú
4. Teste primeiro no ambiente sandbox se necessário

