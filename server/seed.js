import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Product from './models/Product.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await Product.countDocuments();
  if (existing === 0) {
    await Product.create([
      { name: 'Pijama Lua', description: 'Pijama macio e confortável', price_cents: 12990, images: ['/images/pijama1.jpg'], stock: 10, sizes: ['P','M','G'], colors: ['Rosa','Branco'] },
      { name: 'Pijama Estrelas', description: 'Conjunto estampado com estrelas', price_cents: 14990, images: ['/images/pijama2.jpg'], stock: 8, sizes: ['P','M','G','GG'], colors: ['Azul','Preto'] },
      { name: 'Pijama Flower', description: 'Pijama com estampa floral', price_cents: 13990, images: ['/images/pijama3.jpg'], stock: 5, sizes: ['P','M'], colors: ['Rosa','Verde'] }
    ]);
    console.log('Seeded products');
  } else {
    console.log('Products already exist');
  }
  process.exit();
}
seed();
