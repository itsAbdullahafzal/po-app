import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import api from '../api/index.js';
import StatusBadge from '../components/StatusBadge.jsx';

const PERMISSION_LEVELS = ['viewer', 'requester', 'approver', 'manager'];

function UserDetail({ userId, onClose, onRefresh }) {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/admin/users/${userId}`).then(r => { setUser(r.data); setForm(r.data); });
  }, [userId]);

  async function approve(level) {
    await api.put(`/admin/users/${userId}/approve`, { permission_level: level || user.permission_level });
    setMsg('Approved'); api.get(`/admin/users/${userId}`).then(r => { setUser(r.data); setForm(r.data); }); onRefresh();
  }
  async function reject() {
    await api.put(`/admin/users/${userId}/reject`, { reason: rejectReason });
    setMsg('Rejected'); api.get(`/admin/users/${userId}`).then(r => { setUser(r.data); setForm(r.data); }); onRefresh();
  }
  async function save() {
    await api.put(`/admin/users/${userId}`, form);
    setMsg('Saved'); setEditing(false); api.get(`/admin/users/${userId}`).then(r => { setUser(r.data); setForm(r.data); }); onRefresh();
  }
  async function deleteUser() {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await api.delete(`/admin/users/${userId}`);
    onClose(); onRefresh();
  }

  if (!user) return <div className="p-10 text-center text-gray-400">Loading…</div>;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-10 px-4 pb-4 overflow-y-auto">
      <div className="card w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-lg">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6">
          {msg && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{msg}</div>}

          {/* Identity */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
            {[
              ['Full Name', 'name'], ['Email', 'email'], ['Location', 'location'],
              ['Department', 'department'], ['Phone', 'phone']
            ].map(([label, field]) => (
              <div key={field}>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                {editing && field !== 'email' ? (
                  <input className="input text-sm" value={form[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{user[field] || <span className="text-gray-400">—</span>}</p>
                )}
              </div>
            ))}

            {/* Password - plaintext for admin as requested */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Password</p>
              <p className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded select-all">{user.plain_password}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Permission Level</p>
              {editing ? (
                <select className="input text-sm" value={form.permission_level} onChange={e => setForm(f => ({ ...f, permission_level: e.target.value }))}>
                  {PERMISSION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium capitalize">{user.permission_level}</span>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Status</p>
              <StatusBadge status={user.status} />
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Registered</p>
              <p className="text-sm text-gray-700">{new Date(user.created_at).toLocaleString('en-GB')}</p>
            </div>

            {user.last_login && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Last Login</p>
                <p className="text-sm text-gray-700">{new Date(user.last_login).toLocaleString('en-GB')}</p>
              </div>
            )}
          </div>

          {editing && (
            <div className="mb-4">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          )}

          {/* Approve / Reject */}
          {user.status === 'pending' && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-yellow-800 mb-3">Awaiting Approval</p>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm text-gray-600">Approve as:</span>
                {PERMISSION_LEVELS.map(l => (
                  <button key={l} onClick={() => approve(l)} className="btn-success btn-sm capitalize">{l}</button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input className="input flex-1 text-sm" placeholder="Rejection reason (optional)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                <button className="btn-danger btn-sm" onClick={reject}>Reject</button>
              </div>
            </div>
          )}

          {user.status === 'approved' && !editing && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-sm text-gray-600">Change permission:</span>
              {PERMISSION_LEVELS.map(l => (
                <button key={l} onClick={() => approve(l)} className={`btn btn-sm capitalize ${user.permission_level === l ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>{l}</button>
              ))}
            </div>
          )}

          {/* Activity */}
          {user.purchase_orders?.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Purchase Orders ({user.purchase_orders.length})</p>
              <div className="space-y-1">
                {user.purchase_orders.slice(0, 5).map(po => (
                  <div key={po.id} className="flex items-center justify-between text-sm">
                    <Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline" onClick={onClose}>{po.po_number}</Link>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">£{po.total?.toFixed(2)}</span>
                      <StatusBadge status={po.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={deleteUser} className="btn-danger btn-sm">Delete User</button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn-secondary btn-sm">Cancel</button>
                <button onClick={save} className="btn-primary btn-sm">Save Changes</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">Edit</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const statusFilter = searchParams.get('status') || '';

  function load() {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/admin/users${q}`).then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }
  useEffect(load, [statusFilter]);

  const statuses = ['', 'pending', 'approved', 'rejected'];

  return (
    <div>
      {selectedId && <UserDetail userId={selectedId} onClose={() => setSelectedId(null)} onRefresh={load} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setSearchParams(s ? { status: s } : {})}
            className={`btn btn-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s || 'All'}
            {s === 'pending' && users.filter(u => u.status === 'pending').length > 0 && !statusFilter && (
              <span className="ml-1 bg-yellow-500 text-white rounded-full px-1.5 py-0.5 text-xs">{users.filter(u => u.status === 'pending').length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Email</th>
              <th className="table-th hidden md:table-cell">Location</th>
              <th className="table-th hidden lg:table-cell">Department</th>
              <th className="table-th">Permission</th>
              <th className="table-th">Status</th>
              <th className="table-th hidden lg:table-cell">Registered</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="table-td text-center text-gray-400 py-10">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="table-td text-center text-gray-400 py-10">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 cursor-pointer ${u.status === 'pending' ? 'bg-yellow-50/50' : ''}`} onClick={() => setSelectedId(u.id)}>
                <td className="table-td font-medium text-gray-900">{u.name}</td>
                <td className="table-td text-gray-600">{u.email}</td>
                <td className="table-td hidden md:table-cell text-gray-500">{u.location || '—'}</td>
                <td className="table-td hidden lg:table-cell text-gray-500">{u.department || '—'}</td>
                <td className="table-td capitalize">{u.permission_level}</td>
                <td className="table-td"><StatusBadge status={u.status} /></td>
                <td className="table-td hidden lg:table-cell text-gray-500">{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                <td className="table-td">
                  <button className="text-blue-600 hover:underline text-sm" onClick={e => { e.stopPropagation(); setSelectedId(u.id); }}>View →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
