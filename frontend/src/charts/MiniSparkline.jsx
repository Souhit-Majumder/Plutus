import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function MiniSparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`colorGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          fillOpacity={1} 
          fill={`url(#colorGradient-${color})`} 
          strokeWidth={3}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}