const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'vendorbridge.db')
  : path.join(__dirname, 'vendorbridge.db');

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  first_name TEXT, last_name TEXT, phone TEXT, country TEXT, additional_info TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Vendor',
  reset_token TEXT,
  reset_expires INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS vendors(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  gst_number TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
