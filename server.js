const path = require('path');
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

// Fallback env variables (Vercel crash hone se rokne ke liye)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_secure_jwt_secret_2026';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vendorbridge.com';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes: /api/auth aur /auth dono map kiye taaki 404 na aaye
const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const dashRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/vendors', vendorRoutes);
app.use('/vendors', vendorRoutes);

app.use('/api/dashboard', dashRoutes);
app.use('/dashboard', dashRoutes);

// Root route redirect
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Auto-seed default Procurement Officer account (Registration ki zaroorat nahi padegi)
try {
  const seedEmail = 'admin@vendorbridge.com';
  const existingUser = db.prepare('SELECT id FROM users WHERE email=?').get(seedEmail);
  if (!existingUser) {
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
      seedEmail,
      bcrypt.hashSync('Admin@123', 10),
      'Procurement Officer'
    );
  }
} catch (e) {
  console.error('Seed user error:', e);
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
