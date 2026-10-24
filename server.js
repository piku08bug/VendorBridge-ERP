const path = require('path');
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fallback values: Vercel par bina .env ke crash hone se rokne ke liye
process.env.JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_secure_jwt_2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vendorbridge.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes import
const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const dashRoutes = require('./routes/dashboard');

// Saare possible frontend prefixes map kar diye taaki 404 na aaye
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/', authRoutes);

app.use('/api/vendors', vendorRoutes);
app.use('/vendors', vendorRoutes);

app.use('/api/dashboard', dashRoutes);
app.use('/dashboard', dashRoutes);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Auto-seed pre-made user (Procurement Officer)
try {
  const existing = db.prepare("SELECT id FROM users WHERE email=?").get(ADMIN_EMAIL);
  if (!existing) {
    db.prepare(`
      INSERT INTO users (name, first_name, last_name, phone, country, additional_info, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Demo Admin',
      'Demo',
      'Admin',
      '9999999999',
      'India',
      'Initial Setup',
      ADMIN_EMAIL,
      bcrypt.hashSync(ADMIN_PASSWORD, 10),
      'Procurement Officer'
    );
  }
} catch (err) {
  console.log('Seed info:', err.message);
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log('Running on http://localhost:' + port));
}

module.exports = app;
