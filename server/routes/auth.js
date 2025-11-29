import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
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
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, address: user.address || null } });
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
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, address: user.address || null } });
  } catch (err) { console.error(err); res.status(500).json({error:'Server error'}); }
});

// Social (Google) login — frontend (Firebase) can call this after successful OAuth
router.post('/google', async (req, res) => {
  try {
    // Expecting idToken from Google Identity Services on the frontend
    const { idToken, email, name } = req.body;

    let profileEmail = email;
    let profileName = name;

    if (idToken) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) return res.status(500).json({ error: 'Server misconfigured: GOOGLE_CLIENT_ID missing' });

      // Verify the token and handle verification errors clearly
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({ idToken, audience: clientId });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
          console.error('Google ID token verified but payload missing email:', payload);
          return res.status(401).json({ error: 'Invalid Google token: no email in payload' });
        }

        profileEmail = payload.email;
        profileName = payload.name || payload.email?.split('@')[0];
      } catch (verifyErr) {
        // Log error detail on server so you can inspect in terminal
        console.error('Google token verification failed:', verifyErr?.message || verifyErr);
        // Return a clearer client-facing error
        return res.status(401).json({ error: 'Invalid idToken', detail: verifyErr?.message || String(verifyErr) });
      }
    }

    if (!profileEmail) return res.status(400).json({ error: 'Missing email' });

    // find or create user — no password required for social accounts
    let user = await User.findOne({ email: profileEmail });
    if (!user) {
      user = await User.create({ email: profileEmail, name: profileName || '', passwordHash: '' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, address: user.address || null } });
  } catch (err) {
    console.error('Social login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
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
