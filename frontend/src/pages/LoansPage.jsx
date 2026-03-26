import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, CheckCircle2, Handshake, Calendar, User } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay } from '../components/ui'
import LoanModal from '../modals/LoanModal'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { loanService, personService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/cn'

const TABS = ['lent', 'borrowed', 'completed']
const TAB_LABEL = { lent: 'Lent (They owe me)', borrowed: 'Borrowed (I owe them)', completed: 'Completed' }

export default function LoansPage() {
  const [activeTab, setActiveTab] = useState('lent')
  const [loans, setLoans] = useState([])
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [repayTarget, setRepayTarget] = useState(null)
  const [repaying, setRepaying] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [all, ppl] = await Promise.all([loanService.list(), personService.list()])
      setLoans(all.data); setPersons(ppl.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const personName = (id) => persons.find(p => p.id === id)?.person_name || `#${id}`

  const filtered = loans.filter(l => {
    if (activeTab === 'completed') return l.status === 'repaid'
    return l.loan_type === activeTab && l.status === 'active'
  })

  const handleRepay = async () => {
    setRepaying(true)
    try { await loanService.repay(repayTarget.id); setRepayTarget(null); load() }
    finally { setRepaying(false) }
  }

  const totalLent     = loans.filter(l => l.loan_type === 'lent'     && l.status === 'active').reduce((s, l) => s + parseFloat(l.amount), 0)
  const totalBorrowed = loans.filter(l => l.loan_type === 'borrowed' && l.status === 'active').reduce((s, l) => s + parseFloat(l.amount), 0)

  return (
    <div>
      <PageHeader
        title="Loans"
        subtitle={`Outstanding: ${formatCurrency(totalLent)} lent · ${formatCurrency(totalBorrowed)} borrowed`}
        action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={15} /> Add Loan</button>}
      />

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      {loading ? <LoadingOverlay /> : filtered.length === 0 ? (
        <EmptyState icon={Handshake} title={`No ${activeTab} loans`}
          desc="Add a loan to start tracking."
          action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={15} />Add Loan</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((loan, i) => {
            const isOverdue = loan.due_date && new Date(loan.due_date) < new Date() && loan.status === 'active'
            return (
              <motion.div key={loan.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      loan.loan_type === 'lent' ? 'bg-blue-50' : 'bg-amber-50'
                    }`}>
                      <User size={15} className={loan.loan_type === 'lent' ? 'text-blue-600' : 'text-amber-600'} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{personName(loan.person_id)}</p>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                        loan.loan_type === 'lent' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {loan.loan_type === 'lent' ? 'They owe me' : 'I owe them'}
                      </span>
                    </div>
                  </div>
                  {loan.status === 'repaid' ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <button onClick={() => setRepayTarget(loan)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-medium hover:bg-emerald-100 transition-colors">
                      Mark Repaid
                    </button>
                  )}
                </div>

                <p className="text-2xl font-bold text-slate-800 mb-3">{formatCurrency(loan.amount)}</p>

                {loan.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{loan.description}</p>
                )}

                <div className="space-y-1.5 border-t border-slate-50 pt-3">
                  {loan.loan_date && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={11} /> Lent on {formatDate(loan.loan_date)}
                    </div>
                  )}
                  {loan.due_date && (
                    <div className={`flex items-center gap-2 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                      <Calendar size={11} />
                      {isOverdue ? '⚠ Overdue — ' : 'Due '}
                      {formatDate(loan.due_date)}
                    </div>
                  )}
                  {loan.repaid_date && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <CheckCircle2 size={11} /> Repaid on {formatDate(loan.repaid_date)}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <LoanModal open={modal} onClose={() => setModal(false)} onSaved={load} />

      <Modal open={!!repayTarget} onClose={() => setRepayTarget(null)} title="Mark Loan as Repaid" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Mark the loan of <span className="font-semibold text-slate-800">{formatCurrency(repayTarget?.amount)}</span>{' '}
          with <span className="font-semibold">{personName(repayTarget?.person_id)}</span> as fully repaid?
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setRepayTarget(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleRepay} disabled={repaying}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            {repaying ? 'Saving…' : '✓ Mark Repaid'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
