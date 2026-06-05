import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/index.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    setLoading(true);
    api.get('/admin/orders').then(r => {
      const filtered = statusFilter ? r.data.filter(o => o.status === statusFilter) : r.data;
      setOrders(filtered);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter]);

  const statuses = ['', 'draft', 'submitted', 'approved', 'rejected', 'fulfilled', 'cancelled'];
  const totalValue = orders.filter(o => !['cancelled'].includes(o.status)).reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">All Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} orders · Total value £{totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setSearchParams(s ? { status: s } : {})}
            className={`btn btn-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
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
              <th className="table-th hidden md:table-cell">Created by</th>
              <th className="table-th hidden lg:table-cell">Created</th>
              <th className="table-th hidden lg:table-cell">Required</th>
              <th className="table-th">Total</th>
              <th className="table-th">Status</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="table-td text-center text-gray-400 py-10">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="table-td text-center text-gray-400 py-10">No orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="table-td font-medium text-blue-600">{o.po_number}</td>
                <td className="table-td">{o.supplier}</td>
                <td className="table-td hidden md:table-cell text-gray-500">{o.creator_name}</td>
                <td className="table-td hidden lg:table-cell text-gray-500">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                <td className="table-td hidden lg:table-cell text-gray-500">{o.required_date ? new Date(o.required_date).toLocaleDateString('en-GB') : '—'}</td>
                <td className="table-td font-medium">£{o.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                <td className="table-td"><StatusBadge status={o.status} /></td>
                <td className="table-td">
                  <Link to={`/purchase-orders/${o.id}`} className="text-blue-600 hover:underline text-sm">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
