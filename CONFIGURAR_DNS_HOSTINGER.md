# Como Configurar DNS do SendGrid no Hostinger

## 📍 Onde Configurar

Como seu domínio `lunabe.com.br` está registrado no **Hostinger**, você precisa adicionar os registros DNS no painel do Hostinger.

## 📋 Passo a Passo no Hostinger

### 1. Acessar o Painel do Hostinger

1. Acesse: https://www.hostinger.com.br
2. Faça login na sua conta
3. Vá em **"Domínios"** ou **"Meus Domínios"**

### 2. Gerenciar DNS do Domínio

1. Encontre o domínio `lunabe.com.br`
2. Clique em **"Gerenciar"** ou **"DNS"**
3. Procure por **"Zona DNS"** ou **"Gerenciamento de DNS"**

### 3. Adicionar os Registros CNAME

Para cada registro CNAME abaixo, clique em **"Adicionar Registro"** ou **"Novo Registro"**:

#### Registro 1:
- **Tipo**: CNAME
- **Nome/Host**: `url3074.www.lunabe.com.br`
- **Valor/Destino**: `sendgrid.net`
- **TTL**: 3600 (ou padrão)

#### Registro 2:
- **Tipo**: CNAME
- **Nome/Host**: `57723168.www.lunabe.com.br`
- **Valor/Destino**: `sendgrid.net`
- **TTL**: 3600 (ou padrão)

#### Registro 3:
- **Tipo**: CNAME
- **Nome/Host**: `em3430.www.lunabe.com.br`
- **Valor/Destino**: `u57723168.wl169.sendgrid.net`
- **TTL**: 3600 (ou padrão)

#### Registro 4:
- **Tipo**: CNAME
- **Nome/Host**: `s1._domainkey.www.lunabe.com.br`
- **Valor/Destino**: `s1.domainkey.u57723168.wl169.sendgrid.net`
- **TTL**: 3600 (ou padrão)

#### Registro 5:
- **Tipo**: CNAME
- **Nome/Host**: `s2._domainkey.www.lunabe.com.br`
- **Valor/Destino**: `s2.domainkey.u57723168.wl169.sendgrid.net`
- **TTL**: 3600 (ou padrão)

### 4. Adicionar o Registro TXT

- **Tipo**: TXT
- **Nome/Host**: `_dmarc.www.lunabe.com.br`
- **Valor**: `v=DMARC1; p=nenhum;`
- **TTL**: 3600 (ou padrão)

## ⚠️ Importante no Hostinger

Alguns painéis do Hostinger podem pedir apenas a parte **antes do domínio**:

- Se pedir apenas o nome (sem o domínio), use:
  - `url3074.www` (ao invés de `url3074.www.lunabe.com.br`)
  - `57723168.www`
  - `em3430.www`
  - `s1._domainkey.www`
  - `s2._domainkey.www`
  - `_dmarc.www`

## 🔄 Alternativa: Usar Cloudflare (Recomendado)

Se você quiser mais controle e facilidade:

1. **Criar conta no Cloudflare** (gratuito): https://cloudflare.com
2. **Adicionar seu domínio** no Cloudflare
3. **Alterar os nameservers** no Hostinger para os do Cloudflare
4. **Configurar os registros DNS** no Cloudflare (mais fácil)

## ⏱️ Tempo de Propagação

- Após adicionar os registros, pode levar **15 minutos a 48 horas**
- Geralmente leva **30-60 minutos**
- O SendGrid verificará automaticamente

## ✅ Verificar no SendGrid

1. No SendGrid, vá em **Settings** → **Sender Authentication**
2. Clique no domínio `lunabe.com.br`
3. Você verá o status de cada registro:
   - ✅ **Verificado** = Pronto!
   - ⏳ **Pendente** = Aguardando propagação
   - ❌ **Falhou** = Verifique se o registro está correto

## 🆘 Se Não Encontrar a Opção DNS

Se não encontrar onde adicionar DNS no Hostinger:

1. Entre em contato com o suporte do Hostinger
2. Peça para adicionar registros DNS CNAME e TXT
3. Ou considere usar Cloudflare (mais fácil de gerenciar)

## 📝 Nota sobre Vercel

O **Vercel** é apenas para hospedar o frontend. Os registros DNS do SendGrid devem ser adicionados no **Hostinger** (onde o domínio está registrado), não no Vercel.

