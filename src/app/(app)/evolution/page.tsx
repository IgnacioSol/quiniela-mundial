import { createClient } from '@/lib/supabase/server'
import EvolutionChart from '@/components/evolution-chart'
import { getFlag } from '@/lib/scoring'

export default async function EvolutionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profiles }, { data: finishedMatches }, { data: allPredictions }] = await Promise.all([
    supabase.from('profiles').select('id, name').order('name'),
    supabase.from('matches').select('*').eq('status', 'finished').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*'),
  ])

  const users = profiles || []
  const matches = finishedMatches || []
  const preds = allPredictions || []

  // Build cumulative evolution data
  const cumulative: Record<string, number> = {}
  users.forEach(u => { cumulative[u.id] = 0 })

  const chartData = matches.map(match => {
    users.forEach(u => {
      const pred = preds.find((p: any) => p.match_id === match.id && p.user_id === u.id)
      cumulative[u.id] += pred ? (pred.points_earned || 0) : 0
    })
    return {
      label: match.match_date
        ? new Date(match.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
        : `P${match.id}`,
      ...Object.fromEntries(users.map(u => [u.name, cumulative[u.id]])),
    }
  })

  // Add starting point at 0
  const startPoint = { label: 'Inicio', ...Object.fromEntries(users.map(u => [u.name, 0])) }
  const fullData = [startPoint, ...chartData]

  // Current ranking for reference
  const ranking = users.map(u => ({
    ...u,
    pts: cumulative[u.id] || 0,
  })).sort((a, b) => b.pts - a.pts)

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#8B1538]">📈 Evolución de Puntos</h1>

      <EvolutionChart data={fullData} users={users.map(u => u.name)} />

      {/* Mini ranking actual */}
      <div className="card-mundial overflow-hidden">
        <div className="bg-[#8B1538] px-5 py-3">
          <h2 className="text-white font-bold">Posición actual tras {matches.length} partidos</h2>
        </div>
        <div className="divide-y divide-[#e8d5c0]">
          {ranking.map((u, i) => (
            <div key={u.id} className={`flex items-center justify-between px-5 py-3 ${u.id === user?.id ? 'bg-[#f3e8d0]' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg w-7 text-center">{MEDALS[i] || `${i + 1}.`}</span>
                <span className="font-semibold text-sm">{u.name} {u.id === user?.id && <span className="text-xs text-[#8B1538]">(tú)</span>}</span>
              </div>
              <span className="font-bold text-xl text-[#8B1538]">{u.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
