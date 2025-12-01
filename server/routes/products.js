import express from "express";
import Product from "../models/Product.js";
import cloudinary from "../utils/cloudinary.js";
import multer from "multer";

const upload = multer({ dest: "/tmp" });
const router = express.Router();

// GET ALL
router.get("/", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// GET BY ID
router.get("/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

// CREATE PRODUCT + CLOUDINARY UPLOAD
router.post("/", upload.array("images", 13), async (req, res) => {
  try {
    const { name, description, price_cents, stock } = req.body;
    // sizes and colors can be sent as comma-separated strings from the admin UI
    const parseCsv = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return String(val).split(',').map(s => s.trim()).filter(Boolean);
    };
    const sizes = parseCsv(req.body.sizes);
    const colors = parseCsv(req.body.colors);

    let images = [];

    // Processar múltiplas imagens (até 13)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "lunabe_products",
        });
        images.push(result.secure_url);
      }
    }

    // Processar estoque por variante (cor + tamanho)
    const stockByVariant = new Map();
    let totalStock = 0;
    
    // Se stockByVariant foi enviado como JSON string ou objeto
    if (req.body.stockByVariant) {
      let stockData;
      try {
        stockData = typeof req.body.stockByVariant === 'string' 
          ? JSON.parse(req.body.stockByVariant) 
          : req.body.stockByVariant;
      } catch (e) {
        stockData = {};
      }
      
      // Processar cada variante: "P-Rosa": 10
      Object.entries(stockData).forEach(([variant, qty]) => {
        const quantity = parseInt(qty) || 0;
        if (quantity > 0) {
          stockByVariant.set(variant, quantity);
          totalStock += quantity;
        }
      });
    } else {
      // Se não foi enviado stockByVariant, criar a partir de sizes e colors
      // e usar o stock geral para todas as combinações
      const generalStock = Number(stock) || 0;
      if (sizes.length > 0 && colors.length > 0) {
        sizes.forEach(size => {
          colors.forEach(color => {
            const variant = `${size}-${color}`;
            stockByVariant.set(variant, generalStock);
            totalStock += generalStock;
          });
        });
      } else {
        // Se não tem sizes/colors, usar stock geral
        totalStock = generalStock;
      }
    }

    const product = await Product.create({
      name,
      description,
      price_cents: Number(price_cents),
      stock: totalStock, // Estoque total para compatibilidade
      stockByVariant: stockByVariant.size > 0 ? stockByVariant : undefined,
      images,
      sizes,
      colors,
      createdAt: new Date(),
    });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

export default router;
