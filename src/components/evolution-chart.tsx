'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

const COLORS = ['#8B1538','#C9A84C','#2d7a3a','#1a4a9a','#7a2d82','#0891b2','#ea580c','#16a34a','#dc2626','#7c3aed','#db2777','#059669']

type EvolutionPoint = { label: string; [name: string]: number | string }

type Props = {
  data: EvolutionPoint[]
  users: string[]
}

export default function EvolutionChart({ data, users }: Props) {
  if (data.length === 0) {
    return (
      <div className="card-mundial p-12 text-center">
        <div className="text-5xl mb-3">📈</div>
        <p className="text-muted-foreground font-medium">La evolución aparecerá cuando se jueguen los primeros partidos</p>
      </div>
    )
  }

  return (
    <div className="card-mundial p-4">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7a6050' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#7a6050' }} tickLine={false} axisLine={false} />
          <ReferenceLine y={0} stroke="#8B1538" strokeDasharray="4 4" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e8d5c0', borderRadius: 8, fontSize: 12 }}
            formatter={(value: any, name: any) => [`${value} pts`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {users.map((user, i) => (
            <Line
              key={user}
              type="monotone"
              dataKey={user}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
