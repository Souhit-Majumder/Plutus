import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingDown, TrendingUp, Target, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay, Badge } from '../components/ui'
import ExpenseLineChart from '../charts/LineChart'
import CategoryBarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'
import MiniSparkline from '../charts/MiniSparkline'
import { accountService, expenseService, incomeService, savingsGoalService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/cn'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])
  const [goals, setGoals] = useState([])
  const [monthlySummary, setMonthlySummary] = useState({ total_income: 0, total_expense: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date()
        const [a, e, inc, g, summary] = await Promise.all([
          accountService.list(),
          expenseService.list(),
          incomeService.list(),
          savingsGoalService.list(),
          accountService.monthlySummary(now.getMonth() + 1, now.getFullYear()),
        ])
        setAccounts(a.data)
        setExpenses(e.data)
        setIncomes(inc.data)
        setGoals(g.data)
        setMonthlySummary(summary.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingOverlay />


  // ── Trend Badge Component ──────────────────────────────────────────────
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

  // ── Derived stats ──────────────────────────────────────────────────────
  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0)

  // Current month totals from stored procedure
  const totalSpent  = parseFloat(monthlySummary.total_expense || 0)
  const totalIncome = parseFloat(monthlySummary.total_income || 0)

  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
  
  // Last month (client-side for trend comparison)
  const lastMonthDate = subMonths(new Date(), 1)
  const lastMonthKey = format(lastMonthDate, 'yyyy-MM')
  const isLastMonth = d => d && format(new Date(d), 'yyyy-MM') === lastMonthKey
  
  const lastMonthExpenses = expenses.filter(e => isLastMonth(e.date))
  const lastMonthIncomes = incomes.filter(i => isLastMonth(i.date))
  const lastTotalSpent = lastMonthExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const lastTotalIncome = lastMonthIncomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0)

  // Helper to calculate percentage change
  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const incomeTrend = getTrend(totalIncome, lastTotalIncome)
  const expenseTrend = getTrend(totalSpent, lastTotalSpent)

  // ── Line chart data: last 6 months ─────────────────────────────────────
  const lineData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const key = format(d, 'yyyy-MM')
    const matchMonth = date => date && format(new Date(date), 'yyyy-MM') === key
    
    const exp = expenses.filter(e => matchMonth(e.date)).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const inc = incomes.filter(e => matchMonth(e.date)).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    return { month: format(d, 'MMM'), expenses: exp, income: inc }
  })

  // ── Bar chart data: by category ────────────────────────────────────────
  const catMap = {}
  expenses.forEach(e => {
    const catName = e.category_name || 'Other'
    catMap[catName] = (catMap[catName] || 0) + parseFloat(e.amount || 0)
  })
  const barData = Object.entries(catMap).sort(([, a], [, b]) => b - a).slice(0, 6).map(([k, v]) => ({ category: k, amount: v }))

  // ── Donut: account distribution ────────────────────────────────────────
  const donutData = accounts.map(a => ({ name: a.account_name, value: parseFloat(a.balance || 0) })).filter(d => d.value > 0)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${format(new Date(), 'MMMM yyyy')} overview`}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Total Balance */}
        <StatCard 
          index={0} 
          title="Total Balance" 
          value={formatCurrency(totalBalance)}
          sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
          icon={Wallet} 
          iconBg="bg-blue-50" 
          iconColor="text-blue-600" 
        />

        {/* Monthly Income */}
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

        {/* Monthly Expenses */}
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

        {/* Savings Goals */}
        <StatCard 
          index={3} 
          title="Savings Goals" 
          value={goals.length}
          sub={`${goals.filter(g => parseFloat(g.remaining_amount) <= 0).length} completed`}
          icon={Target} 
          iconBg="bg-violet-50" 
          iconColor="text-violet-600" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Line chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Cash Flow</p>
              <p className="text-xs text-slate-400">Last 6 months</p>
            </div>
          </div>
          <ExpenseLineChart data={lineData} />
        </motion.div>

        {/* Donut chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card p-5">
          <p className="text-sm font-semibold text-slate-800 mb-1">Accounts</p>
          <p className="text-xs text-slate-400 mb-3">Balance distribution</p>
          {donutData.length > 0
            ? <DonutChart data={donutData} />
            : <p className="text-sm text-slate-400 text-center py-12">No accounts yet</p>}
        </motion.div>
      </div>

      {/* Category Bar + Savings Goals */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-5 xl:col-span-2">
          <p className="text-sm font-semibold text-slate-800 mb-1">Spending by Category</p>
          <p className="text-xs text-slate-400 mb-4">All time</p>
          {barData.length > 0
            ? <CategoryBarChart data={barData} />
            : <p className="text-sm text-slate-400 text-center py-12">No expense data</p>}
        </motion.div>

        {/* Savings goals */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-800">Savings Goals</p>
          </div>
          <div className="space-y-4">
            {goals.slice(0, 4).map(g => {
              const pct = Math.min(100, Math.round((parseFloat(g.saved_amount) / parseFloat(g.target_amount)) * 100))
              return (
                <div key={g.goal_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-slate-700 truncate pr-2">{g.goal_name}</p>
                    <span className="text-[11px] text-slate-500 shrink-0">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-brand-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatCurrency(g.saved_amount)} of {formatCurrency(g.target_amount)}
                  </p>
                </div>
              )
            })}
            {goals.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No goals yet</p>}
          </div>
        </motion.div>
      </div>

      {/* Recent Expenses Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Recent Expenses</p>
          <Link to="/expenses" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-50">
              <tr>
                {['Description', 'Date', 'Tags', 'Amount'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentExpenses.length === 0 ? (
                <tr><td colSpan={4} className="table-td text-center text-slate-400 py-8">No expenses yet</td></tr>
              ) : recentExpenses.map(e => (
                <tr key={e.expense_id} className="table-tr">
                  <td className="table-td font-medium text-slate-800">{e.description || '—'}</td>
                  <td className="table-td text-slate-500">{formatDate(e.date)}</td>
                  <td className="table-td">
                    <div className="flex flex-wrap gap-1">
                      {(e.tags || []).slice(0, 2).map((t, i) => <Badge key={t.tag_id} label={t.tag_name} idx={i} />)}
                    </div>
                  </td>
                  <td className="table-td font-semibold text-red-500">
                    -{formatCurrency(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
