const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { auth } = require('../middleware');

const ROLES = ['Procurement Officer', 'Vendor', 'Manager/Approver'];
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
const pwOk = p => typeof p === 'string' && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

function setCookie(res, u) {
  const token = jwt.sign({ id: u.id, name: u.name, role: u.role },
    process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie('token', token, {
    httpOnly: true, sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 3600e3
  });
}

router.post('/register', (req, res) => {
  const { first_name, last_name, email, phone, country, additional_info, password, role } = req.body;
  if (!first_name?.trim()) return res.status(400).json({ error: 'First name is required' });
  if (!last_name?.trim()) return res.status(400).json({ error: 'Last name is required' });
  if (!emailOk(email)) return res.status(400).json({ error: 'Valid email required' });
  if (!/^\d{10}$/.test(phone || '')) return res.status(400).json({ error: 'Phone must be 10 digits' });
  if (!country?.trim()) return res.status(400).json({ error: 'Country is required' });
  if (!pwOk(password)) return res.status(400).json({ error: 'Password: min 8 chars, letters and numbers' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email.toLowerCase()))
    return res.status(409).json({ error: 'Email already registered' });

  db.prepare(`INSERT INTO users(name,first_name,last_name,phone,country,additional_info,email,password_hash,role)
    VALUES(?,?,?,?,?,?,?,?,?)`).run(first_name.trim() + ' ' + last_name.trim(), first_name.trim(),
    last_name.trim(), phone, country.trim(), (additional_info || '').trim(),
    email.toLowerCase(), bcrypt.hashSync(password, 10), role);
  res.status(201).json({ message: 'Registered. Please log in.' });
});

router.post('/login', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get((req.body.email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(req.body.password || '', u.password_hash))
    return res.status(401).json({ error: 'Invalid email or password' });
  setCookie(res, u);
  res.json({ user: { name: u.name, role: u.role } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/me', auth, (req, res) => res.json({ user: req.user }));

router.post('/forgot', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get((req.body.email || '').toLowerCase());
  const out = { message: 'If that email exists, a reset link has been generated.' };
  if (u) {
    const t = crypto.randomBytes(32).toString('hex');
    db.prepare('UPDATE users SET reset_token=?, reset_expires=? WHERE id=?')
      .run(t, Date.now() + 3600e3, u.id);
    const link = `http://localhost:${process.env.PORT || 3000}/reset.html?token=${t}`;
    console.log('PASSWORD RESET LINK:', link);
    if (process.env.NODE_ENV !== 'production') out.devResetLink = link;
  }
  res.json(out);
});

router.post('/reset', (req, res) => {
  const { token, password } = req.body;
  if (!pwOk(password)) return res.status(400).json({ error: 'Password: min 8 chars, letters and numbers' });
  const u = db.prepare('SELECT * FROM users WHERE reset_token=? AND reset_expires>?').get(token || '', Date.now());
  if (!u) return res.status(400).json({ error: 'Invalid or expired token' });
  db.prepare('UPDATE users SET password_hash=?, reset_token=NULL, reset_expires=NULL WHERE id=?')
    .run(bcrypt.hashSync(password, 10), u.id);
  res.json({ message: 'Password updated. Please log in.' });
});

module.exports = router;
