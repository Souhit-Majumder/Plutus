import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../utils/cn'

export default function StatCard({ title, value, sub, icon: Icon, iconBg = 'bg-brand-50', iconColor = 'text-brand-600', trend, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="card p-5 flex items-start gap-4"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">{title}</p>
        <p className="text-xl font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(trend)}%
        </div>
      )}
    </motion.div>
  )
}
