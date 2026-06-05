import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/index.js';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', location: '', department: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup', form);
      navigate('/pending');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-3xl font-bold text-white">PO Manager</h1>
          <p className="text-blue-200 mt-1">Request access to get started</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name <span className="text-red-500">*</span></label>
              <input type="text" className="input" value={form.name} onChange={set('name')} placeholder="Jane Smith" required />
            </div>
            <div>
              <label className="label">Email address <span className="text-red-500">*</span></label>
              <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="jane@company.com" required />
            </div>
            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <input type="password" className="input" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Location</label>
                <input type="text" className="input" value={form.location} onChange={set('location')} placeholder="London" />
              </div>
              <div>
                <label className="label">Department</label>
                <input type="text" className="input" value={form.department} onChange={set('department')} placeholder="Finance" />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" value={form.phone} onChange={set('phone')} placeholder="+44 7700 000000" />
            </div>

            <div className="pt-1">
              <p className="text-xs text-gray-500 mb-3">
                Your request will be reviewed by a manager before you can sign in.
              </p>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Submitting…' : 'Request access'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
