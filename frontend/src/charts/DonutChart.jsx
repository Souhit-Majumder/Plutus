import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { COLORS } from '../utils/cn'

export default function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
            paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">₹{(total/1000).toFixed(1)}k</p>
          <p className="text-[10px] text-slate-400">Total</p>
        </div>
      </div>
    </div>
  )
}
