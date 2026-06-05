import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/index.js';

const emptyItem = () => ({ description: '', quantity: 1, unit_price: 0, unit: 'each' });

export default function NewPO() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    supplier: '', supplier_contact: '', supplier_email: '',
    delivery_address: '', required_date: '', notes: '',
    tax_rate: 20, currency: 'GBP'
  });
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  function setItem(i, field, value) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function addItem() { setItems(prev => [...prev, emptyItem()]); }
  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)); }

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
  const tax = subtotal * ((parseFloat(form.tax_rate) || 0) / 100);
  const total = subtotal + tax;

  async function handleSubmit(e, submit = false) {
    e.preventDefault();
    if (items.some(i => !i.description)) { setError('All items must have a description'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/po', { ...form, items });
      if (submit) await api.put(`/po/${data.id}/submit`);
      navigate(`/purchase-orders/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/purchase-orders" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <h1 className="page-title">New Purchase Order</h1>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Supplier */}
        <div className="card p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Supplier Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier name <span className="text-red-500">*</span></label>
              <input type="text" className="input" value={form.supplier} onChange={set('supplier')} placeholder="ACME Ltd" required />
            </div>
            <div>
              <label className="label">Contact name</label>
              <input type="text" className="input" value={form.supplier_contact} onChange={set('supplier_contact')} placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Supplier email</label>
              <input type="email" className="input" value={form.supplier_email} onChange={set('supplier_email')} placeholder="orders@acme.com" />
            </div>
            <div>
              <label className="label">Delivery address</label>
              <input type="text" className="input" value={form.delivery_address} onChange={set('delivery_address')} placeholder="123 Main St, London" />
            </div>
            <div>
              <label className="label">Required by date</label>
              <input type="date" className="input" value={form.required_date} onChange={set('required_date')} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={form.currency} onChange={set('currency')}>
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Order Items</h2>
            <button type="button" onClick={addItem} className="btn-secondary btn-sm">+ Add Item</button>
          </div>
          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 md:col-span-5">
                  <input type="text" className="input" value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Item description" required />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input type="number" className="input" min="1" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input type="text" className="input" value={item.unit} onChange={e => setItem(i, 'unit', e.target.value)} placeholder="each" />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input type="number" className="input" min="0" step="0.01" value={item.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} placeholder="0.00" />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>VAT</span>
                  <div className="flex items-center gap-2">
                    <input type="number" className="input w-16 py-1 text-xs" value={form.tax_rate} onChange={set('tax_rate')} min="0" max="100" />
                    <span>%</span>
                    <span>£{tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6 mb-6">
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} placeholder="Additional notes or instructions…" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="btn-secondary" disabled={saving}>Save as Draft</button>
          <button type="button" onClick={e => handleSubmit(e, true)} className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save & Submit for Approval'}
          </button>
          <Link to="/purchase-orders" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
