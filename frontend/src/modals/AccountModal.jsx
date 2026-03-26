import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { accountService } from '../services/api'
import { ErrorBox, Spinner } from '../components/ui'

const TYPES = ['cash', 'bank', 'credit_card', 'savings', 'wallet', 'other']
const EMPTY = { account_name: '', account_type: 'cash', balance: '0' }

export default function AccountModal({ open, onClose, onSaved, account }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) setForm(account ? { ...account } : EMPTY)
    setError('')
  }, [open, account])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = { ...form, balance: parseFloat(form.balance || 0) }
      if (account) await accountService.update(account.id, { account_name: form.account_name, account_type: form.account_type })
      else await accountService.create(payload)
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={account ? 'Edit Account' : 'Add Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={error} />
        <div>
          <label className="label">Account Name *</label>
          <input className="input" placeholder="e.g. HDFC Savings" value={form.account_name} onChange={set('account_name')} required />
        </div>
        <div>
          <label className="label">Account Type *</label>
          <select className="input" value={form.account_type} onChange={set('account_type')}>
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>
        {!account && (
          <div>
            <label className="label">Opening Balance</label>
            <input className="input" type="number" step="0.01" placeholder="0.00" value={form.balance} onChange={set('balance')} />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Spinner size={14} />}
            {account ? 'Save Changes' : 'Add Account'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
