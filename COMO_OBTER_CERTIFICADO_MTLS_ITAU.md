# 🔐 Como Obter Certificado mTLS para API Itaú PIX (Produção)

## 📋 Visão Geral

Para usar a API PIX do Itaú em **produção**, você precisa de:
1. ✅ **Client ID e Client Secret** (já temos)
2. ⚠️ **Certificado mTLS (mutual TLS)** - necessário para produção
3. ⚠️ **Token Temporário** - fornecido pelo Itaú

**Importante**: Em **sandbox**, você não precisa de certificado mTLS. Apenas em **produção**.

## 🚀 Passo a Passo

### **Passo 1: Solicitar Credenciais de Produção ao Itaú**

1. **Entre em contato com seu gerente de conta no Itaú**
   - Você precisa ter uma conta empresarial no Itaú
   - Solicite acesso à API PIX para produção

2. **O que solicitar:**
   - Client ID de produção
   - Token Temporário (para gerar o certificado)
   - Instruções específicas do Itaú para seu caso

3. **Documentos que podem ser necessários:**
   - Contrato de prestação de serviços
   - Documentação da empresa (CNPJ)
   - Justificativa de uso da API

### **Passo 2: Gerar Par de Chaves (Pública e Privada)**

Após receber o Client ID e Token Temporário do Itaú:

#### **Opção A: Gerar com OpenSSL (Recomendado)**

```bash
# 1. Gerar chave privada e certificado request (CSR)
openssl req -new \
  -subj "/CN=SEU_CLIENT_ID/OU=Lunabe/L=Vargem Grande Paulista/ST=SP/C=BR" \
  -out certificado_request.csr \
  -nodes \
  -sha512 \
  -newkey rsa:2048 \
  -keyout chave_privada.key

# Substitua SEU_CLIENT_ID pelo Client ID que o Itaú forneceu
```

**Onde:**
- `CN=SEU_CLIENT_ID`: Seu Client ID do Itaú
- `OU=Lunabe`: Nome da sua empresa/aplicação
- `L=Vargem Grande Paulista`: Cidade
- `ST=SP`: Estado
- `C=BR`: País (Brasil)

#### **Opção B: Gerar apenas chaves (sem CSR)**

```bash
# Gerar chave privada
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048

# Gerar chave pública
openssl rsa -pubout -in private.pem -out public.pem
```

### **Passo 3: Enviar Chave Pública ao Itaú**

1. **Envie o arquivo `.csr` (Certificate Signing Request) ou `public.pem`** para:
   - Seu gerente de conta no Itaú
   - Ou o setor responsável por integrações (Cash Office)

2. **Informe que é para:**
   - Integração com API PIX
   - Autenticação mTLS para produção

3. **Aguarde o processamento** (pode levar alguns dias úteis)

### **Passo 4: Receber e Instalar o Certificado**

1. **O Itaú enviará:**
   - Certificado assinado (`.crt` ou `.pem`)
   - Instruções de instalação

2. **Combine o certificado com sua chave privada:**
   ```bash
   # O certificado completo será: certificado + chave privada
   cat certificado_itau.crt chave_privada.key > certificado_completo.pem
   ```

### **Passo 5: Configurar no Servidor (Render)**

No Render, você precisará:

1. **Adicionar variáveis de ambiente:**
   ```
   ITAU_CLIENT_ID=seu_client_id_producao
   ITAU_CLIENT_SECRET=seu_client_secret_producao
   ITAU_PIX_KEY=63824145000127
   ITAU_ENV=production
   ```

2. **Armazenar certificado e chave:**
   - Opção 1: Variáveis de ambiente (não recomendado para certificados grandes)
   - Opção 2: Arquivo no servidor (melhor)
   - Opção 3: Serviço de gerenciamento de segredos

3. **Configurar mTLS no código:**
   ```javascript
   // Exemplo de configuração axios com mTLS
   const httpsAgent = new https.Agent({
     cert: fs.readFileSync('certificado_completo.pem'),
     key: fs.readFileSync('chave_privada.key'),
     rejectUnauthorized: true
   });
   
   axios.post(url, data, { httpsAgent });
   ```

## 🔗 Links Úteis

- **Portal Itaú for Developers**: https://devportal.itau.com.br
- **Autosserviço de Credenciais**: https://devportal.itau.com.br/certificado-dinamico-credenciais
- **Documentação de Autenticação**: https://devportal.itau.com.br/autenticacao-documentacao
- **Suporte Itaú**: Entre em contato com seu gerente de conta

## ⚠️ Importante

1. **Segurança:**
   - ⚠️ **NUNCA** commite a chave privada no Git
   - ⚠️ Mantenha a chave privada em local seguro
   - ⚠️ Use variáveis de ambiente ou serviços de segredos

2. **Tempo de Processamento:**
   - Solicitação ao Itaú: 3-7 dias úteis
   - Geração do certificado: 1-2 dias úteis após envio do CSR

3. **Custos:**
   - Verifique com o Itaú se há custos associados à API PIX em produção

## 🧪 Alternativa: Usar Sandbox Primeiro

**Recomendação**: Use **sandbox** para desenvolver e testar:

```
ITAU_ENV=sandbox
```

Isso permite:
- ✅ Testar toda a integração
- ✅ Validar o fluxo de pagamento
- ✅ Não requer certificado mTLS
- ✅ Credenciais mais fáceis de obter

Depois, quando estiver pronto para produção, solicite o certificado mTLS.

## 📞 Próximos Passos

1. **Contatar gerente de conta Itaú**
2. **Solicitar Client ID e Token Temporário de produção**
3. **Gerar par de chaves (OpenSSL)**
4. **Enviar CSR ao Itaú**
5. **Aguardar certificado assinado**
6. **Configurar no servidor**

## 💡 Dica

Se você ainda não tem acesso ao gerente de conta do Itaú:
- Entre em contato com o suporte comercial do Itaú
- Explique que precisa integrar API PIX para recebimentos
- Eles direcionarão você para o setor correto

