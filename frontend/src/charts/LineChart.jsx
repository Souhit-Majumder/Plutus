import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 shadow-card-hover rounded-lg px-3 py-2 text-sm">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-semibold">₹{Number(p.value).toLocaleString('en-IN')}</span>
        </p>
      ))}
    </div>
  )
}

export default function ExpenseLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
          tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="expenses" stroke="#3b82f6" strokeWidth={2}
          dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} name="Expenses" />
        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2}
          dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} name="Income" />
      </LineChart>
    </ResponsiveContainer>
  )
}
