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

function allow(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (allowed.length > 0 && !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function setCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

auth.auth = auth;
auth.allow = allow;
auth.setCookie = setCookie;

module.exports = auth;
module.exports.auth = auth;
module.exports.allow = allow;
module.exports.setCookie = setCookie;
