import { createClient } from '@/lib/supabase/server'
import EvolutionChart from '@/components/evolution-chart'

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

  const startPoint = { label: 'Inicio', ...Object.fromEntries(users.map(u => [u.name, 0])) }
  const fullData = [startPoint, ...chartData]

  const ranking = users.map(u => ({ ...u, pts: cumulative[u.id] || 0 })).sort((a, b) => b.pts - a.pts)

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#1A1614] tracking-tight">Evolución de Puntos</h1>
        <span className="text-sm text-[#9D9491]">{matches.length} partidos jugados</span>
      </div>

      <EvolutionChart data={fullData} users={users.map(u => u.name)} />

      <div className="card-p overflow-hidden">
        <div className="card-section flex items-center gap-2.5">
          <div className="accent-bar" />
          <h2 className="font-semibold text-[#1A1614] text-sm">Posición actual</h2>
        </div>
        <div>
          {ranking.map((u, i) => (
            <div key={u.id} className={`flex items-center justify-between px-5 py-3 border-b border-[#F5F4F2] last:border-0 ${u.id === user?.id ? 'bg-[#F5EEF1]' : 'hover:bg-[#FAFAF9]'} transition-colors`}>
              <div className="flex items-center gap-3">
                <span className={`w-5 text-sm font-semibold ${i === 0 ? 'text-[#C4982A]' : 'text-[#C0B8B4]'}`}>{i + 1}</span>
                <span className="text-sm font-medium text-[#1A1614]">
                  {u.name}
                  {u.id === user?.id && <span className="ml-2 text-xs text-[#8B1538]">tú</span>}
                </span>
              </div>
              <span className="font-semibold text-sm text-[#1A1614]">{u.pts}<span className="text-xs font-normal text-[#9D9491] ml-1">pts</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
