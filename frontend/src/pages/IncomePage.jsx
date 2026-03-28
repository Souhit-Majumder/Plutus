import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay, ErrorBox } from '../components/ui'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useFetch } from '../hooks/useFetch'
import { incomeService, accountService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/cn'

const SOURCES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']
const EMPTY = { account_id: '', amount: '', date: '', description: '' }

export default function IncomePage() {
  const { data: incomes, loading, refetch } = useFetch(incomeService.list)
  const { data: accounts } = useFetch(accountService.list)

  const [form, setForm] = useState({ ...EMPTY, date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess(false)
    try {
      await incomeService.create({
        account_id:  parseInt(form.account_id),
        amount:      parseFloat(form.amount),
        date:        form.date,
        description: form.description || null,
      })
      setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] })
      setSuccess(true)
      refetch()
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add income')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await incomeService.delete(deleteTarget.income_id)
      setDeleteTarget(null)
      refetch()
    } finally { setDeleting(false) }
  }

  const totalIncome = (incomes || []).reduce((s, i) => s + parseFloat(i.amount || 0), 0)
  const thisMonth   = new Date().toISOString().slice(0, 7)
  const monthIncome = (incomes || [])
    .filter(i => i.date?.startsWith(thisMonth))
    .reduce((s, i) => s + parseFloat(i.amount || 0), 0)

  return (
    <div>
      <PageHeader
        title="Income"
        subtitle="Track all your income sources"
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total All Time', value: formatCurrency(totalIncome), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'This Month',     value: formatCurrency(monthIncome), color: 'text-blue-600',    bg: 'bg-blue-50'   },
          { label: 'Records',        value: (incomes || []).length,      color: 'text-violet-600',  bg: 'bg-violet-50' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card px-5 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
              <TrendingUp size={16} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* The grid is set to full viewport height minus the header/strip so neither column overflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">

        {/* ── Add Income Form ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card p-5 lg:col-span-1 h-fit"
        >
          <p className="text-sm font-semibold text-slate-800 mb-4">Add Income</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <ErrorBox message={error} />

            {success && (
              <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
                ✓ Income added successfully
              </div>
            )}

            <div>
              <label className="label">Amount *</label>
              <input className="input" type="number" step="0.01" min="0"
                placeholder="0.00" value={form.amount} onChange={set('amount')} required />
            </div>

            <div>
              <label className="label">Account *</label>
              <select className="input" value={form.account_id} onChange={set('account_id')} required>
                <option value="">Select account</option>
                {(accounts || []).map(a => (
                  <option key={a.account_id} value={a.account_id}>{a.account_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Source / Description</label>
              <select className="input" value={form.description} onChange={set('description')}>
                <option value="">Select source</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.date} onChange={set('date')} required />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-2.5 mt-1">
              {saving ? 'Adding…' : <><Plus size={14} /> Add Income</>}
            </button>
          </form>
        </motion.div>

        {/* ── Income Table ─────────────────────────────────────────────
            The card itself does NOT grow taller than the viewport.
            The table body scrolls internally so the delete buttons are
            always reachable without scrolling the whole page.
        ──────────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card flex flex-col lg:col-span-2"
          style={{ maxHeight: 'calc(100vh - 260px)' }}
        >
          {/* Sticky header inside the card */}
          <div className="px-5 py-4 border-b border-slate-100 shrink-0">
            <p className="text-sm font-semibold text-slate-800">Income History</p>
          </div>

          {loading ? <LoadingOverlay /> : (
            /* This wrapper takes all remaining card height and scrolls */
            <div className="overflow-y-auto flex-1 overflow-x-auto">
              <table className="w-full">
                {/* Sticky thead so column labels stay visible while scrolling */}
                <thead className="border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="table-th">Source</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Account</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {(incomes || []).length === 0 ? (
                    <tr><td colSpan={5}>
                      <EmptyState icon={TrendingUp} title="No income records yet"
                        desc="Add your first income entry using the form." />
                    </td></tr>
                  ) : (
                    [...(incomes || [])]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(inc => (
                        <tr key={inc.account_id} className="table-tr">
                          <td className="table-td font-medium text-slate-800">
                            {inc.description || '—'}
                          </td>
                          <td className="table-td text-slate-500 whitespace-nowrap">
                            {formatDate(inc.date)}
                          </td>
                          <td className="table-td text-slate-500">
                            {inc.account_name}
                          </td>
                          <td className="table-td font-semibold text-emerald-600 whitespace-nowrap">
                            +{formatCurrency(inc.amount)}
                          </td>
                          <td className="table-td">
                            <button
                              onClick={() => setDeleteTarget(inc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete confirm modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Income" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Delete income of{' '}
          <span className="font-semibold text-emerald-600">{formatCurrency(deleteTarget?.amount)}</span>?
          The amount will be deducted from the account balance.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}