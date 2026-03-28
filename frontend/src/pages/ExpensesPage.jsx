import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay, Badge, ErrorBox } from '../components/ui'
import ExpenseModal from '../modals/ExpenseModal'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { expenseService, accountService, categoryService, tagService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/cn'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filters, setFilters] = useState({ category_id: '', account_id: '', tag_id: '', date_from: '', date_to: '' })
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Modals
  const [expenseModal, setExpenseModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.category_id) params.category_id = filters.category_id
      if (filters.account_id)  params.account_id  = filters.account_id
      if (filters.tag_id)      params.tag_id       = filters.tag_id
      if (filters.date_from)   params.date_from    = filters.date_from
      if (filters.date_to)     params.date_to      = filters.date_to
      const r = await expenseService.list(params)
      setExpenses(r.data)
    } catch (e) {
      setError('Failed to load expenses')
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    Promise.all([accountService.list(), categoryService.list(), tagService.list()])
      .then(([a, c, t]) => { setAccounts(a.data); setCategories(c.data); setTags(t.data) })
  }, [])

  const setFilter = k => e => setFilters(p => ({ ...p, [k]: e.target.value }))
  const clearFilters = () => setFilters({ category_id: '', account_id: '', tag_id: '', date_from: '', date_to: '' })

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await expenseService.delete(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } finally { setDeleting(false) }
  }

  const openEdit = (exp) => { setEditTarget(exp); setExpenseModal(true) }
  const handleModalClose = () => { setExpenseModal(false); setEditTarget(null) }
  const getCatName = (id) => categories.find(c => c.category_id === id)?.category_name || `${id}`
  const getAccName = (id) => accounts.find(a => a.account_id === id)?.account_name || `${id}`

  const filtered = expenses.filter(e => !search || (e.description || '').toLowerCase().includes(search.toLowerCase()))
  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setEditTarget(null); setExpenseModal(true) }} className="btn-primary">
            <Plus size={15} /> Add Expense
          </button>
        }
      />

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search expenses…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowFilters(p => !p)}
          className={`btn-secondary gap-2 ${hasActiveFilters ? 'border-brand-400 text-brand-600' : ''}`}>
          <SlidersHorizontal size={14} />
          Filters {hasActiveFilters && <span className="w-4 h-4 bg-brand-600 text-white rounded-full text-[10px] flex items-center justify-center">{Object.values(filters).filter(Boolean).length}</span>}
        </button>
        {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-500 transition-colors">Clear</button>}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="card p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={filters.category_id} onChange={setFilter('category_id')}>
                <option value="">All</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Account</label>
              <select className="input" value={filters.account_id} onChange={setFilter('account_id')}>
                <option value="">All</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tag</label>
              <select className="input" value={filters.tag_id} onChange={setFilter('tag_id')}>
                <option value="">All</option>
                {tags.map(t => <option key={t.tag_id} value={t.tag_id}>{t.tag_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">From</label>
              <input className="input" type="date" value={filters.date_from} onChange={setFilter('date_from')} />
            </div>
            <div>
              <label className="label">To</label>
              <input className="input" type="date" value={filters.date_to} onChange={setFilter('date_to')} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingOverlay /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/50">
                <tr>
                  {['Description', 'Date', 'Category', 'Account', 'Tags', 'Amount', ''].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <EmptyState icon={Filter} title="No expenses found" desc="Try adjusting your filters or add your first expense." />
                  </td></tr>
                ) : filtered.map(e => (
                  <tr key={e.expense_id} className="table-tr">
                    <td className="table-td">
                      <p className="font-medium text-slate-800">{e.description || '—'}</p>
                    </td>
                    <td className="table-td text-slate-500 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="table-td text-slate-600">{getCatName(e.category_name)}</td>
                    <td className="table-td text-slate-600">{getAccName(e.account_name)}</td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-1">
                        {(e.tags || []).slice(0, 3).map((t, i) => <Badge key={t.tag_id} label={t.tag_name} idx={i} />)}
                      </div>
                    </td>
                    <td className="table-td font-semibold text-red-500 whitespace-nowrap">
                      -{formatCurrency(e.amount)}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <ExpenseModal open={expenseModal} onClose={handleModalClose} onSaved={load} expense={editTarget} />

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Expense" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Delete <span className="font-semibold">{deleteTarget?.description || 'this expense'}</span> of{' '}
          <span className="font-semibold text-red-500">{formatCurrency(deleteTarget?.amount)}</span>?
          The amount will be refunded to the account balance.
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
