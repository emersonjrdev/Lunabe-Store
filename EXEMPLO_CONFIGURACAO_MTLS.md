# 🔧 Exemplo de Configuração mTLS para Itaú PIX

## 📝 Quando você tiver o certificado mTLS

Após obter o certificado do Itaú, você precisará configurar o mTLS no código.

## 🔧 Opção 1: Usar Variáveis de Ambiente (Render)

### No Render, adicione:

```
ITAU_CERT_PATH=/etc/certs/certificado.pem
ITAU_KEY_PATH=/etc/certs/chave_privada.key
```

### No código (exemplo futuro):

```javascript
import https from 'https';
import fs from 'fs';

// Configurar agente HTTPS com mTLS
const httpsAgent = new https.Agent({
  cert: fs.readFileSync(process.env.ITAU_CERT_PATH),
  key: fs.readFileSync(process.env.ITAU_KEY_PATH),
  rejectUnauthorized: true
});

// Usar em requisições axios
axios.post(url, data, { httpsAgent });
```

## 🔧 Opção 2: Usar Variáveis de Ambiente (Conteúdo do Certificado)

### No Render, adicione o conteúdo completo:

```
ITAU_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
ITAU_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### No código:

```javascript
import https from 'https';

const httpsAgent = new https.Agent({
  cert: process.env.ITAU_CERT,
  key: process.env.ITAU_KEY,
  rejectUnauthorized: true
});
```

## ⚠️ Importante

1. **Segurança**: Nunca commite certificados ou chaves no Git
2. **Render**: Use variáveis de ambiente ou armazene em disco (se possível)
3. **Teste**: Sempre teste em sandbox primeiro

## 📚 Documentação

- Guia completo: `COMO_OBTER_CERTIFICADO_MTLS_ITAU.md`
- Portal Itaú: https://devportal.itau.com.br

