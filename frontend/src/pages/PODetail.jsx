import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/index.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function PODetail() {
  const { id } = useParams();
  const { user, isApprover } = useAuth();
  const navigate = useNavigate();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => { fetch(); }, [id]);

  function fetch() {
    api.get(`/po/${id}`).then(r => { setPO(r.data); setLoading(false); }).catch(() => navigate('/purchase-orders'));
  }

  async function action(fn) {
    try { await fn(); setActionMsg(''); fetch(); } catch (err) { setActionMsg(err.response?.data?.error || 'Action failed'); }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>;
  if (!po) return null;

  const isOwner = po.created_by === user.id;
  const canEdit = isOwner && ['draft', 'rejected'].includes(po.status);
  const canSubmit = isOwner && ['draft', 'rejected'].includes(po.status);
  const canCancel = (isOwner || isApprover) && !['fulfilled', 'cancelled'].includes(po.status);
  const canApprove = isApprover && po.status === 'submitted';

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/purchase-orders" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">{po.po_number}</h1>
            <StatusBadge status={po.status} />
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Created by {po.creator_name} · {new Date(po.created_at).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && <Link to={`/purchase-orders/${id}/edit`} className="btn-secondary btn-sm">Edit</Link>}
          {canSubmit && <button className="btn-primary btn-sm" onClick={() => action(() => api.put(`/po/${id}/submit`))}>Submit</button>}
          {canApprove && <button className="btn-success btn-sm" onClick={() => action(() => api.put(`/po/${id}/approve`))}>Approve</button>}
          {canApprove && <button className="btn-danger btn-sm" onClick={() => setShowReject(true)}>Reject</button>}
          {canCancel && <button className="btn-secondary btn-sm text-red-600" onClick={() => action(() => api.put(`/po/${id}/cancel`))}>Cancel</button>}
          {po.status === 'approved' && <Link to={`/fulfillment/new?po=${id}`} className="btn-success btn-sm">Record Delivery</Link>}
        </div>
      </div>

      {actionMsg && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{actionMsg}</div>}
      {po.rejection_reason && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><strong>Rejected:</strong> {po.rejection_reason}</div>}

      {/* Reject modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold mb-3">Reject Purchase Order</h3>
            <textarea className="input mb-3" rows={3} placeholder="Reason for rejection…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowReject(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => { action(() => api.put(`/po/${id}/reject`, { reason: rejectReason })); setShowReject(false); }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Supplier</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Supplier</dt><dd className="font-medium">{po.supplier}</dd></div>
            {po.supplier_contact && <div className="flex justify-between"><dt className="text-gray-500">Contact</dt><dd>{po.supplier_contact}</dd></div>}
            {po.supplier_email && <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{po.supplier_email}</dd></div>}
            {po.delivery_address && <div className="flex justify-between"><dt className="text-gray-500">Delivery</dt><dd className="text-right max-w-[60%]">{po.delivery_address}</dd></div>}
            {po.required_date && <div className="flex justify-between"><dt className="text-gray-500">Required by</dt><dd>{new Date(po.required_date).toLocaleDateString('en-GB')}</dd></div>}
          </dl>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>£{po.subtotal.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">VAT ({po.tax_rate}%)</dt><dd>£{po.tax.toFixed(2)}</dd></div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-100"><dt>Total</dt><dd>£{po.total.toFixed(2)}</dd></div>
            {po.approver_name && <div className="flex justify-between"><dt className="text-gray-500">Approved by</dt><dd>{po.approver_name}</dd></div>}
            {po.approved_at && <div className="flex justify-between"><dt className="text-gray-500">Approved</dt><dd>{new Date(po.approved_at).toLocaleDateString('en-GB')}</dd></div>}
          </dl>
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Items</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50"><tr>
            <th className="table-th">Description</th>
            <th className="table-th text-right">Qty</th>
            <th className="table-th text-right">Unit</th>
            <th className="table-th text-right">Unit Price</th>
            <th className="table-th text-right">Line Total</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {po.items.map((item, i) => (
              <tr key={i}>
                <td className="table-td">{item.description}</td>
                <td className="table-td text-right">{item.quantity}</td>
                <td className="table-td text-right text-gray-500">{item.unit}</td>
                <td className="table-td text-right">£{parseFloat(item.unit_price).toFixed(2)}</td>
                <td className="table-td text-right font-medium">£{(item.quantity * item.unit_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {po.notes && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{po.notes}</p>
        </div>
      )}

      {/* Fulfillments */}
      {po.fulfillments?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Delivery Records</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {po.fulfillments.map(f => (
              <Link key={f.id} to={`/fulfillment/${f.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium">Received {f.received_date}</p>
                  <p className="text-xs text-gray-500">By {f.receiver_name} · {f.condition} condition</p>
                </div>
                <StatusBadge status={f.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
