import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { PHASE_LABELS, getFlag } from '@/lib/scoring'
import type { Profile, Match } from '@/lib/types'

function calcPersonalStats(myPreds: any[], finishedMatches: any[]) {
  const finished = finishedMatches.filter(m => m.status === 'finished')
  const myFinished = myPreds.filter(p => finished.some((m: any) => m.id === p.match_id) && p.predicted_home !== -1)
  const missed = myPreds.filter(p => p.predicted_home === -1 && finished.some((m: any) => m.id === p.match_id)).length
  const exact = myFinished.filter(p => p.points_earned >= 2).length
  const correctWinner = myFinished.filter(p => p.points_earned === 1).length
  const total = myFinished.length
  const accuracy = total > 0 ? Math.round(((exact + correctWinner) / total) * 100) : 0

  // Calculate current streak (consecutive positive points, most recent first)
  const sortedByDate = [...myFinished].sort((a, b) => {
    const ma = finished.find((m: any) => m.id === a.match_id)
    const mb = finished.find((m: any) => m.id === b.match_id)
    return new Date(mb?.match_date || 0).getTime() - new Date(ma?.match_date || 0).getTime()
  })
  let streak = 0
  for (const p of sortedByDate) {
    if (p.points_earned > 0) streak++
    else break
  }

  return { total, exact, correctWinner, missed, accuracy, streak }
}

type UserScore = Profile & { total_points: number; match_points: number; special_points: number }

async function getLeaderboard(supabase: Awaited<ReturnType<typeof createClient>>): Promise<UserScore[]> {
  const [{ data: profiles }, { data: predictions }, { data: specials }] = await Promise.all([
    supabase.from('profiles').select('*').order('name'),
    supabase.from('predictions').select('*'),
    supabase.from('special_predictions').select('*'),
  ])

  return (profiles || []).map(profile => {
    const matchPoints = (predictions || [])
      .filter((p: any) => p.user_id === profile.id)
      .reduce((sum: number, p: any) => sum + (p.points_earned || 0), 0)
    const sp = (specials || []).find((s: any) => s.user_id === profile.id)
    const specialPoints = sp
      ? (sp.champion_points + sp.runner_up_points + sp.top_scorer_points +
         sp.revelation_player_points + sp.revelation_team_points)
      : 0
    return { ...profile, match_points: matchPoints, special_points: specialPoints, total_points: matchPoints + specialPoints }
  }).sort((a, b) => b.total_points - a.total_points)
}

const MEDAL = ['🥇', '🥈', '🥉']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [leaderboard, { data: upcomingMatches }, { data: config }, { data: myPreds }, { data: allMatches }] = await Promise.all([
    getLeaderboard(supabase),
    supabase.from('matches').select('*').eq('status', 'pending').order('match_date', { ascending: true }).limit(6),
    supabase.from('scoring_config').select('*').single(),
    supabase.from('predictions').select('*').eq('user_id', user!.id),
    supabase.from('matches').select('id, status, match_date, phase').eq('status', 'finished'),
  ])

  const stats = calcPersonalStats(myPreds || [], allMatches || [])

  const currentUserRank = leaderboard.findIndex(u => u.id === user?.id) + 1
  const currentUser = leaderboard.find(u => u.id === user?.id)

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="mundial-gradient rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚽</span>
          <div>
            <h1 className="text-xl font-bold">Quiniela Mundial 2026</h1>
            <p className="text-white/70 text-sm">🇺🇸 🇲🇽 🇨🇦 · Junio–Julio 2026</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-3xl font-bold text-yellow-300">#{currentUserRank || '-'}</div>
            <div className="text-xs text-white/70 mt-1">Tu posición</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-3xl font-bold text-yellow-300">{currentUser?.total_points ?? 0}</div>
            <div className="text-xs text-white/70 mt-1">Tus puntos</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-3xl font-bold text-yellow-300">{leaderboard.length}</div>
            <div className="text-xs text-white/70 mt-1">Participantes</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-3">
          <div className="card-mundial p-0 overflow-hidden">
            <div className="bg-[#8B1538] px-5 py-3">
              <h2 className="text-white font-bold text-base">🏆 Tabla de Posiciones</h2>
            </div>
            <div className="divide-y divide-[#e8d5c0]">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aún no hay participantes</p>
              ) : leaderboard.map((u, i) => (
                <div key={u.id} className={`flex items-center justify-between px-5 py-3 ${u.id === user?.id ? 'bg-[#f3e8d0]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center">
                      {MEDAL[i] || <span className="text-sm font-mono text-muted-foreground">{i + 1}</span>}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{u.name} {u.id === user?.id && <span className="text-xs text-[#8B1538]">(tú)</span>}</div>
                      <div className="flex gap-1 mt-0.5">
                        <span className="text-xs text-muted-foreground">⚽ {u.match_points}pts</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">★ {u.special_points}pts</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-[#8B1538]">{u.total_points}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Próximos partidos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-mundial p-0 overflow-hidden">
            <div className="bg-[#8B1538] px-5 py-3">
              <h2 className="text-white font-bold text-base">📅 Próximos Partidos</h2>
            </div>
            <div className="divide-y divide-[#e8d5c0]">
              {!upcomingMatches?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay partidos cargados</p>
              ) : upcomingMatches.map((match: Match) => (
                <div key={match.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-1 text-sm font-semibold">
                    <span className="flex-1 text-right">{getFlag(match.home_team)} {match.home_team}</span>
                    <span className="text-xs text-muted-foreground px-1">vs</span>
                    <span className="flex-1">{getFlag(match.away_team)} {match.away_team}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-xs bg-[#f3e8d0] text-[#8B1538]">
                      {match.group_name ? `Grupo ${match.group_name}` : PHASE_LABELS[match.phase]}
                    </Badge>
                    {match.match_date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(match.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mis estadísticas */}
          {(allMatches || []).length > 0 && (
            <div className="card-mundial p-0 overflow-hidden">
              <div className="bg-[#8B1538] px-5 py-3">
                <h2 className="text-white font-bold text-base">📊 Mis Estadísticas</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-[#f8f4f0] rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#8B1538]">{stats.accuracy}%</div>
                  <div className="text-xs text-muted-foreground">Efectividad</div>
                </div>
                <div className="bg-[#f8f4f0] rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.streak}</div>
                  <div className="text-xs text-muted-foreground">Racha actual 🔥</div>
                </div>
                <div className="bg-[#f8f4f0] rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#C9A84C]">{stats.exact}</div>
                  <div className="text-xs text-muted-foreground">Exactos 🎯</div>
                </div>
                <div className="bg-[#f8f4f0] rounded-xl p-3 text-center">
                  <div className={`text-2xl font-bold ${stats.missed > 0 ? 'text-red-500' : 'text-gray-400'}`}>{stats.missed}</div>
                  <div className="text-xs text-muted-foreground">Sin pronosticar ⚠️</div>
                </div>
              </div>
            </div>
          )}

          {config && (
            <div className="card-mundial p-0 overflow-hidden">
              <div className="bg-[#C9A84C] px-5 py-3">
                <h2 className="text-[#1a0510] font-bold text-base">⭐ Puntuación</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4">
                {[
                  { label: 'Marcador exacto', value: config.exact_score_points, icon: '🎯' },
                  { label: 'Ganador/Empate', value: config.correct_winner_points, icon: '✓' },
                  { label: 'Campeón', value: config.champion_points, icon: '🏆' },
                  { label: 'Subcampeón', value: config.runner_up_points, icon: '🥈' },
                  { label: 'Goleador', value: config.top_scorer_points, icon: '⚽' },
                  { label: 'Revelaciones', value: config.revelation_player_points, icon: '⭐' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 bg-[#f8f4f0] rounded-lg p-2">
                    <span>{item.icon}</span>
                    <div>
                      <div className="font-bold text-[#8B1538] text-sm">{item.value}pts</div>
                      <div className="text-xs text-muted-foreground leading-tight">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
