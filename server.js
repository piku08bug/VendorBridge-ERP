require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Protected pages: login nahi to login page pe bhejo
app.use((req, res, next) => {
  if (['/dashboard.html', '/vendors.html', '/module.html'].includes(req.path)) {
    try { jwt.verify(req.cookies.token, process.env.JWT_SECRET); }
    catch { return res.redirect('/login.html'); }
  }
  next();
});

app.use(express.static('public'));
app.get('/', (req, res) => res.redirect('/dashboard.html'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// Pehli baar Admin user bana do
if (!db.prepare("SELECT 1 FROM users WHERE role='Admin'").get()) {
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)')
    .run('Admin', process.env.ADMIN_EMAIL, bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10), 'Admin');
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Running on http://localhost:' + port));

module.exports = app;
