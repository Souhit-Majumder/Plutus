import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Wallet, CreditCard, Banknote, PiggyBank, Smartphone, TrendingUp, TrendingDown } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay } from '../components/ui'
import AccountModal from '../modals/AccountModal'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import ExpenseLineChart from '../charts/LineChart'
import CategoryBarChart from '../charts/BarChart'
import MiniSparkline from '../charts/MiniSparkline'
import { accountService, expenseService, incomeService } from '../services/api'
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
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])

  const [selectedAccountId, setSelectedAccountId] = useState('all')

  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [a, e, inc] = await Promise.all([
        accountService.list(),
        expenseService.list(),
        incomeService.list()
      ])
      setAccounts(a.data)
      setExpenses(e.data)
      setIncomes(inc.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try { 
      await accountService.delete(deleteTarget.account_id)
      setDeleteTarget(null)
      fetchData()
    } finally { 
      setDeleting(false) 
    }
  }

  // Filter data based on selected account
  const filteredAccounts = selectedAccountId === 'all' 
    ? accounts 
    : accounts.filter(a => a.account_id.toString() === selectedAccountId)

  const filteredExpenses = selectedAccountId === 'all'
    ? expenses
    : expenses.filter(e => e.account_id?.toString() === selectedAccountId)

  const filteredIncomes = selectedAccountId === 'all'
    ? incomes
    : incomes.filter(i => i.account_id?.toString() === selectedAccountId)

  // ── Derived Stats ──
  const totalBalance = filteredAccounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0)
  
  const thisMonth = format(new Date(), 'yyyy-MM')
  const isThisMonth = d => d && format(new Date(d), 'yyyy-MM') === thisMonth
  const monthExpenses = filteredExpenses.filter(e => isThisMonth(e.date))
  const monthIncomes  = filteredIncomes.filter(i => isThisMonth(i.date))
  const totalSpent  = monthExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const totalIncome = monthIncomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0)

  const lastMonthDate = subMonths(new Date(), 1)
  const lastMonthKey = format(lastMonthDate, 'yyyy-MM')
  const isLastMonth = d => d && format(new Date(d), 'yyyy-MM') === lastMonthKey
  const lastMonthExpenses = filteredExpenses.filter(e => isLastMonth(e.date))
  const lastMonthIncomes = filteredIncomes.filter(i => isLastMonth(i.date))
  const lastTotalSpent = lastMonthExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const lastTotalIncome = lastMonthIncomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0)

  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const incomeTrend = getTrend(totalIncome, lastTotalIncome)
  const expenseTrend = getTrend(totalSpent, lastTotalSpent)

  const TrendBadge = ({ value }) => {
    const isPositive = value >= 0;
    const ColorClass = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ColorClass}`}>
        <Icon size={10} />
        {Math.abs(value)}% (30 days)
      </div>
    );
  };

  // ── Chart Data ──
  const lineData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const key = format(d, 'yyyy-MM')
    const matchMonth = date => date && format(new Date(date), 'yyyy-MM') === key
    
    const exp = filteredExpenses.filter(e => matchMonth(e.date)).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const inc = filteredIncomes.filter(e => matchMonth(e.date)).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    return { month: format(d, 'MMM'), expenses: exp, income: inc }
  })

  // Group by category for bar chart
  const catMap = {}
  filteredExpenses.forEach(e => {
    const catName = e.category_name || 'Other'
    catMap[catName] = (catMap[catName] || 0) + parseFloat(e.amount || 0)
  })
  const barData = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([k, v]) => ({ category: k, amount: v }))

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle={selectedAccountId === 'all' ? `Cumulative Activity` : `Account Activity`}
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              className="input sm:w-48 py-2 border-slate-200"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="all">All Accounts (Cumulative)</option>
              {accounts.map(a => (
                <option key={a.account_id} value={a.account_id.toString()}>
                  {a.account_name}
                </option>
              ))}
            </select>
            <button onClick={() => { setEditTarget(null); setModal(true) }} className="btn-primary py-2 justify-center">
              <Plus size={15} /> Add Account
            </button>
          </div>
        }
      />

      {loading ? <LoadingOverlay /> : (
        <>
          {(!accounts || accounts.length === 0) ? (
            <EmptyState icon={Wallet} title="No accounts yet"
              desc="Add your first account to start tracking your finances."
              action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={15} />Add Account</button>} />
          ) : (
            <div className="space-y-6">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard 
                  index={0} 
                  title={selectedAccountId === 'all' ? "Total Balance" : "Account Balance"}
                  value={formatCurrency(totalBalance)}
                  sub={selectedAccountId === 'all' ? `${accounts.length} accounts` : ''}
                  icon={Wallet} 
                  iconBg="bg-blue-50" 
                  iconColor="text-blue-600" 
                />
                <StatCard 
                  index={1}
                  title="Monthly Income" 
                  value={formatCurrency(totalIncome)}
                  icon={TrendingUp}
                  iconBg="bg-emerald-50" 
                  iconColor="text-emerald-600"
                  trend={<TrendBadge value={incomeTrend} />} 
                  sparkline={<MiniSparkline data={lineData.map(d => ({ value: d.income }))} color="#10b981" />}
                />
                <StatCard 
                  index={2}
                  title="Monthly Expenses" 
                  value={formatCurrency(totalSpent)}
                  icon={TrendingDown}
                  iconBg="bg-red-50" 
                  iconColor="text-red-500"
                  trend={<TrendBadge value={expenseTrend} />}
                  sparkline={<MiniSparkline data={lineData.map(d => ({ value: d.expenses }))} color="#ef4444" />}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Cash Flow</p>
                      <p className="text-xs text-slate-400">Last 6 months</p>
                    </div>
                  </div>
                  <ExpenseLineChart data={lineData} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Spending by Category</p>
                      <p className="text-xs text-slate-400">All time</p>
                    </div>
                  </div>
                  {barData.length > 0
                    ? <CategoryBarChart data={barData} />
                    : <p className="text-sm text-slate-400 text-center py-12">No expense data</p>}
                </motion.div>
              </div>

              {/* Accounts cards grid */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">Linked Accounts</h3>
                </div>
                {filteredAccounts.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No account data found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {filteredAccounts.map((acc, i) => {
                      const typeKey = acc.account_type?.toLowerCase() || 'bank'
                      const colors = TYPE_COLOR[typeKey] || TYPE_COLOR.bank
                      const Icon = TYPE_ICON[typeKey] || Wallet
                      return (
                        <motion.div key={acc.account_id}
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
              </div>

            </div>
          )}
        </>
      )}

      <AccountModal open={modal} onClose={() => { setModal(false); setEditTarget(null) }}
        onSaved={fetchData} account={editTarget} />

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
