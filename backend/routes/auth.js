const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, execute } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, location, department, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await execute(
      `INSERT INTO users (name, email, password_hash, plain_password, location, department, phone, permission_level, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'requester','pending') RETURNING id`,
      [name, email.toLowerCase(), hash, password, location || null, department || null, phone || null]
    );
    res.status(201).json({ message: 'Registration submitted. Awaiting manager approval.', userId: result.lastInsertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.status === 'pending')
      return res.status(403).json({ error: 'pending', message: 'Your account is awaiting manager approval' });
    if (user.status === 'rejected')
      return res.status(403).json({ error: 'rejected', message: `Access denied. ${user.rejection_reason || ''}` });

    if (!bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });

    await execute('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, permission_level: user.permission_level, location: user.location, department: user.department }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
