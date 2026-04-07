import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, CheckCircle2, Bell, Trash2, Calendar, AlertTriangle, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay, ErrorBox } from '../components/ui'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useFetch } from '../hooks/useFetch'
import api from '../services/api'
import { formatDate } from '../utils/cn'

const reminderService = {
  list:     ()     => api.get('/api/reminders/'),
  pending:  ()     => api.get('/api/reminders/pending'),
  overdue:  ()     => api.get('/api/reminders/overdue'),
  create:   (data) => api.post('/api/reminders/', data),
  update:   (id, data) => api.put(`/api/reminders/${id}`, data),
  complete: (id)   => api.post(`/api/reminders/${id}/complete`),
  delete:   (id)   => api.delete(`/api/reminders/${id}`),
}

const TABS = ['all', 'pending', 'overdue']
const TAB_LABEL = { all: 'All', pending: 'Upcoming', overdue: 'Overdue' }

const EMPTY = {
  title: '',
  reminder_date: new Date().toISOString().split('T')[0],
  note: ''
}

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState('all')

  const fetchFn =
    activeTab === 'pending'
    ? reminderService.pending
    : activeTab === 'overdue'
    ? reminderService.overdue
    : reminderService.list

  const { data: reminders, loading, refetch } = useFetch(fetchFn, [activeTab])

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const openCreate = () => {
  setEditing(null)
  setForm(EMPTY)
  setModal(true)
}

const openEdit = (r) => {
  setEditing(r)
  setForm({
  title: r.reminder_type,
  reminder_date: r.reminder_date,
  note: r.description || ''
  })
  setModal(true)
}

const handleCreate = async (e) => {
  e.preventDefault()
  setError('')
  setSaving(true)

  try {
    const payload = {
      reminder_type: form.title,
      reminder_date: form.reminder_date,
      description: form.note || null
    }

    if (editing) {
      await reminderService.update(editing.reminder_id, payload)
    } else {
      await reminderService.create({ ...payload, status: 'pending' })
    }

    setModal(false)
    setEditing(null)
    setForm(EMPTY)
    refetch()
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to save reminder')
  } finally {
    setSaving(false)
  }

}

const handleComplete = async (id) => {
  try {
    await reminderService.complete(id)
    refetch()
  } catch (err) {
    console.error('Failed to complete reminder:', err)
    alert(err.response?.data?.message || 'Failed to mark reminder as done')
  }
}

const handleDelete = async (id) => {
  await reminderService.delete(id)
  refetch()
}

const handleEdit = (r) => {
  setEditing(r)
  setForm({
    title: r.reminder_type,
    reminder_date: r.reminder_date,
    note: r.description || ''
  })
  setModal(true)
}

const overdueCt = (reminders || []).filter((r) =>
  r.status !== 'done' &&
  r.reminder_date &&
  new Date(r.reminder_date) < new Date()
  ).length

  return ( 
    <div> <PageHeader
        title="Reminders"
        subtitle={overdueCt > 0 ? `${overdueCt} overdue` : 'Stay on top of your tasks'}
        action={ <button onClick={openCreate} className="btn-primary"> <Plus size={15} /> Add Reminder </button>
        }
    />

    {/* Tabs */}
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === tab
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab === 'overdue' && overdueCt > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
              {overdueCt}
            </span>
          )}
          {TAB_LABEL[tab]}
        </button>
      ))}
    </div>

    {loading ? (
      <LoadingOverlay />
    ) : (reminders || []).length === 0 ? (
      <EmptyState
        icon={Bell}
        title={`No ${TAB_LABEL[activeTab].toLowerCase()} reminders`}
        desc="Add a reminder to stay on top of bills and tasks."
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={14} /> Add Reminder
          </button>
        }
      />
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(reminders || []).map((r, i) => {
          const overdue =
            r.status !== 'done' &&
            r.reminder_date &&
            new Date(r.reminder_date) < new Date()

          return (
            <motion.div
              key={r.reminder_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-5 ${r.status === 'done' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      r.status === 'done'
                        ? 'bg-emerald-50'
                        : overdue
                        ? 'bg-red-50'
                        : 'bg-blue-50'
                    }`}
                  >
                    {r.status === 'done' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : overdue ? (
                      <AlertTriangle size={14} className="text-red-500" />
                    ) : (
                      <Bell size={14} className="text-blue-500" />
                    )}
                  </div>

                  <p
                    onClick={() => openEdit(r)}
                    className={`cursor-pointer text-sm font-semibold ${
                      r.status === 'done'
                        ? 'line-through text-slate-400'
                        : 'text-slate-800'
                    }`}
                  >
                    {r.reminder_type}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0">
                  <div className="flex gap-1 shrink-0">

                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      title="Edit reminder"
                    >
                      <Pencil size={13} />
                    </button>

                    {/* Complete button */}
                    {r.status !== 'done' && (
                      <button
                        onClick={() => handleComplete(r.reminder_id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Mark complete"
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(r.reminder_id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>

                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-1.5 text-xs mb-2 font-medium ${
                  overdue ? 'text-red-500' : 'text-slate-400'
                }`}
              >
                <Calendar size={11} />
                {overdue ? '⚠ Overdue · ' : ''}
                {r.reminder_date ? formatDate(r.reminder_date) : '—'}
              </div>

              {r.description && (
                <p className="text-xs text-slate-500 line-clamp-2">
                  {r.description}
                </p>
              )}
            </motion.div>
          )
        })}
      </div>
    )}

    {/* Modal */}
    <Modal
      open={modal}
      onClose={() => {
        setModal(false)
        setEditing(null)
        setError('')
      }}
      title={editing ? 'Edit Reminder' : 'Add Reminder'}
      size="sm"
    >
      <form onSubmit={handleCreate} className="space-y-4">
        <ErrorBox message={error} />

        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            placeholder="e.g. Pay electricity bill"
            value={form.title}
            onChange={set('title')}
            required
          />
        </div>

        <div>
          <label className="label">Due Date *</label>
          <input
            className="input"
            type="date"
            value={form.reminder_date}
            onChange={set('reminder_date')}
            required
          />
        </div>

        <div>
          <label className="label">Note (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Any extra details…"
            value={form.note}
            onChange={set('note')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setModal(false)}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Reminder'}
          </button>
        </div>
      </form>
    </Modal>
  </div>
  )
}