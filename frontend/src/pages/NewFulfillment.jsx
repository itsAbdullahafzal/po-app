import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/index.js';

export default function NewFulfillment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPO = searchParams.get('po');
  const [pos, setPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [form, setForm] = useState({
    po_id: preselectedPO || '',
    received_date: new Date().toISOString().split('T')[0],
    delivery_note: '', courier: '', condition: 'good', notes: ''
  });
  const [itemsReceived, setItemsReceived] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/po?status=approved').then(r => {
      setPOs(r.data);
      const target = preselectedPO ? r.data.find(p => p.id === parseInt(preselectedPO)) : null;
      if (target) loadPO(target);
    });
  }, []);

  function loadPO(po) {
    setSelectedPO(po);
    setForm(f => ({ ...f, po_id: po.id }));
    setItemsReceived(po.items.map(i => ({ ...i, quantity_received: i.quantity, note: '' })));
  }

  async function handlePOChange(e) {
    const po = pos.find(p => p.id === parseInt(e.target.value));
    if (po) loadPO(po); else { setSelectedPO(null); setItemsReceived([]); }
    setForm(f => ({ ...f, po_id: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/fulfillment', { ...form, items_received: itemsReceived });
      navigate(`/fulfillment/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record fulfillment');
      setSaving(false);
    }
  }

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/fulfillment" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <h1 className="page-title">Record Delivery</h1>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Delivery Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Purchase Order <span className="text-red-500">*</span></label>
              <select className="input" value={form.po_id} onChange={handlePOChange} required>
                <option value="">Select approved PO…</option>
                {pos.map(p => <option key={p.id} value={p.id}>{p.po_number} — {p.supplier}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Received date <span className="text-red-500">*</span></label>
              <input type="date" className="input" value={form.received_date} onChange={set('received_date')} required />
            </div>
            <div>
              <label className="label">Condition</label>
              <select className="input" value={form.condition} onChange={set('condition')}>
                <option value="good">Good</option>
                <option value="damaged">Damaged</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="label">Delivery note / ref</label>
              <input type="text" className="input" value={form.delivery_note} onChange={set('delivery_note')} placeholder="DN-12345" />
            </div>
            <div>
              <label className="label">Courier</label>
              <input type="text" className="input" value={form.courier} onChange={set('courier')} placeholder="DHL, FedEx…" />
            </div>
          </div>
        </div>

        {selectedPO && itemsReceived.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Items Received</h2>
            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
                <div className="col-span-5">Item</div>
                <div className="col-span-2">Ordered</div>
                <div className="col-span-2">Received</div>
                <div className="col-span-3">Note</div>
              </div>
              {itemsReceived.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 md:col-span-5 text-sm text-gray-700">{item.description}</div>
                  <div className="col-span-4 md:col-span-2 text-sm text-gray-500">{item.quantity} {item.unit}</div>
                  <div className="col-span-4 md:col-span-2">
                    <input type="number" className="input" min="0" max={item.quantity} value={item.quantity_received}
                      onChange={e => setItemsReceived(prev => prev.map((x, idx) => idx === i ? { ...x, quantity_received: parseInt(e.target.value) || 0 } : x))} />
                  </div>
                  <div className="col-span-4 md:col-span-3">
                    <input type="text" className="input" placeholder="Note" value={item.note}
                      onChange={e => setItemsReceived(prev => prev.map((x, idx) => idx === i ? { ...x, note: e.target.value } : x))} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6">
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any additional delivery notes…" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving || !selectedPO}>{saving ? 'Saving…' : 'Record Delivery'}</button>
          <Link to="/fulfillment" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
