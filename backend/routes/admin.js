const router = require('express').Router();
const { query, queryOne, execute } = require('../db/database');
const { authenticate, requireManager } = require('../middleware/auth');

router.use(authenticate, requireManager);

router.get('/dashboard', async (req, res) => {
  try {
    const [users, pos, fulfillments, recentUsers, recentPOs] = await Promise.all([
      query('SELECT status, COUNT(*)::int as count FROM users GROUP BY status'),
      query('SELECT status, COUNT(*)::int as count FROM purchase_orders GROUP BY status'),
      query('SELECT status, COUNT(*)::int as count FROM fulfillments GROUP BY status'),
      query('SELECT id,name,email,location,department,permission_level,status,created_at FROM users ORDER BY created_at DESC LIMIT 5'),
      query('SELECT po.*,u.name as creator_name FROM purchase_orders po JOIN users u ON po.created_by=u.id ORDER BY po.created_at DESC LIMIT 5')
    ]);
    res.json({ users, pos, fulfillments, recentUsers, recentPOs });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Dashboard failed' }); }
});

router.get('/users', async (req, res) => {
  try {
    const { status } = req.query;
    const users = status
      ? await query('SELECT * FROM users WHERE status=$1 ORDER BY created_at DESC', [status])
      : await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id=$1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [pos, fulfillments] = await Promise.all([
      query('SELECT * FROM purchase_orders WHERE created_by=$1 ORDER BY created_at DESC', [user.id]),
      query('SELECT * FROM fulfillments WHERE received_by=$1 ORDER BY created_at DESC', [user.id])
    ]);
    res.json({ ...user, purchase_orders: pos, fulfillments });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/users/:id/approve', async (req, res) => {
  try {
    const level = req.body.permission_level || 'requester';
    await execute(`UPDATE users SET status='approved', permission_level=$1, rejection_reason=NULL WHERE id=$2`, [level, req.params.id]);
    res.json({ message: 'User approved' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/users/:id/reject', async (req, res) => {
  try {
    await execute(`UPDATE users SET status='rejected', rejection_reason=$1 WHERE id=$2`, [req.body.reason || null, req.params.id]);
    res.json({ message: 'User rejected' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, permission_level, location, department, phone, notes, status } = req.body;
    await execute(`
      UPDATE users SET
        name=COALESCE($1,name), permission_level=COALESCE($2,permission_level),
        location=COALESCE($3,location), department=COALESCE($4,department),
        phone=COALESCE($5,phone), notes=COALESCE($6,notes), status=COALESCE($7,status)
      WHERE id=$8`,
      [name||null, permission_level||null, location||null, department||null, phone||null, notes||null, status||null, req.params.id]);
    res.json({ message: 'User updated' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    await execute('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/orders', async (req, res) => {
  try {
    const pos = await query(`
      SELECT po.*,u.name as creator_name,u.email as creator_email,a.name as approver_name
      FROM purchase_orders po
      JOIN users u ON po.created_by=u.id
      LEFT JOIN users a ON po.approved_by=a.id
      ORDER BY po.created_at DESC`);
    res.json(pos);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/fulfillments', async (req, res) => {
  try {
    const rows = await query(`
      SELECT f.*,u.name as receiver_name,po.po_number,po.supplier
      FROM fulfillments f
      JOIN users u ON f.received_by=u.id
      JOIN purchase_orders po ON f.po_id=po.id
      ORDER BY f.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
