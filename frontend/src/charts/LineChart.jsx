import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
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
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        {/* Defining gradients for the filled areas */}
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 11, fill: '#94a3b8' }} 
          axisLine={false} 
          tickLine={false} 
          dy={10}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: '#94a3b8' }} 
          axisLine={false} 
          tickLine={false}
          tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top" 
          align="right" 
          iconType="circle" 
          iconSize={7} 
          wrapperStyle={{ fontSize: 12, paddingBottom: 20 }} 
        />

        {/* Income Area */}
        <Area
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorIncome)"
          name="Income"
          dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 5 }}
        />

        {/* Expenses Area */}
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorExpenses)"
          name="Expenses"
          dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}