# Como Habilitar Link de Pagamento na Rede

## ⚠️ Problema Atual

O erro `"User is not authorized to access this resource with an explicit deny in an identity-based policy"` indica que o produto **Link de Pagamento** não está habilitado no portal da Rede para suas credenciais.

## ✅ Solução

Conforme a documentação oficial da Rede, é **OBRIGATÓRIO** habilitar o produto Link de Pagamento no portal antes de usar a API.

### Passos para Habilitar:

1. **Acesse o Portal da Rede**
   - URL: https://portal.userede.com.br
   - Faça login com suas credenciais

2. **Navegue até a seção "Link de Pagamento"**
   - Procure no menu por "Link de Pagamento" ou "Payment Link"
   - Pode estar em "Produtos" ou "Serviços"

3. **Habilite o Produto**
   - Clique em "Habilitar" ou "Ativar" o Link de Pagamento
   - Leia e aceite os **Termos e Condições**
   - Confirme a habilitação

4. **Aguarde a Ativação**
   - A ativação pode levar algumas horas
   - Você receberá uma confirmação quando estiver pronto

5. **Verifique as Permissões**
   - Certifique-se de que o PV (104847581) tem permissão para usar Link de Pagamento
   - Verifique se as credenciais OAuth 2.0 estão corretas

## 📋 Checklist

- [ ] Acessou o portal da Rede
- [ ] Encontrou a seção "Link de Pagamento"
- [ ] Habilitou o produto
- [ ] Aceitou os termos e condições
- [ ] Aguardou a confirmação de ativação
- [ ] Testou novamente a criação de link

## 🔍 Verificação

Após habilitar, os logs devem mostrar:
- ✅ Token OAuth obtido com sucesso
- ✅ Link de pagamento criado com sucesso
- ✅ URL do link retornada

## 📞 Suporte

Se após habilitar o produto o erro persistir:
1. Entre em contato com o suporte da Rede
2. Informe o PV: **104847581**
3. Informe que está tentando usar a API de Link de Pagamento
4. Peça para verificar as permissões do OAuth 2.0

## 📚 Documentação Oficial

Conforme a documentação da Rede:
> "⚠️ Atenção: Para iniciar a integração com a API do Link de Pagamento, é necessário acessar o portal da Rede, habilitar o produto e aceitar os termos de uso. Somente após essa etapa será possível avançar para a integração técnica."




