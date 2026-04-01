import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pause, Play, RefreshCw, Trash2, Calendar, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay, ErrorBox } from '../components/ui'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useFetch } from '../hooks/useFetch'
import api, { accountService, categoryService, paymentMethodService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/cn'

// ── API service ───────────────────────────────────────────────────────────────
const subService = {
  list:   ()         => api.get('/api/recurring/'),
  create: (data)     => api.post('/api/recurring/', data),
  update: (id, data) => api.put(`/api/recurring/${id}`, data),
  delete: (id)       => api.delete(`/api/recurring/${id}`),
  pause:  (id)       => api.put(`/api/recurring/${id}`, { status: 'paused' }),
  resume: (id)       => api.put(`/api/recurring/${id}`, { status: 'active' }),
}

const FREQ_COLOR = {
  daily:   'bg-red-50 text-red-600',
  weekly:  'bg-amber-50 text-amber-600',
  monthly: 'bg-blue-50 text-blue-600',
  yearly:  'bg-violet-50 text-violet-600',
}

const TO_MONTHLY = { daily: 30, weekly: 4.33, monthly: 1, yearly: 1 / 12 }

const EMPTY_FORM = {
  title:             '',
  account_id:        '',
  category_id:       '',
  payment_method_id: '',
  amount:            '',
  frequency:         'monthly',
  start_date:        new Date().toISOString().split('T')[0],
  end_date:          '',
}

export default function SubscriptionsPage() {
  const { data: subs, loading, refetch } = useFetch(subService.list)
  const { data: accounts }       = useFetch(accountService.list)
  const { data: categories }     = useFetch(categoryService.list)
  const { data: paymentMethods } = useFetch(paymentMethodService.list)

  // Add modal
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  // Edit modal
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState('')

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null)

  const set     = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setEdit = k => e => setEditForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setForm(EMPTY_FORM); setError(''); setModal(true) }

  const openEdit = (sub) => {
    setEditTarget(sub)
    setEditForm({
      amount:    sub.amount,
      frequency: sub.frequency,
      end_date:  sub.end_date ? sub.end_date.split('T')[0] : '',
      status:    sub.status,
    })
    setEditError('')
  }

  // Create
  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await subService.create({
        title:             form.title,
        account_id:        parseInt(form.account_id),
        category_id:       parseInt(form.category_id),
        payment_method_id: parseInt(form.payment_method_id),
        amount:            parseFloat(form.amount),
        frequency:         form.frequency,
        start_date:        form.start_date,
        end_date:          form.end_date || null,
      })
      setModal(false); refetch()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subscription')
    } finally { setSaving(false) }
  }

  // Update — only the 4 fields the backend accepts
  const handleEdit = async (e) => {
    e.preventDefault(); setEditError(''); setEditSaving(true)
    try {
      await subService.update(editTarget.recurring_id, {
        amount:    parseFloat(editForm.amount),
        frequency: editForm.frequency,
        end_date:  editForm.end_date || null,
        status:    editForm.status,
      })
      setEditTarget(null); refetch()
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update subscription')
    } finally { setEditSaving(false) }
  }

  // Pause / Resume
  const toggle = async (sub) => {
    try {
      if (sub.status === 'active') await subService.pause(sub.recurring_id)
      else                         await subService.resume(sub.recurring_id)
      refetch()
    } catch (_) {}
  }

  // Delete
  const handleDelete = async () => {
    try {
      await subService.delete(deleteTarget.recurring_id)
    } finally {
      setDeleteTarget(null); refetch()
    }
  }

  const active    = (subs || []).filter(s => s.status === 'active')
  const paused    = (subs || []).filter(s => s.status === 'paused')
  const cancelled = (subs || []).filter(s => s.status === 'cancelled')

  const monthlyTotal = active.reduce((sum, sub) => (
    sum + parseFloat(sub.amount) * (TO_MONTHLY[sub.frequency] ?? 1)
  ), 0)

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle={`${active.length} active · ~${formatCurrency(monthlyTotal)}/month`}
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus size={15} /> Add Subscription
          </button>
        }
      />

      {loading ? <LoadingOverlay /> : (
        <>
          {/* Active */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Active</p>
          {active.length === 0 ? (
            <EmptyState icon={RefreshCw} title="No active subscriptions"
              desc="Add a recurring payment to get started."
              action={<button onClick={openAdd} className="btn-primary"><Plus size={14} />Add</button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {active.map((sub, i) => (
                <SubCard key={sub.recurring_id} sub={sub} i={i}
                  onToggle={toggle} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))}
            </div>
          )}

          {/* Paused */}
          {paused.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 mt-2">Paused</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paused.map((sub, i) => (
                  <SubCard key={sub.recurring_id} sub={sub} i={i}
                    onToggle={toggle} onEdit={openEdit} onDelete={setDeleteTarget} />
                ))}
              </div>
            </>
          )}

          {/* Cancelled */}
          {cancelled.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 mt-2">Cancelled</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cancelled.map((sub, i) => (
                  <SubCard key={sub.recurring_id} sub={sub} i={i}
                    onToggle={toggle} onEdit={openEdit} onDelete={setDeleteTarget} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Subscription" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorBox message={error} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subscription name *</label>
              <input
                className="input"
                placeholder="e.g. Netflix, Spotify, Gym membership"
                value={form.title}
                onChange={set('title')}
                required
              />
            </div>
            <div>
              <label className="label">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input className="input pl-7" type="number" step="0.01" min="0"
                  placeholder="0.00" value={form.amount} onChange={set('amount')} required />
              </div>
            </div>
            <div>
              <label className="label">Frequency *</label>
              <select className="input" value={form.frequency} onChange={set('frequency')}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Account *</label>
            <select className="input" value={form.account_id} onChange={set('account_id')} required>
              <option value="">Select account…</option>
              {(accounts || []).map(a => (
                <option key={a.account_id} value={a.account_id}>{a.account_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category_id} onChange={set('category_id')} required>
              <option value="">Select category…</option>
              {(categories || []).map(c => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Payment Method *</label>
            <select className="input" value={form.payment_method_id} onChange={set('payment_method_id')} required>
              <option value="">Select payment method…</option>
              {(paymentMethods || []).map(pm => (
                <option key={pm.payment_method_id} value={pm.payment_method_id}>{pm.method_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date *</label>
              <input className="input" type="date" value={form.start_date} onChange={set('start_date')} required />
            </div>
            <div>
              <label className="label">End Date <span className="text-slate-400 font-normal">(optional)</span></label>
              <input className="input" type="date" value={form.end_date} onChange={set('end_date')} min={form.start_date} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Subscription" size="md">
        <form onSubmit={handleEdit} className="space-y-4">
          <ErrorBox message={editError} />

          {editTarget && (
            <p className="text-sm text-slate-500">
              Editing <span className="font-semibold text-slate-700">{editTarget.category_name}</span>
              {' · '}<span className="font-semibold text-slate-700">{editTarget.account_name}</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input className="input pl-7" type="number" step="0.01" min="0"
                  value={editForm.amount} onChange={setEdit('amount')} required />
              </div>
            </div>
            <div>
              <label className="label">Frequency *</label>
              <select className="input" value={editForm.frequency} onChange={setEdit('frequency')}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Status *</label>
            <select className="input" value={editForm.status} onChange={setEdit('status')}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="label">End Date <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className="input" type="date" value={editForm.end_date} onChange={setEdit('end_date')} />
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
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Subscription" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Permanently delete the{' '}
          <span className="font-semibold">{deleteTarget?.category_name}</span> subscription
          for <span className="font-semibold">{deleteTarget && formatCurrency(deleteTarget.amount)}</span>?
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  )
}

// ── SubCard ───────────────────────────────────────────────────────────────────
function SubCard({ sub, i, onToggle, onEdit, onDelete }) {
  const freqClr  = FREQ_COLOR[sub.frequency] || 'bg-slate-50 text-slate-600'
  const isActive = sub.status === 'active'
  const isPast   = new Date(sub.start_date) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className={`card p-5 ${!isActive ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <RefreshCw size={15} className="text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{sub.title || sub.category_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${freqClr}`}>
                {sub.frequency}
              </span>
              <span className="text-[11px] text-slate-400">{sub.account_name}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {sub.status !== 'cancelled' && (
            <button onClick={() => onToggle(sub)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              title={isActive ? 'Pause' : 'Resume'}>
              {isActive ? <Pause size={13} /> : <Play size={13} />}
            </button>
          )}
          <button onClick={() => onEdit(sub)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            title="Edit">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(sub)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p className="text-2xl font-bold text-slate-800 mb-3">{formatCurrency(sub.amount)}</p>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs ${isPast && isActive ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
          <Calendar size={11} />
          {isPast && isActive ? '⚠ Started ' : 'Since '}
          {formatDate(sub.start_date)}
        </div>
        <span className="text-[11px] text-slate-400">{sub.method_name}</span>
      </div>

      {sub.end_date && (
        <p className="text-[11px] text-slate-400 mt-1.5">Ends {formatDate(sub.end_date)}</p>
      )}
    </motion.div>
  )
}