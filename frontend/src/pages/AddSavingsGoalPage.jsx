import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, ArrowLeft, Plus, CheckCircle2 } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import PageHeader from '../components/PageHeader'
import { ErrorBox, LoadingOverlay } from '../components/ui'
import { useFetch } from '../hooks/useFetch'
import { savingsGoalService, accountService } from '../services/api'
import { formatCurrency } from '../utils/cn'

const EMPTY = {
  account_id: '',
  goal_name: '',
  target_amount: '',
  saved_amount: '',
  deadline: ''
}

const SparkTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 shadow-card rounded-lg px-2 py-1 text-xs">
      <span className="font-semibold text-violet-600">{formatCurrency(payload[0].value)}</span>
    </div>
  )
}

function buildProgressData(saved, target) {
  if (!target || target <= 0) return []
  const s = parseFloat(saved) || 0
  const t = parseFloat(target)
  // 6 evenly-spaced milestones from 0 → saved, then extrapolated toward target
  return Array.from({ length: 6 }, (_, i) => {
    const frac = i / 5
    return { label: `${Math.round(frac * 100)}%`, value: Math.min(s + (t - s) * frac, t) }
  })
}

export default function AddSavingsGoalPage() {
  const navigate = useNavigate()
  const {data: accounts } = useFetch(accountService.list)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const { data: goals, loading: goalsLoading, refetch } = useFetch(savingsGoalService.list)

  const set       = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const target    = parseFloat(form.target_amount) || 0
  const saved     = parseFloat(form.saved_amount)  || 0
  const pct       = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
  const remaining = Math.max(0, target - saved)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSaving(true); setSuccess(false)
    try {
      await savingsGoalService.create({
        account_id: Number(form.account_id),
        goal_name:     form.goal_name.trim(),
        target_amount: parseFloat(form.target_amount),
        saved_amount:  parseFloat(form.saved_amount || 0),
        deadline:      form.deadline || null,
      })
      setSuccess(true)
      refetch()
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create goal')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader
        title="Savings Goals"
        subtitle="Create targets and track your progress"
        action={
          <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Target Amount', value: formatCurrency(target),    color: 'text-violet-600',  bg: 'bg-violet-50'  },
          { label: 'Already Saved', value: formatCurrency(saved),     color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Remaining',     value: formatCurrency(remaining), color: 'text-blue-600',    bg: 'bg-blue-50'    },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card px-5 py-4 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
              <Target size={16} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Col 1: Form ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-5 h-fit"
        >
          <p className="text-sm font-semibold text-slate-800 mb-4">New Goal</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <ErrorBox message={error} />
            {success && (
              <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
                ✓ Goal created! Redirecting…
              </div>
            )}

            <div>
              <label className="label">Account *</label>
              <select
                className="input"
                value={form.account_id}
                onChange={set('account_id')}
                required
              >
                <option value="">Select account</option>
                {(accounts || []).map(a => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Goal Name *</label>
              <input className="input" placeholder="e.g. Emergency Fund, New Laptop"
                value={form.goal_name} onChange={set('goal_name')} required />
            </div>

            <div>
              <label className="label">Target Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                <input className="input pl-7" type="number" step="0.01" min="1"
                  placeholder="50,000" value={form.target_amount} onChange={set('target_amount')} required />
              </div>
            </div>

            <div>
              <label className="label">Initial Savings</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                <input className="input pl-7" type="number" step="0.01" min="0"
                  placeholder="0" value={form.saved_amount} onChange={set('saved_amount')} />
              </div>
            </div>

            <div>
              <label className="label">Target Date (optional)</label>
              <input className="input" type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.deadline} onChange={set('deadline')} />
            </div>

            <button type="submit" disabled={saving}
              className="btn-primary w-full justify-center py-2.5 mt-1">
              {saving ? 'Creating…' : <><Plus size={14} /> Create Goal</>}
            </button>
          </form>
        </motion.div>

        {/* ── Col 2: Live Preview + sparkline ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Live Preview</p>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-lg font-bold text-slate-800 truncate">
                {form.goal_name || <span className="text-slate-300">Goal Title</span>}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {form.deadline
                  ? `Due ${new Date(form.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'No deadline set'}
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Progress</span><span>{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <motion.div className="bg-violet-500 h-2 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }} />
              </div>
            </div>

            {/* Line chart — same Recharts style as Dashboard */}
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-2">Savings trajectory</p>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart
                  data={target > 0 ? buildProgressData(saved, target) : [{ label: '0%', value: 0 }]}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<SparkTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6"
                    strokeWidth={2} dot={{ r: 2, fill: '#8b5cf6' }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Saved',  value: formatCurrency(saved),     cls: 'bg-emerald-50 text-emerald-700' },
                { label: 'Target', value: formatCurrency(target),    cls: 'bg-violet-50  text-violet-700'  },
                { label: 'Left',   value: formatCurrency(remaining), cls: 'bg-blue-50    text-blue-700'    },
              ].map(s => {
                const [bg, txt] = s.cls.split(' ')
                return (
                  <div key={s.label} className={`p-3 rounded-xl ${bg}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wide opacity-60 ${txt}`}>{s.label}</p>
                    <p className={`text-xs font-bold mt-0.5 ${txt}`}>{s.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Col 3: All existing goals ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Active Goals</p>
            <span className="text-[11px] text-slate-400">
              {(goals || []).filter(g => parseFloat(g.remaining_amount) > 0).length} in progress
            </span>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 460 }}>
            {goalsLoading ? <LoadingOverlay /> : (goals || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                  <Target size={18} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">No goals yet</p>
                <p className="text-xs text-slate-400 mt-1">Create one using the form.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {[...(goals || [])]
                  .sort((a, b) => parseFloat(a.remaining_amount) - parseFloat(b.remaining_amount))
                  .map(g => {
                    const gSaved  = parseFloat(g.saved_amount)
                    const gTarget = parseFloat(g.target_amount)
                    const gPct    = Math.min(100, Math.round((gSaved / gTarget) * 100))
                    const done    = parseFloat(g.remaining_amount) <= 0
                    const sparkD  = buildProgressData(gSaved, gTarget)
                    return (
                      <li key={g.goal_id} className="px-5 py-4">
                        {/* Header row */}
                        <div className="flex items-start gap-2 mb-2">
                          {done
                            ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            : <Target size={14} className="text-violet-500 shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{g.goal_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {formatCurrency(gSaved)} / {formatCurrency(gTarget)}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold shrink-0 ${done ? 'text-emerald-500' : 'text-violet-500'}`}>
                            {gPct}%
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                          <div
                            className={`h-1.5 rounded-full transition-all ${done ? 'bg-emerald-400' : 'bg-violet-500'}`}
                            style={{ width: `${gPct}%` }}
                          />
                        </div>

                        {/* Mini sparkline — same line style as Dashboard */}
                        {!done && sparkD.length > 0 && (
                          <ResponsiveContainer width="100%" height={42}>
                            <LineChart data={sparkD} margin={{ top: 2, right: 2, left: -48, bottom: 0 }}>
                              <Line type="monotone" dataKey="value" stroke="#8b5cf6"
                                strokeWidth={1.5} dot={false} />
                              <Tooltip content={<SparkTooltip />} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}

                        {done && (
                          <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            <CheckCircle2 size={10} /> Goal reached!
                          </p>
                        )}

                        {g.deadline && !done && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Due {new Date(g.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
