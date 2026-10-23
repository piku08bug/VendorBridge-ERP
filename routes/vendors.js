const router = require('express').Router();
const db = require('../db');
const { auth, allow } = require('../middleware');

const STATUSES = ['Active', 'Pending', 'Blocked'];
const GST = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const READ = ['Procurement Officer', 'Manager/Approver', 'Admin'];
const WRITE = ['Procurement Officer', 'Admin'];

function validate(b) {
  for (const f of ['name', 'category', 'gst_number', 'contact_person', 'email', 'phone'])
    if (!String(b[f] || '').trim()) return `${f.replace('_', ' ')} is required`;
  if (!GST.test(b.gst_number.toUpperCase())) return 'Invalid GSTIN (e.g. 29ABCDE1234F1Z5)';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) return 'Invalid email';
  if (!/^\d{10}$/.test(b.phone)) return 'Phone must be 10 digits';
  if (!STATUSES.includes(b.status || 'Active')) return 'Invalid status';
}

router.use(auth);

router.get('/', allow(...READ), (req, res) => {
  const { q = '', category = '', status = '' } = req.query;
  const rows = db.prepare(`SELECT * FROM vendors WHERE
    (name LIKE @q OR gst_number LIKE @q OR contact_person LIKE @q OR email LIKE @q OR category LIKE @q)
    AND (@c='' OR category=@c) AND (@s='' OR status=@s) ORDER BY id DESC`)
    .all({ q: `%${q}%`, c: category, s: status });
  res.json(rows);
});

router.get('/:id', allow(...READ), (req, res) => {
  const v = db.prepare('SELECT * FROM vendors WHERE id=?').get(req.params.id);
  v ? res.json(v) : res.status(404).json({ error: 'Vendor not found' });
});

router.post('/', allow(...WRITE), (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const b = req.body;
  const r = db.prepare(`INSERT INTO vendors(name,category,gst_number,contact_person,email,phone,address,status)
    VALUES(?,?,?,?,?,?,?,?)`).run(b.name.trim(), b.category, b.gst_number.toUpperCase(),
    b.contact_person, b.email, b.phone, b.address || '', b.status || 'Active');
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', allow(...WRITE), (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const b = req.body;
  const r = db.prepare(`UPDATE vendors SET name=?,category=?,gst_number=?,contact_person=?,email=?,
    phone=?,address=?,status=? WHERE id=?`).run(b.name.trim(), b.category, b.gst_number.toUpperCase(),
    b.contact_person, b.email, b.phone, b.address || '', b.status || 'Active', req.params.id);
  r.changes ? res.json({ message: 'Updated' }) : res.status(404).json({ error: 'Vendor not found' });
});

router.delete('/:id', allow('Admin'), (req, res) => {
  const r = db.prepare('DELETE FROM vendors WHERE id=?').run(req.params.id);
  r.changes ? res.json({ message: 'Deleted' }) : res.status(404).json({ error: 'Vendor not found' });
});

module.exports = router;
