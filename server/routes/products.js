import express from 'express';
import Product from '../models/Product.js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';
const upload = multer({ dest: '/tmp' });

const router = express.Router();

router.get('/', async (req, res) => {
  const products = await Product.find().sort({createdAt:-1});
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({error:'Not found'});
  res.json(p);
});

// admin: create product with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price_cents, stock } = req.body;
    let images = [];
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'lunabe_products' });
      images.push(result.secure_url);
    }
    const product = await Product.create({ name, description, price_cents: Number(price_cents), stock: Number(stock), images });
    res.json(product);
  } catch (err) { console.error(err); res.status(500).json({error:'Server error'}); }
});

export default router;
