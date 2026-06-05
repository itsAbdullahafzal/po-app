const jwt = require('jsonwebtoken');
const { queryOne } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'po-app-secret-key-CHANGE-IN-PRODUCTION';

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [payload.userId]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status !== 'approved') return res.status(403).json({ error: 'Account not approved' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireManager(req, res, next) {
  if (req.user.permission_level !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
}

function requireApprover(req, res, next) {
  if (!['approver', 'manager'].includes(req.user.permission_level)) {
    return res.status(403).json({ error: 'Approver access required' });
  }
  next();
}

module.exports = { authenticate, requireManager, requireApprover, JWT_SECRET };
