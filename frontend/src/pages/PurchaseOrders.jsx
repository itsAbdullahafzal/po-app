import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/index.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function PurchaseOrders() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/po${q}`).then(r => { setPOs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [statusFilter]);

  const statuses = ['', 'draft', 'submitted', 'approved', 'rejected', 'fulfilled', 'cancelled'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pos.length} order{pos.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.permission_level !== 'viewer' && (
          <Link to="/purchase-orders/new" className="btn-primary">+ New Order</Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setSearchParams(s ? { status: s } : {})}
            className={`btn btn-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">PO Number</th>
              <th className="table-th">Supplier</th>
              <th className="table-th hidden md:table-cell">Created</th>
              <th className="table-th hidden lg:table-cell">Required</th>
              <th className="table-th">Total</th>
              <th className="table-th">Status</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="table-td text-center text-gray-400 py-10">Loading…</td></tr>
            ) : pos.length === 0 ? (
              <tr><td colSpan={7} className="table-td text-center text-gray-400 py-10">No purchase orders found</td></tr>
            ) : pos.map(po => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="table-td font-medium text-blue-600">{po.po_number}</td>
                <td className="table-td">{po.supplier}</td>
                <td className="table-td hidden md:table-cell text-gray-500">{new Date(po.created_at).toLocaleDateString('en-GB')}</td>
                <td className="table-td hidden lg:table-cell text-gray-500">{po.required_date ? new Date(po.required_date).toLocaleDateString('en-GB') : '—'}</td>
                <td className="table-td font-medium">£{po.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                <td className="table-td"><StatusBadge status={po.status} /></td>
                <td className="table-td">
                  <Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline text-sm">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
