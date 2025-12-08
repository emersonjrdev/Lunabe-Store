# Como Configurar DNS do SendGrid

## 📍 Onde Configurar

Você precisa adicionar esses registros DNS no **painel de controle do seu domínio** (onde você comprou/gerencia o domínio `lunabe.com.br`).

## 🔍 Onde Está Seu Domínio?

O domínio pode estar gerenciado em:
- **Registro.br** (se o domínio .br foi registrado lá)
- **Cloudflare** (se você usa Cloudflare)
- **GoDaddy, Namecheap, Hostinger** (se registrou em outro provedor)
- **Outro provedor de DNS**

## 📋 Passos para Configurar

### 1. Identificar Onde Está o DNS

1. Acesse o painel onde você gerencia o domínio `lunabe.com.br`
2. Procure por:
   - **DNS**
   - **Gerenciamento de DNS**
   - **Zona DNS**
   - **Registros DNS**

### 2. Adicionar os Registros CNAME

Adicione cada um desses registros CNAME:

| Tipo | Nome/Host | Valor/Destino |
|------|-----------|---------------|
| CNAME | `url3074.www.lunabe.com.br` | `sendgrid.net` |
| CNAME | `57723168.www.lunabe.com.br` | `sendgrid.net` |
| CNAME | `em3430.www.lunabe.com.br` | `u57723168.wl169.sendgrid.net` |
| CNAME | `s1._domainkey.www.lunabe.com.br` | `s1.domainkey.u57723168.wl169.sendgrid.net` |
| CNAME | `s2._domainkey.www.lunabe.com.br` | `s2.domainkey.u57723168.wl169.sendgrid.net` |

### 3. Adicionar o Registro TXT

| Tipo | Nome/Host | Valor |
|------|-----------|-------|
| TXT | `_dmarc.www.lunabe.com.br` | `v=DMARC1; p=nenhum;` |

## 📝 Exemplo de Como Adicionar (Registro.br)

Se seu domínio está no **Registro.br**:

1. Acesse: https://registro.br
2. Faça login
3. Vá em **Meus Domínios** → **lunabe.com.br**
4. Clique em **"Gerenciar DNS"** ou **"Zona DNS"**
5. Clique em **"Adicionar"** ou **"Novo Registro"**
6. Para cada registro:
   - **Tipo**: Selecione CNAME ou TXT
   - **Nome**: Cole o nome (ex: `url3074.www.lunabe.com.br`)
   - **Valor**: Cole o valor (ex: `sendgrid.net`)
   - **TTL**: Deixe padrão (geralmente 3600)
7. Salve cada registro

## 📝 Exemplo de Como Adicionar (Cloudflare)

Se você usa **Cloudflare**:

1. Acesse: https://dash.cloudflare.com
2. Selecione o domínio `lunabe.com.br`
3. Vá em **DNS** → **Records**
4. Clique em **"Add record"**
5. Para cada registro:
   - **Type**: Selecione CNAME ou TXT
   - **Name**: Cole o nome (ex: `url3074.www.lunabe.com.br`)
   - **Target/Content**: Cole o valor (ex: `sendgrid.net`)
   - **Proxy status**: Desmarque (DNS only)
6. Clique em **Save**

## ⏱️ Propagação DNS

Após adicionar os registros:
- Pode levar de **5 minutos a 48 horas** para propagar
- Geralmente leva **15-30 minutos**
- O SendGrid verificará automaticamente quando estiver pronto

## ✅ Verificar no SendGrid

1. No SendGrid, vá em **Settings** → **Sender Authentication**
2. Clique no domínio que você está verificando
3. O SendGrid mostrará o status de cada registro:
   - ✅ Verde = Verificado
   - ⏳ Amarelo = Aguardando propagação
   - ❌ Vermelho = Não encontrado

## 🔍 Verificar Propagação Manualmente

Você pode verificar se os registros já propagaram usando:

```bash
# No terminal (ou use um site como https://mxtoolbox.com)
nslookup url3074.www.lunabe.com.br
nslookup 57723168.www.lunabe.com.br
nslookup em3430.www.lunabe.com.br
```

## ⚠️ Importante

- **Não remova** os registros existentes do domínio
- **Adicione** apenas esses novos registros
- O nome deve ser **exatamente** como mostrado (incluindo `www.lunabe.com.br`)
- Alguns provedores podem pedir apenas a parte antes do domínio (ex: apenas `url3074`)

## 🆘 Precisa de Ajuda?

Se não souber onde está o DNS do seu domínio:
1. Acesse: https://whois.net
2. Digite: `lunabe.com.br`
3. Procure por **"Name Servers"** ou **"Servidores DNS"**
4. Isso mostrará onde o DNS está gerenciado





