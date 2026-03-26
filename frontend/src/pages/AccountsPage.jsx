import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Wallet, CreditCard, Banknote, PiggyBank, Smartphone } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay } from '../components/ui'
import AccountModal from '../modals/AccountModal'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useFetch } from '../hooks/useFetch'
import { accountService } from '../services/api'
import { formatCurrency } from '../utils/cn'

const TYPE_ICON = { cash: Banknote, bank: Wallet, credit_card: CreditCard, savings: PiggyBank, wallet: Smartphone }
const TYPE_COLOR = {
  cash:        { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  bank:        { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-400' },
  credit_card: { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400' },
  savings:     { bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-400' },
  wallet:      { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-400' },
}

export default function AccountsPage() {
  const { data: accounts, loading, refetch } = useFetch(accountService.list)
  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try { await accountService.delete(deleteTarget.id); setDeleteTarget(null); refetch() }
    finally { setDeleting(false) }
  }

  const totalBalance = (accounts || []).reduce((s, a) => s + parseFloat(a.balance || 0), 0)

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle={`Total balance: ${formatCurrency(totalBalance)}`}
        action={
          <button onClick={() => { setEditTarget(null); setModal(true) }} className="btn-primary">
            <Plus size={15} /> Add Account
          </button>
        }
      />

      {loading ? <LoadingOverlay /> : (
        <>
          {(!accounts || accounts.length === 0) ? (
            <EmptyState icon={Wallet} title="No accounts yet"
              desc="Add your first account to start tracking your finances."
              action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={15} />Add Account</button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {accounts.map((acc, i) => {
                const typeKey = acc.account_type?.toLowerCase() || 'bank'
                const colors = TYPE_COLOR[typeKey] || TYPE_COLOR.bank
                const Icon = TYPE_ICON[typeKey] || Wallet
                return (
                  <motion.div key={acc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card p-5 hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        <Icon size={18} className={colors.text} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditTarget(acc); setModal(true) }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(acc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-1 font-medium">{acc.account_name}</p>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(acc.balance)}</p>

                    <div className="mt-4 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      <span className="text-xs text-slate-500 capitalize">
                        {acc.account_type?.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      <AccountModal open={modal} onClose={() => { setModal(false); setEditTarget(null) }}
        onSaved={refetch} account={editTarget} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Account" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Delete <span className="font-semibold">{deleteTarget?.account_name}</span>? This cannot be undone.
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
