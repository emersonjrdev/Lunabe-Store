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
router.post("/", upload.single("image"), async (req, res) => {
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

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "lunabe_products",
      });
      images.push(result.secure_url);
    }

    const product = await Product.create({
      name,
      description,
      price_cents: Number(price_cents),
      stock: Number(stock),
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
