const colours = {
  draft:     'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-800',
  approved:  'bg-blue-100 text-blue-800',
  rejected:  'bg-red-100 text-red-700',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-500',
  pending:   'bg-yellow-100 text-yellow-800',
  partial:   'bg-orange-100 text-orange-800',
  complete:  'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }) {
  const cls = colours[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}
