import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/index.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function FulfillmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [f, setF] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/fulfillment/${id}`).then(r => { setF(r.data); setLoading(false); }).catch(() => navigate('/fulfillment'));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>;
  if (!f) return null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/fulfillment" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <div className="flex items-center gap-3">
          <h1 className="page-title">Delivery #{f.id}</h1>
          <StatusBadge status={f.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Delivery Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">PO Number</dt>
              <dd><Link to={`/purchase-orders/${f.po_id}`} className="text-blue-600 hover:underline">{f.po_number}</Link></dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Supplier</dt><dd>{f.supplier}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Received by</dt><dd>{f.receiver_name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Date</dt><dd>{new Date(f.received_date).toLocaleDateString('en-GB')}</dd></div>
            {f.courier && <div className="flex justify-between"><dt className="text-gray-500">Courier</dt><dd>{f.courier}</dd></div>}
            {f.delivery_note && <div className="flex justify-between"><dt className="text-gray-500">Delivery note</dt><dd>{f.delivery_note}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-500">Condition</dt><dd className="capitalize">{f.condition}</dd></div>
          </dl>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">PO Items Ordered</h2>
          <div className="space-y-1">
            {f.po_items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.description}</span>
                <span className="text-gray-500">{item.quantity} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Items Received</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50"><tr>
            <th className="table-th">Item</th>
            <th className="table-th text-right">Qty Ordered</th>
            <th className="table-th text-right">Qty Received</th>
            <th className="table-th">Note</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {f.items_received.map((item, i) => (
              <tr key={i}>
                <td className="table-td">{item.description}</td>
                <td className="table-td text-right">{item.quantity} {item.unit}</td>
                <td className="table-td text-right font-medium">{item.quantity_received}</td>
                <td className="table-td text-gray-500 text-xs">{item.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {f.notes && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{f.notes}</p>
        </div>
      )}
    </div>
  );
}
