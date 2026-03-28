import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DollarSign } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ErrorBox } from '../components/ui'

export default function RegisterPage() {
  const { register, loading, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const res = await register(form); // This now handles everything inside AuthProvider
    
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-md">
            <DollarSign size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">Plutus</span>
        </div>

        <div className="card p-7">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Create account</h2>
          <p className="text-sm text-slate-500 mb-6">Track your finances in one place</p>

          {success ? (
            <div className="text-center py-4">
              <p className="text-emerald-600 font-medium">✓ Account created! Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <ErrorBox message={error} />
              {[
                { key: 'name', label: 'Full Name', type: 'text', ph: 'John Doe' },
                { key: 'email', label: 'Email', type: 'email', ph: 'you@example.com' },
                { key: 'password', label: 'Password', type: 'password', ph: '••••••••' },
                { key: 'phone', label: 'Phone (optional)', type: 'tel', ph: '+91 98765 43210' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input className="input" type={f.type} placeholder={f.ph}
                    value={form[f.key]} onChange={set(f.key)} required={f.key !== 'phone'} />
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
