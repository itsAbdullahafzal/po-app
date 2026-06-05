const router = require('express').Router();
const { query, queryOne, execute } = require('../db/database');
const { authenticate, requireApprover } = require('../middleware/auth');

router.use(authenticate);

async function generatePONumber() {
  const year = new Date().getFullYear();
  const existing = await queryOne(
    `SELECT po_number FROM purchase_orders WHERE po_number LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`PO-${year}-%`]
  );
  let seq = 1;
  if (existing) seq = parseInt(existing.po_number.split('-')[2]) + 1;
  return `PO-${year}-${String(seq).padStart(4, '0')}`;
}

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const isMgr = ['approver', 'manager'].includes(req.user.permission_level);
    let rows;
    if (isMgr) {
      rows = status
        ? await query(`SELECT po.*,u.name as creator_name FROM purchase_orders po JOIN users u ON po.created_by=u.id WHERE po.status=$1 ORDER BY po.created_at DESC`, [status])
        : await query(`SELECT po.*,u.name as creator_name FROM purchase_orders po JOIN users u ON po.created_by=u.id ORDER BY po.created_at DESC`);
    } else {
      rows = status
        ? await query(`SELECT po.*,u.name as creator_name FROM purchase_orders po JOIN users u ON po.created_by=u.id WHERE po.created_by=$1 AND po.status=$2 ORDER BY po.created_at DESC`, [req.user.id, status])
        : await query(`SELECT po.*,u.name as creator_name FROM purchase_orders po JOIN users u ON po.created_by=u.id WHERE po.created_by=$1 ORDER BY po.created_at DESC`, [req.user.id]);
    }
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.permission_level === 'viewer') return res.status(403).json({ error: 'Viewers cannot create purchase orders' });
    const { supplier, supplier_contact, supplier_email, delivery_address, required_date, items, notes, tax_rate, currency } = req.body;
    if (!supplier || !items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Supplier and at least one item are required' });

    const subtotal = items.reduce((s, i) => s + (parseFloat(i.quantity) * parseFloat(i.unit_price)), 0);
    const rate = tax_rate !== undefined ? parseFloat(tax_rate) : 20;
    const tax = subtotal * (rate / 100);
    const total = subtotal + tax;
    const po_number = await generatePONumber();

    const result = await execute(`
      INSERT INTO purchase_orders
        (po_number,created_by,supplier,supplier_contact,supplier_email,delivery_address,
         required_date,items,subtotal,tax_rate,tax,total,currency,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [po_number, req.user.id, supplier, supplier_contact||null, supplier_email||null,
       delivery_address||null, required_date||null, JSON.stringify(items),
       subtotal, rate, tax, total, currency||'GBP', notes||null]);

    res.status(201).json({ id: result.lastInsertId, po_number });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create order' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const po = await queryOne(`
      SELECT po.*,u.name as creator_name,u.email as creator_email,a.name as approver_name
      FROM purchase_orders po
      JOIN users u ON po.created_by=u.id
      LEFT JOIN users a ON po.approved_by=a.id
      WHERE po.id=$1`, [req.params.id]);
    if (!po) return res.status(404).json({ error: 'Not found' });
    const isMgr = ['approver','manager'].includes(req.user.permission_level);
    if (!isMgr && po.created_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    const fulfillments = await query(`
      SELECT f.*,u.name as receiver_name FROM fulfillments f
      JOIN users u ON f.received_by=u.id WHERE f.po_id=$1`, [po.id]);
    res.json({ ...po, fulfillments });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const po = await queryOne('SELECT * FROM purchase_orders WHERE id=$1', [req.params.id]);
    if (!po) return res.status(404).json({ error: 'Not found' });
    if (po.created_by !== req.user.id && req.user.permission_level !== 'manager') return res.status(403).json({ error: 'Access denied' });
    if (!['draft','rejected'].includes(po.status)) return res.status(400).json({ error: 'Can only edit draft or rejected orders' });

    const { supplier, supplier_contact, supplier_email, delivery_address, required_date, items, notes, tax_rate, currency } = req.body;
    const updatedItems = items || po.items;
    const subtotal = updatedItems.reduce((s, i) => s + (parseFloat(i.quantity) * parseFloat(i.unit_price)), 0);
    const rate = tax_rate !== undefined ? parseFloat(tax_rate) : po.tax_rate;
    const tax = subtotal * (rate / 100);
    const total = subtotal + tax;

    await execute(`
      UPDATE purchase_orders SET
        supplier=COALESCE($1,supplier), supplier_contact=COALESCE($2,supplier_contact),
        supplier_email=COALESCE($3,supplier_email), delivery_address=COALESCE($4,delivery_address),
        required_date=COALESCE($5,required_date), items=$6::jsonb,
        subtotal=$7, tax_rate=$8, tax=$9, total=$10,
        currency=COALESCE($11,currency), notes=COALESCE($12,notes),
        status='draft', updated_at=NOW()
      WHERE id=$13`,
      [supplier||null, supplier_contact||null, supplier_email||null, delivery_address||null,
       required_date||null, JSON.stringify(updatedItems), subtotal, rate, tax, total,
       currency||null, notes!==undefined?notes:null, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.put('/:id/submit', async (req, res) => {
  try {
    const po = await queryOne('SELECT * FROM purchase_orders WHERE id=$1', [req.params.id]);
    if (!po) return res.status(404).json({ error: 'Not found' });
    if (po.created_by !== req.user.id && req.user.permission_level !== 'manager') return res.status(403).json({ error: 'Access denied' });
    if (!['draft','rejected'].includes(po.status)) return res.status(400).json({ error: 'Can only submit draft or rejected orders' });
    await execute(`UPDATE purchase_orders SET status='submitted',updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Submitted' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/:id/approve', requireApprover, async (req, res) => {
  try {
    const po = await queryOne('SELECT * FROM purchase_orders WHERE id=$1', [req.params.id]);
    if (!po) return res.status(404).json({ error: 'Not found' });
    if (po.status !== 'submitted') return res.status(400).json({ error: 'Only submitted orders can be approved' });
    await execute(`UPDATE purchase_orders SET status='approved',approved_by=$1,approved_at=NOW(),updated_at=NOW() WHERE id=$2`, [req.user.id, req.params.id]);
    res.json({ message: 'Approved' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/:id/reject', requireApprover, async (req, res) => {
  try {
    await execute(`UPDATE purchase_orders SET status='rejected',rejected_by=$1,rejected_at=NOW(),rejection_reason=$2,updated_at=NOW() WHERE id=$3`,
      [req.user.id, req.body.reason||null, req.params.id]);
    res.json({ message: 'Rejected' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    const po = await queryOne('SELECT * FROM purchase_orders WHERE id=$1', [req.params.id]);
    if (!po) return res.status(404).json({ error: 'Not found' });
    if (po.created_by !== req.user.id && req.user.permission_level !== 'manager') return res.status(403).json({ error: 'Access denied' });
    if (['fulfilled','cancelled'].includes(po.status)) return res.status(400).json({ error: 'Cannot cancel this order' });
    await execute(`UPDATE purchase_orders SET status='cancelled',updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Cancelled' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
