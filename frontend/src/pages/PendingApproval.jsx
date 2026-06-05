import { Link } from 'react-router-dom';

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 px-4">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted</h2>
        <p className="text-gray-600 mb-6">
          Your access request has been sent to a manager for review. You'll be able to sign in once your account is approved.
        </p>
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 mb-6">
          A manager will review your request shortly. If you don't hear back, please contact your administrator.
        </div>
        <Link to="/login" className="btn-primary">Back to sign in</Link>
      </div>
    </div>
  );
}
