const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth } = require('../authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_secure_jwt_2026';

// 1. Safe Register Route
router.post('/register', (req, res) => {
  try {
    const b = req.body || {};
    const fName = String(b.first_name || b.firstName || (b.name ? b.name.split(' ')[0] : '') || 'User').trim();
    const lName = String(b.last_name || b.lastName || (b.name ? b.name.split(' ').slice(1).join(' ') : '') || '').trim();
    const fullName = String(b.name || (fName + ' ' + lName)).trim();
    const phone = String(b.phone || b.mobile || '9999999999').trim();
    const country = String(b.country || 'India').trim();
    const addInfo = String(b.additional_info || b.additionalInfo || '').trim();
    const email = String(b.email || '').toLowerCase().trim();
    const password = String(b.password || '');
    const role = b.role || 'Procurement Officer';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = bcrypt.hashSync(password, 10);

    // Try full table insert; fallback to basic columns if schema differs
    try {
      db.prepare(`
        INSERT INTO users (name, first_name, last_name, phone, country, additional_info, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fullName, fName, lName, phone, country, addInfo, email, hash, role);
    } catch (dbErr) {
      db.prepare(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `).run(fullName, email, hash, role);
    }

    return res.status(201).json({ message: 'Registered. Please log in.' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Server registration error' });
  }
});

// 2. Safe Login Route
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').toLowerCase().trim();
    const u = db.prepare('SELECT * FROM users WHERE email=?').get(cleanEmail);

    if (!u || !bcrypt.compareSync(String(password || ''), u.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: u.id, name: u.name, role: u.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res.json({ user: { name: u.name, role: u.role } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/forgot', (req, res) => {
  res.json({ message: 'If that email exists, a reset link has been generated.' });
});

module.exports = router;
