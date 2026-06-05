import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/index.js';
import StatusBadge from '../components/StatusBadge.jsx';

function StatCard({ label, value, sub, colour }) {
  const colours = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', yellow: 'bg-yellow-50 text-yellow-700', purple: 'bg-purple-50 text-purple-700' };
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colours[colour] || ''} rounded-lg px-2 py-1 inline-block`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const [pos, setPOs] = useState([]);
  const [fulfillments, setFulfillments] = useState([]);

  useEffect(() => {
    api.get('/po').then(r => setPOs(r.data)).catch(() => {});
    api.get('/fulfillment').then(r => setFulfillments(r.data)).catch(() => {});
  }, []);

  const countByStatus = (arr, s) => arr.filter(x => x.status === s).length;
  const totalValue = pos.filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.total, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{user?.permission_level} · {user?.department || 'No department'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={pos.length} colour="blue" />
        <StatCard label="Pending Approval" value={countByStatus(pos, 'submitted')} colour="yellow" />
        <StatCard label="Fulfilled" value={countByStatus(pos, 'fulfilled')} colour="green" />
        <StatCard label="Total Value" value={`£${totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`} colour="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent POs */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Purchase Orders</h2>
            <Link to="/purchase-orders" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pos.slice(0, 6).map(po => (
              <Link key={po.id} to={`/purchase-orders/${po.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{po.po_number}</p>
                  <p className="text-xs text-gray-500">{po.supplier}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={po.status} />
                  <p className="text-xs text-gray-500 mt-1">£{po.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                </div>
              </Link>
            ))}
            {pos.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 text-center">No purchase orders yet</p>}
          </div>
        </div>

        {/* Recent Fulfillments */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Fulfillments</h2>
            <Link to="/fulfillment" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {fulfillments.slice(0, 6).map(f => (
              <Link key={f.id} to={`/fulfillment/${f.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.po_number}</p>
                  <p className="text-xs text-gray-500">{f.supplier} · {f.received_date}</p>
                </div>
                <StatusBadge status={f.status} />
              </Link>
            ))}
            {fulfillments.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 text-center">No fulfillments yet</p>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      {user?.permission_level !== 'viewer' && (
        <div className="mt-6 card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/purchase-orders/new" className="btn-primary">+ New Purchase Order</Link>
            <Link to="/purchase-orders?status=submitted" className="btn-secondary">Review Pending</Link>
            {isManager && <Link to="/admin/users?status=pending" className="btn-secondary">Pending Users</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
