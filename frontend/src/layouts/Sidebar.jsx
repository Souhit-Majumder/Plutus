import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, CreditCard, Wallet, Handshake,
  Settings, LogOut, TrendingUp, DollarSign
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { cn, getInitials } from '../utils/cn'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses',  icon: CreditCard,      label: 'Expenses'  },
  { to: '/accounts',  icon: Wallet,          label: 'Accounts'  },
  { to: '/loans',     icon: Handshake,       label: 'Loans'     },
  { to: '/manage',    icon: Settings,        label: 'Manage'    },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <DollarSign size={16} className="text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-[15px] tracking-tight">Plutus</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Menu</p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                {label}
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold flex-shrink-0">
            {getInitials(user?.name || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  )
}
