# 🛍️ Lunabê Store - E-commerce de Pijamas

Sistema completo de e-commerce desenvolvido para a Lunabê, especializado em pijamas premium. Plataforma moderna com integração de pagamentos PIX, painel administrativo completo e experiência de compra otimizada.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Deploy](#deploy)
- [API](#api)

## 🎯 Sobre o Projeto

Lunabê Store é uma plataforma de e-commerce completa desenvolvida para venda de pijamas premium. O sistema oferece uma experiência de compra fluida, desde a navegação pelos produtos até o pagamento via PIX, com gerenciamento completo de pedidos e estoque.

### Características Principais

- ✨ Interface moderna e responsiva
- 🛒 Carrinho de compras persistente
- 💳 Integração com AbacatePay (pagamentos PIX)
- 👤 Autenticação com Google OAuth e login manual
- 📦 Painel administrativo completo
- 📧 Notificações por email
- 🎨 Modo escuro/claro
- 📱 Totalmente responsivo

## 🚀 Tecnologias Utilizadas

### Frontend
- **React.js** - Biblioteca JavaScript para interfaces
- **Vite** - Build tool e dev server
- **TailwindCSS** - Framework CSS utilitário
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Font Awesome** - Ícones

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação por tokens
- **Cloudinary** - Armazenamento de imagens
- **Nodemailer** - Envio de emails
- **Multer** - Upload de arquivos
- **Express Rate Limit** - Proteção contra abuso

### Integrações
- **AbacatePay** - Gateway de pagamento PIX
- **Google OAuth 2.0** - Login social
- **Cloudinary** - CDN de imagens
- **Gmail** - Serviço de email

## ✨ Funcionalidades

### Para Clientes
- 🏠 Página inicial com produtos em destaque
- 🔍 Busca e filtros de produtos
- 📱 Visualização detalhada de produtos com múltiplas imagens
- 🛒 Carrinho de compras com persistência
- 💰 Cupom de desconto exclusivo (LUNABE20) para clientes que já compraram
- 👤 Autenticação via Google ou email/senha
- 📦 Acompanhamento de pedidos em tempo real
- 📧 Notificações por email sobre status do pedido
- 🎨 Modo escuro/claro

### Para Administradores
- 🔐 Painel administrativo protegido por senha
- ➕ Cadastro de produtos com múltiplas imagens
- 📊 Gerenciamento de estoque
- 📦 Visualização e gerenciamento de pedidos
- 🏷️ Atualização de status de pedidos
- 📮 Adição de códigos de rastreamento
- 🗑️ Exclusão de produtos e pedidos
- 🧹 Limpeza de pedidos de teste

### Sistema
- 🔒 Autenticação JWT
- 🛡️ Rate limiting para proteção
- ✅ Validação de dados no backend
- 📦 Controle de estoque automático
- 📧 Notificações automáticas por email
- 🔄 Webhooks para atualização de pagamentos
- 🖼️ Upload e otimização de imagens

## 📁 Estrutura do Projeto

```
Lunabe-Store/
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # Modelos do MongoDB
│   ├── routes/            # Rotas da API
│   ├── utils/             # Utilitários (Cloudinary, Email, etc.)
│   ├── index.js           # Servidor principal
│   └── package.json       # Dependências do backend
│
├── src/                    # Frontend (React + Vite)
│   ├── components/        # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # Serviços (API, pagamento)
│   ├── hooks/             # Custom hooks
│   ├── context/           # Context API (tema)
│   ├── utils/             # Utilitários
│   └── App.jsx            # Componente principal
│
├── public/                 # Arquivos estáticos
└── package.json           # Dependências do frontend
```

## 🔧 Instalação

### Pré-requisitos
- Node.js (v18 ou superior)
- MongoDB (local ou MongoDB Atlas)
- Conta no Cloudinary (para imagens)
- Conta no AbacatePay (para pagamentos)
- Conta Gmail (para emails)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/emersonjrdev/Lunabe-Store.git
cd Lunabe-Store
```

2. **Instale as dependências do frontend**
```bash
npm install
```

3. **Instale as dependências do backend**
```bash
cd server
npm install
cd ..
```

## ⚙️ Configuração

### Backend (.env)

Crie um arquivo `.env` na pasta `server/` com as seguintes variáveis:

```env
# Servidor
PORT=4001
FRONTEND_URL=http://localhost:5173

# Banco de Dados
MONGODB_URI=sua_string_de_conexao_mongodb

# Cloudinary (Imagens)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# JWT
JWT_SECRET=sua_chave_secreta_jwt

# AbacatePay (Pagamentos)
ABACATEPAY_API_KEY=sua_api_key_abacatepay
ABACATEPAY_SECRET_KEY=sua_secret_key_abacatepay
ABACATEPAY_WEBHOOK_SECRET=sua_webhook_secret
ABACATEPAY_ENV=sandbox  # ou 'production'

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id

# Email (Gmail)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_gmail

# Admin
ADMIN_PASSWORD=sua_senha_admin
```

### Frontend (.env)

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_BASE=http://localhost:4001
VITE_GOOGLE_CLIENT_ID=seu_google_client_id
```

## 🎮 Como Usar

### Desenvolvimento

1. **Inicie o servidor backend**
```bash
cd server
npm run dev
```

2. **Inicie o servidor frontend** (em outro terminal)
```bash
npm run dev
```

3. **Acesse a aplicação**
- Frontend: http://localhost:5173
- Backend: http://localhost:4001

### Produção

O sistema está configurado para deploy em:
- **Frontend**: Vercel
- **Backend**: Render

Configure as variáveis de ambiente nas respectivas plataformas.

## 📡 API

### Endpoints Principais

#### Produtos
- `GET /api/products` - Listar todos os produtos
- `GET /api/products/:id` - Obter produto por ID
- `POST /api/products` - Criar produto (admin)
- `DELETE /api/products/:id` - Deletar produto (admin)

#### Pedidos
- `GET /api/orders?email=...` - Listar pedidos do usuário
- `GET /api/orders/:id` - Obter pedido por ID
- `POST /api/orders/create-checkout-session` - Criar sessão de checkout
- `PATCH /api/orders/:id/status` - Atualizar status (admin)
- `PATCH /api/orders/:id/tracking` - Adicionar código de rastreamento (admin)

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Login com Google
- `GET /api/auth/me` - Obter usuário atual

#### Webhooks
- `POST /api/webhooks/abacatepay` - Webhook do AbacatePay

## 🚀 Deploy

### Frontend (Vercel)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente:
   - `VITE_API_BASE` - URL do backend
   - `VITE_GOOGLE_CLIENT_ID` - Client ID do Google

### Backend (Render)

1. Crie um novo Web Service no Render
2. Conecte o repositório
3. Configure:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
4. Adicione todas as variáveis de ambiente do `.env`

### Google OAuth

Configure no Google Cloud Console:
- **Authorized JavaScript origins**: URL do frontend
- **Authorized redirect URIs**: `https://seu-dominio.com/google-redirect`

## 📝 Licença

Este projeto é proprietário e confidencial.

## 👨‍💻 Desenvolvido por

Sistema desenvolvido para Lunabê Pijamas.

---

**Versão:** 1.0.0  
**Última atualização:** 2025




