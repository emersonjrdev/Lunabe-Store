import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({error:'Missing fields'});
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({error:'Email already registered'});
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, passwordHash: hash });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err); res.status(500).json({error:'Server error'});
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({error:'Missing fields'});
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({error:'Invalid credentials'});
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({error:'Invalid credentials'});
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) { console.error(err); res.status(500).json({error:'Server error'}); }
});

router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({error:'Unauthorized'});
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    res.json({ user });
  } catch (err) { console.error(err); res.status(401).json({error:'Unauthorized'}); }
});

export default router;
