const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../authMiddleware');
const auth = authMiddleware.auth || authMiddleware;

const JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_secure_jwt_2026';

// Safe SQLite Column migration (kabhi crash nahi hoga)
try { db.exec("ALTER TABLE users ADD COLUMN first_name TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE users ADD COLUMN last_name TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE users ADD COLUMN country TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE users ADD COLUMN additional_info TEXT;"); } catch(e){}

// Safe Register
router.post('/register', (req, res) => {
  try {
    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');
    const fName = String(b.first_name || b.firstName || '').trim();
    const lName = String(b.last_name || b.lastName || '').trim();
    const name = String(b.name || (fName + ' ' + lName).trim() || 'User').trim();
    const phone = String(b.phone || b.mobile || '9999999999').trim();
    const country = String(b.country || 'India').trim();
    const additional_info = String(b.additional_info || b.additionalInfo || '').trim();
    const role = String(b.role || 'Procurement Officer').trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered. Please log in.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    try {
      db.prepare(`
        INSERT INTO users (name, first_name, last_name, phone, country, additional_info, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, fName, lName, phone, country, additional_info, email, password_hash, role);
    } catch (insertErr) {
      db.prepare(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `).run(name, email, password_hash, role);
    }

    return res.status(201).json({ message: 'Registered. Please log in.' });
  } catch (err) {
    console.error('Register route error:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Safe Login
router.post('/login', (req, res) => {
  try {
    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter email and password' });
    }

    const u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!u || !bcrypt.compareSync(password, u.password_hash)) {
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
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ user: { id: u.id, name: u.name, role: u.role } });
  } catch (err) {
    console.error('Login route error:', err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
});

router.get('/me', auth, (req, res) => {
  return res.json({ user: req.user });
});

router.post('/forgot', (req, res) => {
  return res.json({ message: 'If that email exists, a reset link has been generated.' });
});

module.exports = router;
