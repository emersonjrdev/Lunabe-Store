# Configuração do Link de Pagamento - Passo a Passo

## ✅ Status Atual

Você já está na página do Link de Pagamento! O produto está visível e acessível.

## 📋 Próximos Passos

### 1. Verificar a Aba "Configurar"

1. **Clique na aba "Configurar"** (no topo da página)
2. Verifique se há alguma configuração pendente:
   - Aceitar termos e condições
   - Configurar permissões da API
   - Habilitar OAuth 2.0 para API

### 2. Verificar Credenciais OAuth 2.0

Para usar a API (não apenas criar links manualmente), você precisa:

1. **Acesse o Developer Portal da Rede**
   - URL: https://developer.userede.com.br
   - Ou procure por "Portal do Desenvolvedor" no menu

2. **Crie um Projeto**
   - Crie um novo projeto para Link de Pagamento
   - Isso gerará as credenciais OAuth 2.0 (client_id e client_secret)

3. **Obtenha as Credenciais**
   - `client_id`: deve ser o PV (104847581) conforme suporte da Rede
   - `client_secret`: chave de 32 caracteres gerada pelo portal

### 3. Configurar no Render

Após obter as credenciais, configure no Render:

- `REDE_AFFILIATION`: 104847581 (PV)
- `REDE_TOKEN`: client_secret (chave de 32 caracteres)
- `REDE_ENV`: production

### 4. Testar a Criação Manual

Antes de testar via API, teste criar um link manualmente:

1. Na aba "Criar", preencha:
   - Nome do produto
   - Valor
   - Prazo de vencimento
   - Formas de pagamento

2. Clique em "Gerar Link"

3. Se funcionar manualmente, a API também deve funcionar após configurar OAuth 2.0

## 🔍 Verificações Importantes

### Se o erro 401 persistir após configurar OAuth:

1. **Verifique se o OAuth 2.0 está habilitado para API**
   - No Developer Portal, verifique se o projeto tem permissão para "Payment Link API"

2. **Verifique se o client_id está correto**
   - Deve ser o PV numérico (104847581), não um GUID
   - Conforme orientação do suporte da Rede

3. **Entre em contato com o Suporte da Rede**
   - Informe que já tem acesso ao Link de Pagamento no portal
   - Mas está recebendo erro 401 na API
   - Peça para verificar permissões OAuth 2.0 para Payment Link API

## 📞 Informações para o Suporte

Se precisar entrar em contato:

- **PV**: 104847581
- **Estabelecimento**: LUNABE PIJAMAS
- **Produto**: Link de Pagamento (já habilitado no portal)
- **Problema**: Erro 401 ao usar API - "User is not authorized to access this resource"
- **O que precisa**: Habilitar permissões OAuth 2.0 para Payment Link API

## ✅ Checklist

- [x] Acessou o portal da Rede
- [x] Link de Pagamento está visível e acessível
- [ ] Verificou aba "Configurar" para aceitar termos
- [ ] Acessou Developer Portal (https://developer.userede.com.br)
- [ ] Criou projeto para Payment Link API
- [ ] Obteve credenciais OAuth 2.0 (client_id e client_secret)
- [ ] Configurou credenciais no Render
- [ ] Testou criação de link manualmente
- [ ] Testou criação de link via API

