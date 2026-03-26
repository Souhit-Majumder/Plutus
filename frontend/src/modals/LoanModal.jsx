import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { loanService, personService } from '../services/api'
import { ErrorBox, Spinner } from '../components/ui'

const EMPTY = { person_id: '', loan_type: 'lent', amount: '', loan_date: '', due_date: '', description: '' }

export default function LoanModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newPerson, setNewPerson] = useState('')
  const [addingPerson, setAddingPerson] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, loan_date: new Date().toISOString().split('T')[0] })
      personService.list().then(r => setPersons(r.data))
    }
    setError('')
  }, [open])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleAddPerson = async () => {
    if (!newPerson.trim()) return
    setAddingPerson(true)
    try {
      const r = await personService.create({ person_name: newPerson })
      setPersons(p => [...p, r.data])
      setForm(f => ({ ...f, person_id: r.data.id }))
      setNewPerson('')
    } finally { setAddingPerson(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await loanService.create({
        ...form,
        amount: parseFloat(form.amount),
        person_id: parseInt(form.person_id),
        due_date: form.due_date || null,
      })
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create loan')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Loan" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={error} />

        <div>
          <label className="label">Person *</label>
          <div className="flex gap-2">
            <select className="input flex-1" value={form.person_id} onChange={set('person_id')} required>
              <option value="">Select person</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.person_name}</option>)}
            </select>
            <div className="flex gap-1">
              <input className="input w-36" placeholder="New person" value={newPerson}
                onChange={e => setNewPerson(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddPerson())} />
              <button type="button" onClick={handleAddPerson} disabled={addingPerson}
                className="btn-secondary px-3">+</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.loan_type} onChange={set('loan_type')}>
              <option value="lent">I lent (they owe me)</option>
              <option value="borrowed">I borrowed (I owe them)</option>
            </select>
          </div>
          <div>
            <label className="label">Amount *</label>
            <input className="input" type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amount} onChange={set('amount')} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Loan Date</label>
            <input className="input" type="date" value={form.loan_date} onChange={set('loan_date')} />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.due_date} onChange={set('due_date')} />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <input className="input" placeholder="What is this loan for?" value={form.description} onChange={set('description')} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Spinner size={14} />} Add Loan
          </button>
        </div>
      </form>
    </Modal>
  )
}
