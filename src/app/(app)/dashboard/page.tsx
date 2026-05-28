import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy, Target, Flame, AlertCircle, Zap, Calendar, Medal, ChevronRight } from 'lucide-react'
import { PHASE_LABELS, getFlag } from '@/lib/scoring'
import type { Profile, Match } from '@/lib/types'

type UserScore = Profile & { total_points: number; match_points: number; special_points: number }

function calcPersonalStats(myPreds: any[], finishedMatches: any[]) {
  const finished = finishedMatches.filter(m => m.status === 'finished')
  const myFinished = myPreds.filter(p => finished.some((m: any) => m.id === p.match_id) && p.predicted_home !== -1)
  const missed = myPreds.filter(p => p.predicted_home === -1 && finished.some((m: any) => m.id === p.match_id)).length
  const exact = myFinished.filter(p => p.points_earned >= 2).length
  const correctWinner = myFinished.filter(p => p.points_earned === 1).length
  const total = myFinished.length
  const accuracy = total > 0 ? Math.round(((exact + correctWinner) / total) * 100) : 0
  const sortedByDate = [...myFinished].sort((a, b) => {
    const ma = finished.find((m: any) => m.id === a.match_id)
    const mb = finished.find((m: any) => m.id === b.match_id)
    return new Date(mb?.match_date || 0).getTime() - new Date(ma?.match_date || 0).getTime()
  })
  let streak = 0
  for (const p of sortedByDate) { if (p.points_earned > 0) streak++; else break }
  return { total, exact, correctWinner, missed, accuracy, streak }
}

async function getLeaderboard(supabase: Awaited<ReturnType<typeof createClient>>): Promise<UserScore[]> {
  const [{ data: profiles }, { data: predictions }, { data: specials }] = await Promise.all([
    supabase.from('profiles').select('*').order('name'),
    supabase.from('predictions').select('*'),
    supabase.from('special_predictions').select('*'),
  ])
  return (profiles || []).map(profile => {
    const matchPoints = (predictions || []).filter((p: any) => p.user_id === profile.id).reduce((s: number, p: any) => s + (p.points_earned || 0), 0)
    const sp = (specials || []).find((s: any) => s.user_id === profile.id)
    const specialPoints = sp ? (sp.champion_points + sp.runner_up_points + sp.top_scorer_points + (sp.golden_ball_points || 0) + (sp.golden_glove_points || 0) + sp.revelation_player_points) : 0
    const bonus = profile.bonus_points || 0
    return { ...profile, match_points: matchPoints, special_points: specialPoints, total_points: matchPoints + specialPoints + bonus }
  }).sort((a, b) => b.total_points - a.total_points)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [leaderboard, { data: upcomingMatches }, { data: config }, { data: myPreds }, { data: allMatches }] = await Promise.all([
    getLeaderboard(supabase),
    supabase.from('matches').select('*').eq('status', 'pending').order('match_date', { ascending: true }).limit(5),
    supabase.from('scoring_config').select('*').single(),
    supabase.from('predictions').select('*').eq('user_id', user!.id),
    supabase.from('matches').select('id, status, match_date, phase').eq('status', 'finished'),
  ])

  const stats = calcPersonalStats(myPreds || [], allMatches || [])
  const myRank = leaderboard.findIndex(u => u.id === user?.id) + 1
  const myScore = leaderboard.find(u => u.id === user?.id)
  const hasStarted = (allMatches || []).length > 0

  return (
    <div className="space-y-6 py-2">

      {/* Hero row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Posición', value: myRank ? `#${myRank}` : '—', sub: 'actual', icon: Medal },
          { label: 'Puntos', value: myScore?.total_points ?? 0, sub: 'acumulados', icon: Trophy },
          { label: 'Participantes', value: leaderboard.length, sub: 'en juego', icon: Zap },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="card-p p-4 text-center">
            <div className="flex justify-center mb-2">
              <Icon className="w-4 h-4 text-[#8B1538]" strokeWidth={1.75} />
            </div>
            <div className="text-2xl font-semibold text-[#1A1614] tracking-tight">{value}</div>
            <div className="text-xs text-[#9D9491] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Leaderboard */}
        <div className="lg:col-span-3 card-p overflow-hidden">
          <div className="card-section flex items-center gap-2.5">
            <div className="accent-bar" />
            <h2 className="font-semibold text-[#1A1614] text-sm">Tabla de Posiciones</h2>
          </div>
          <div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-[#9D9491] text-center py-10">Nadie se ha registrado todavía</p>
            ) : leaderboard.map((u, i) => {
              const isMe = u.id === user?.id
              const inner = (
                <div className={`flex items-center justify-between px-5 py-3 border-b border-[#F5F4F2] last:border-0 transition-colors ${isMe ? 'bg-[#F5EEF1]' : 'hover:bg-[#FAFAF9] cursor-pointer'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center text-sm font-semibold ${i === 0 ? 'text-[#C4982A]' : i === 1 ? 'text-[#9D9491]' : i === 2 ? 'text-[#C4822A]' : 'text-[#C0B8B4]'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-medium text-sm text-[#1A1614]">
                        {u.name}
                        {isMe && <span className="ml-2 text-xs text-[#8B1538] font-normal">tú</span>}
                      </div>
                      <div className="text-xs text-[#9D9491] mt-0.5">
                        {u.match_points} partidos · {u.special_points} especiales
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1A1614]">{u.total_points}<span className="text-xs text-[#9D9491] font-normal ml-1">pts</span></span>
                    {!isMe && <ChevronRight className="w-3.5 h-3.5 text-[#C0B8B4]" strokeWidth={1.75} />}
                  </div>
                </div>
              )
              return isMe
                ? <div key={u.id}>{inner}</div>
                : <Link key={u.id} href={`/players/${u.id}`} className="block">{inner}</Link>
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Personal stats */}
          {hasStarted && (
            <div className="card-p overflow-hidden">
              <div className="card-section flex items-center gap-2.5">
                <div className="accent-bar" />
                <h2 className="font-semibold text-[#1A1614] text-sm">Mis Estadísticas</h2>
              </div>
              <div className="grid grid-cols-2 gap-px bg-[#E8E3DC]">
                {[
                  { label: 'Efectividad', value: `${stats.accuracy}%`, icon: Target, color: '#8B1538' },
                  { label: 'Racha', value: stats.streak, icon: Flame, color: stats.streak > 0 ? '#C4982A' : '#9D9491' },
                  { label: 'Exactos', value: stats.exact, icon: Zap, color: '#2d6a3f' },
                  { label: 'Sin pronóstico', value: stats.missed, icon: AlertCircle, color: stats.missed > 0 ? '#dc2626' : '#9D9491' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white px-4 py-3">
                    <Icon className="w-3.5 h-3.5 mb-1.5" style={{ color }} strokeWidth={1.75} />
                    <div className="text-lg font-semibold text-[#1A1614]">{value}</div>
                    <div className="text-xs text-[#9D9491]">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming matches */}
          <div className="card-p overflow-hidden">
            <div className="card-section flex items-center gap-2.5">
              <div className="accent-bar" />
              <h2 className="font-semibold text-[#1A1614] text-sm">Próximos Partidos</h2>
            </div>
            {!upcomingMatches?.length ? (
              <p className="text-sm text-[#9D9491] text-center py-8">Sin partidos próximos</p>
            ) : (
              <div>
                {upcomingMatches.map((m: Match) => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3 border-b border-[#F5F4F2] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm font-medium text-[#1A1614]">
                        <span>{getFlag(m.home_team)} {m.home_team}</span>
                        <span className="text-xs text-[#9D9491] px-2">vs</span>
                        <span>{getFlag(m.away_team)} {m.away_team}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-[#9D9491]">
                          {m.group_name ? `Grupo ${m.group_name}` : PHASE_LABELS[m.phase]}
                        </span>
                        {m.match_date && (
                          <span className="text-xs text-[#9D9491]">
                            {new Date(m.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scoring */}
          {config && (
            <div className="card-p overflow-hidden">
              <div className="card-section flex items-center gap-2.5">
                <div className="accent-bar" />
                <h2 className="font-semibold text-[#1A1614] text-sm">Puntuación</h2>
              </div>
              <div className="px-5 py-4 space-y-2">
                {[
                  { label: 'Marcador exacto', value: config.exact_score_points },
                  { label: 'Ganador / Empate', value: config.correct_winner_points },
                  { label: 'Sin pronosticar', value: -1, negative: true },
                  { label: 'Campeón', value: config.champion_points },
                  { label: 'Subcampeón', value: config.runner_up_points },
                  { label: 'adidas Golden Boot', value: config.top_scorer_points },
                  { label: 'adidas Golden Ball', value: (config as any).golden_ball_points ?? 10 },
                  { label: 'adidas Golden Glove', value: (config as any).golden_glove_points ?? 5 },
                  { label: 'FIFA Best Young Player', value: config.revelation_player_points },
                ].map(({ label, value, negative }: any) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-[#6B6460]">{label}</span>
                    <span className={`text-sm font-semibold ${negative ? 'text-red-500' : 'text-[#1A1614]'}`}>
                      {negative ? '−1' : `+${value}`}<span className="text-xs font-normal text-[#9D9491] ml-0.5">pt{value !== 1 ? 's' : ''}</span>
                    </span>
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
