import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { expenseService, accountService, categoryService, paymentMethodService, tagService } from '../services/api'
import { ErrorBox, Spinner } from '../components/ui'

const EMPTY = { account_id: '', category_id: '', payment_method_id: '', amount: '', date: '', description: '', tag_ids: [] }

export default function ExpenseModal({ open, onClose, onSaved, expense }) {
  const [form, setForm] = useState(EMPTY)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [methods, setMethods] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    Promise.all([accountService.list(), categoryService.list(), paymentMethodService.list(), tagService.list()])
      .then(([a, c, m, t]) => {
        setAccounts(a.data); setCategories(c.data); setMethods(m.data); setTags(t.data)
      })
    if (expense) {
      setForm({ ...expense, tag_ids: (expense.tags || []).map(t => t.id) })
    } else {
      setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] })
    }
  }, [open, expense])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const toggleTag = (id) => {
    setForm(p => ({
      ...p,
      tag_ids: p.tag_ids.includes(id) ? p.tag_ids.filter(t => t !== id) : [...p.tag_ids, id]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id),
        category_id: parseInt(form.category_id),
        payment_method_id: form.payment_method_id ? parseInt(form.payment_method_id) : null,
        tag_ids: form.tag_ids,
      }
      if (expense) await expenseService.update(expense.id, payload)
      else await expenseService.create(payload)
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={error} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount *</label>
            <input className="input" type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amount} onChange={set('amount')} required />
          </div>
          <div>
            <label className="label">Date *</label>
            <input className="input" type="date" value={form.date} onChange={set('date')} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Account *</label>
            <select className="input" value={form.account_id} onChange={set('account_id')} required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category_id} onChange={set('category_id')} required>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Payment Method</label>
          <select className="input" value={form.payment_method_id} onChange={set('payment_method_id')}>
            <option value="">None</option>
            {methods.map(m => <option key={m.id} value={m.id}>{m.method_name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <input className="input" placeholder="What was this for?" value={form.description} onChange={set('description')} />
        </div>

        {tags.length > 0 && (
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    form.tag_ids.includes(t.id)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                  }`}>
                  {t.tag_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner size={14} /> : null}
            {expense ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
