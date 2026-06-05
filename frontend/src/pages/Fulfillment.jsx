import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/index.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Fulfillment() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fulfillment').then(r => { setRows(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Fulfillment</h1>
          <p className="text-gray-500 text-sm mt-0.5">Delivery records for approved purchase orders</p>
        </div>
        <Link to="/fulfillment/new" className="btn-primary">+ Record Delivery</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">PO Number</th>
              <th className="table-th">Supplier</th>
              <th className="table-th hidden md:table-cell">Received</th>
              <th className="table-th hidden lg:table-cell">Received by</th>
              <th className="table-th">Status</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="table-td text-center text-gray-400 py-10">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="table-td text-center text-gray-400 py-10">No fulfillment records</td></tr>
            ) : rows.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="table-td font-medium text-blue-600">
                  <Link to={`/purchase-orders/${f.po_id}`}>{f.po_number}</Link>
                </td>
                <td className="table-td">{f.supplier}</td>
                <td className="table-td hidden md:table-cell text-gray-500">{new Date(f.received_date).toLocaleDateString('en-GB')}</td>
                <td className="table-td hidden lg:table-cell text-gray-500">{f.receiver_name}</td>
                <td className="table-td"><StatusBadge status={f.status} /></td>
                <td className="table-td">
                  <Link to={`/fulfillment/${f.id}`} className="text-blue-600 hover:underline text-sm">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
