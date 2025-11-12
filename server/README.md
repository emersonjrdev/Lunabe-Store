# Lunabe Store - Server

## Setup
1. Copy `.env.example` to `.env` and fill values (MongoDB URI, Cloudinary keys, Stripe keys, Gmail credentials)
2. Install dependencies: `npm install`
3. Seed sample products: `node seed.js`
4. Start server: `npm run dev` or `npm start`

## Stripe webhook
When deploying, configure your Stripe webhook endpoint to point to `/api/orders/webhook` and set `STRIPE_WEBHOOK_SECRET` in .env.
