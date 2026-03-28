import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, TrendingUp, AlertCircle, CheckCircle2, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay, ErrorBox } from '../components/ui'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useFetch } from '../hooks/useFetch'
import api from '../services/api'
import { categoryService } from '../services/api'
import { formatCurrency } from '../utils/cn'

const budgetService = {
  list:   ()           => api.get('/api/budgets/'),
  create: (data)       => api.post('/api/budgets/', data),
  update: (id, data)   => api.put(`/api/budgets/${id}`, data),
  delete: (id)         => api.delete(`/api/budgets/${id}`),
  status: (cid, m, y)  => api.get('/api/budgets/status', { params: { category_id: cid, month: m, year: y } }),
}

const NOW    = new Date()
const CUR_M  = NOW.getMonth() + 1
const CUR_Y  = NOW.getFullYear()

function BudgetStatusBar({ budget, categories }) {
  const [status, setStatus] = useState(null)
  const catName = categories.find(c => c.category_id == budget.category_id)?.category_name || `#${budget.category_id}`

  const spent = parseFloat(budget.spent || 0);
  const limit = parseFloat(budget.amount || 0);

  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const exceeded = spent > limit;
  const barClr = exceeded ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{catName}</p>
          <p className="text-xs text-slate-400">
            {String(budget.month).padStart(2, '0')} / {budget.year}
          </p>
        </div>
        {exceeded
          ? <AlertCircle size={16} className="text-red-500" />
          : <CheckCircle2 size={16} className="text-emerald-400" />}
      </div>

      <p className="text-2xl font-bold text-slate-800 mb-1">{formatCurrency(budget.amount)}</p>
      <p className="text-xs text-slate-400 mb-3">Monthly limit</p>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
          {/* Use budget.spent instead of status.spent */}
          <span>{formatCurrency(budget.spent || 0)} spent</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${barClr}`} 
            style={{ width: `${pct}%` }} 
          />
        </div>
      </div>

      {/* Remaining balance text */}
      <p className={`text-xs font-medium ${exceeded ? 'text-red-500' : 'text-slate-500'}`}>
        {exceeded
          ? `Over by ${formatCurrency(Math.abs((budget.spent || 0) - budget.amount))}`
          : `${formatCurrency(budget.amount - (budget.spent || 0))} remaining`}
      </p>

      {status && (
        <p className={`text-xs font-medium ${exceeded ? 'text-red-500' : 'text-slate-500'}`}>
          {exceeded
            ? `Over by ${formatCurrency(Math.abs(status.remaining))}`
            : `${formatCurrency(status.remaining)} remaining`}
        </p>
      )}
    </motion.div>
  )
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const EMPTY  = { category_id: '', monthly_limit: '', month: CUR_M, year: CUR_Y }

export default function BudgetsPage() {
  const { data: budgets,    loading,  refetch } = useFetch(budgetService.list)
  const { data: categories }                    = useFetch(categoryService.list)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget]     = useState(null)
  const [editForm, setEditForm]         = useState({ monthly_limit: '', month: CUR_M, year: CUR_Y })
  const [editError, setEditError]       = useState('')
  const [editSaving, setEditSaving]     = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setEdit = k => e => setEditForm(p => ({ ...p, [k]: e.target.value }))

  const openEdit = (b) => {
    setEditTarget(b)
    setEditForm({
      monthly_limit: b.amount,
      month: b.month,
      year: b.year,
    })
    setEditError('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await budgetService.create({
        category_id:   parseInt(form.category_id),
        amount: parseFloat(form.monthly_limit),
        month:         parseInt(form.month),
        year:          parseInt(form.year),
      })
      setModal(false)
      setForm(EMPTY)
      refetch()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create budget')
    } finally { setSaving(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSaving(true)
    try {
      await budgetService.update(editTarget.budget_id, {
        category_id: editTarget.category_id,
        amount:      parseFloat(editForm.monthly_limit),
        month:       parseInt(editForm.month),
        year:        parseInt(editForm.year),
      })
      setEditTarget(null)
      refetch()
    } catch (err) {
      setEditError(err.response?.data?.detail || 'Failed to update budget')
    } finally { setEditSaving(false) }
  }

  const handleDelete = async () => {
    await budgetService.delete(deleteTarget.budget_id)
    setDeleteTarget(null); refetch()
  }

  const curMonthBudgets = (budgets || []).filter(b => b.month === CUR_M && b.year === CUR_Y)
  const otherBudgets    = (budgets || []).filter(b => !(b.month === CUR_M && b.year === CUR_Y))

  const BudgetCard = (b) => (
    <div key={b.budget_id} className="relative group">
      <BudgetStatusBar budget={b} categories={categories || []} />
      {/* Edit button — appears on hover, left of delete */}
      <button
        onClick={() => openEdit(b)}
        className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
        title="Edit budget"
      >
        <Pencil size={12} />
      </button>
      {/* Delete button */}
      <button
        onClick={() => setDeleteTarget(b)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
        title="Remove budget"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle="Set monthly spending limits per category"
        action={
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus size={15} /> Set Budget
          </button>
        }
      />

      {loading ? <LoadingOverlay /> : (budgets || []).length === 0 ? (
        <EmptyState icon={TrendingUp} title="No budgets set"
          desc="Set a monthly limit for a category to start tracking overspend."
          action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={14} />Set Budget</button>} />
      ) : (
        <>
          {curMonthBudgets.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                {MONTHS[CUR_M - 1]} {CUR_Y} — Current Month
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {curMonthBudgets.map(BudgetCard)}
              </div>
            </>
          )}

          {otherBudgets.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Past Months</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {otherBudgets.map(BudgetCard)}
              </div>
            </>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setError('') }} title="Set Monthly Budget" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorBox message={error} />
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category_id} onChange={set('category_id')} required>
              <option value="">Select category</option>
              {(categories || []).map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Monthly Limit *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
              <input className="input pl-7" type="number" step="0.01" min="1"
                placeholder="0.00" value={form.monthly_limit} onChange={set('monthly_limit')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Month</label>
              <select className="input" value={form.month} onChange={set('month')}>
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input className="input" type="number" min="2020" max="2099"
                value={form.year} onChange={set('year')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Set Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); setEditError('') }} title="Edit Budget" size="md">
        <form onSubmit={handleEdit} className="space-y-4">
          <ErrorBox message={editError} />
          {/* Category is read-only in edit mode */}
          <div>
            <label className="label">Category</label>
            <input
              className="input bg-slate-50 text-slate-500 cursor-not-allowed"
              readOnly
              value={
                (categories || []).find(c => c.category_id == editTarget?.category_id)?.category_name
                || `#${editTarget?.category_id}`
              }
            />
          </div>
          <div>
            <label className="label">Monthly Limit *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
              <input className="input pl-7" type="number" step="0.01" min="1"
                placeholder="0.00" value={editForm.monthly_limit} onChange={setEdit('monthly_limit')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Month</label>
              <select className="input" value={editForm.month} onChange={setEdit('month')}>
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input className="input" type="number" min="2020" max="2099"
                value={editForm.year} onChange={setEdit('year')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={editSaving} className="btn-primary">
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Budget" size="sm">
        <p className="text-sm text-slate-600 mb-4">Remove this budget limit? Expense data is unaffected.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">Remove</button>
        </div>
      </Modal>
    </div>
  )
}