const router = require('express').Router();
const db = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, (req, res) => {
  const count = where => db.prepare(`SELECT COUNT(*) n FROM vendors ${where}`).get().n;
  res.json({
    totalVendors: count(''),
    activeVendors: count("WHERE status='Active'"),
    pendingVendors: count("WHERE status='Pending'"),
    purchaseOrders: 0,
    pendingApprovals: 0,
    invoices: 0
  });
});

module.exports = router;
