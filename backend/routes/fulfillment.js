const router = require('express').Router();
const { query, queryOne, execute } = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const isMgr = ['approver','manager'].includes(req.user.permission_level);
    const rows = isMgr
      ? await query(`SELECT f.*,u.name as receiver_name,po.po_number,po.supplier,po.total FROM fulfillments f JOIN users u ON f.received_by=u.id JOIN purchase_orders po ON f.po_id=po.id ORDER BY f.created_at DESC`)
      : await query(`SELECT f.*,u.name as receiver_name,po.po_number,po.supplier,po.total FROM fulfillments f JOIN users u ON f.received_by=u.id JOIN purchase_orders po ON f.po_id=po.id WHERE (po.created_by=$1 OR f.received_by=$1) ORDER BY f.created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.permission_level === 'viewer') return res.status(403).json({ error: 'Viewers cannot record fulfillments' });
    const { po_id, received_date, items_received, delivery_note, courier, condition, notes } = req.body;
    if (!po_id || !received_date || !items_received) return res.status(400).json({ error: 'PO, date and items are required' });

    const po = await queryOne('SELECT * FROM purchase_orders WHERE id=$1', [po_id]);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    if (po.status !== 'approved') return res.status(400).json({ error: 'PO must be approved before recording fulfillment' });

    const totalOrdered = (po.items || []).reduce((s, i) => s + i.quantity, 0);
    const totalReceived = items_received.reduce((s, i) => s + (i.quantity_received || 0), 0);
    const status = totalReceived >= totalOrdered ? 'complete' : 'partial';

    const result = await execute(`
      INSERT INTO fulfillments (po_id,received_by,received_date,items_received,delivery_note,courier,condition,notes,status)
      VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9) RETURNING id`,
      [po_id, req.user.id, received_date, JSON.stringify(items_received), delivery_note||null, courier||null, condition||'good', notes||null, status]);

    if (status === 'complete') {
      await execute(`UPDATE purchase_orders SET status='fulfilled',updated_at=NOW() WHERE id=$1`, [po_id]);
    }
    res.status(201).json({ id: result.lastInsertId, status });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to record fulfillment' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const f = await queryOne(`
      SELECT f.*,u.name as receiver_name,po.po_number,po.supplier,po.items as po_items,
             po.total,po.created_by,c.name as creator_name
      FROM fulfillments f
      JOIN users u ON f.received_by=u.id
      JOIN purchase_orders po ON f.po_id=po.id
      JOIN users c ON po.created_by=c.id
      WHERE f.id=$1`, [req.params.id]);
    if (!f) return res.status(404).json({ error: 'Not found' });
    const isMgr = ['approver','manager'].includes(req.user.permission_level);
    if (!isMgr && f.received_by !== req.user.id && f.created_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    res.json(f);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
