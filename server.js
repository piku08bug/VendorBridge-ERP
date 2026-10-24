const path = require('path');
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fallback values taaki Vercel par bina .env ke backend crash na ho
process.env.JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_jwt_secret_key_2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vendorbridge.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

const db = require('./db');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes: /api/auth aur /auth dono ko map kiya hai
const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const dashRoutes = require('./routes/dashboard');

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/vendors', '/vendors'], vendorRoutes);
app.use(['/api/dashboard', '/dashboard'], dashRoutes);

// Protected routes check
app.use((req, res, next) => {
  if (['/dashboard.html', '/vendors.html', '/module.html'].includes(req.path)) {
    try { 
      jwt.verify(req.cookies.token, process.env.JWT_SECRET); 
    } catch { 
      return res.redirect('/login.html'); 
    }
  }
  next();
});

app.get('/', (req, res) => res.redirect('/login.html'));

// Safe Admin Seeding
try {
  const hasAdmin = db.prepare("SELECT 1 FROM users WHERE role='Admin'").get();
  if (!hasAdmin) {
    db.prepare(`
      INSERT INTO users(name, first_name, last_name, phone, country, email, password_hash, role)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Admin', 'Admin', 'User', '9999999999', 'India', ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10), 'Admin');
  }
} catch (err) {
  console.error('Seed error:', err.message);
}

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log('Running on http://localhost:' + port));
}

module.exports = app;
