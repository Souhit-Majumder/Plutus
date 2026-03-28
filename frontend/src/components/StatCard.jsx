import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

export default function StatCard({ 
  title, 
  value, 
  sub, 
  icon: Icon, 
  iconBg = 'bg-brand-50', 
  iconColor = 'text-brand-600', 
  trend,      // This is now the TrendBadge component you pass from Dashboard
  sparkline,  // This is the MiniSparkline component
  index = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="card p-5 flex flex-col justify-between relative overflow-hidden min-h-[140px]"
    >
      {/* Top Row: Icon and Trend Badge */}
      <div className="flex justify-between items-start relative z-10">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
        
        {/* Render the TrendBadge component here */}
        {trend && <div>{trend}</div>}
      </div>

      {/* Middle: Value and Title */}
      <div className="mt-4 relative z-10">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-0.5 tabular-nums">{value}</h3>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>

      {/* Background Sparkline Overlay */}
      {sparkline && (
        <div className="absolute bottom-0 left-0 right-0 h-14 opacity-40 pointer-events-none">
          {sparkline}
        </div>
      )}
    </motion.div>
  )
}