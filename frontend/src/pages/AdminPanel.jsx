import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/index.js';
import StatusBadge from '../components/StatusBadge.jsx';

function StatCard({ label, value, colour, to }) {
  const colours = { blue: 'text-blue-600', green: 'text-green-600', yellow: 'text-yellow-600', red: 'text-red-600', purple: 'text-purple-600' };
  const card = (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-4xl font-bold mt-1 ${colours[colour] || 'text-gray-800'}`}>{value}</p>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function AdminPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>;
  if (!data) return null;

  const userCount = (s) => data.users.find(u => u.status === s)?.count || 0;
  const poCount = (s) => data.pos.find(p => p.status === s)?.count || 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Full system overview</p>
      </div>

      {/* User stats */}
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-3">Users</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={data.users.reduce((s, u) => s + u.count, 0)} colour="blue" to="/admin/users" />
        <StatCard label="Pending Approval" value={userCount('pending')} colour="yellow" to="/admin/users?status=pending" />
        <StatCard label="Active Users" value={userCount('approved')} colour="green" to="/admin/users?status=approved" />
        <StatCard label="Rejected" value={userCount('rejected')} colour="red" to="/admin/users?status=rejected" />
      </div>

      {/* PO stats */}
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-3">Purchase Orders</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={data.pos.reduce((s, p) => s + p.count, 0)} colour="blue" to="/admin/orders" />
        <StatCard label="Awaiting Approval" value={poCount('submitted')} colour="yellow" to="/admin/orders?status=submitted" />
        <StatCard label="Approved" value={poCount('approved')} colour="blue" to="/admin/orders?status=approved" />
        <StatCard label="Fulfilled" value={poCount('fulfilled')} colour="green" to="/admin/orders?status=fulfilled" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Registrations</h2>
            <Link to="/admin/users" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentUsers.map(u => (
              <Link key={u.id} to={`/admin/users/${u.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email} · {u.location || 'No location'}</p>
                </div>
                <StatusBadge status={u.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent POs */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentPOs.map(po => (
              <Link key={po.id} to={`/purchase-orders/${po.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{po.po_number}</p>
                  <p className="text-xs text-gray-500">{po.supplier} · by {po.creator_name}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={po.status} />
                  <p className="text-xs text-gray-500 mt-0.5">£{po.total?.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
