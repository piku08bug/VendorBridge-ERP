const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_secure_jwt_2026';

function auth(req, res, next) {
  const token = (req.cookies && req.cookies.token) || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Please log in' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired' });
  }
}

module.exports = auth;
module.exports.auth = auth;
