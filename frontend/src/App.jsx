import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ExpensesPage from './pages/ExpensesPage'
import AccountsPage from './pages/AccountsPage'
import IncomePage         from './pages/IncomePage'
import AddSavingsGoalPage from './pages/AddSavingsGoalPage'
import SubscriptionsPage  from './pages/SubscriptionsPage'
import BudgetsPage        from './pages/BudgetsPage'
import RemindersPage      from './pages/RemindersPage'
import LoansPage from './pages/LoansPage'
import ManageDataPage from './pages/ManageDataPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — AppLayout checks auth and redirects to /login if not authenticated */}
        <Route element={<AppLayout />}>
          <Route path="/"        element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/loans"    element={<LoansPage />} />
          <Route path="/income"      element={<IncomePage />} />
          <Route path="/goals/new"   element={<AddSavingsGoalPage />} />
          <Route path="/manage"   element={<ManageDataPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/budgets"       element={<BudgetsPage />} />
          <Route path="/reminders"     element={<RemindersPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
