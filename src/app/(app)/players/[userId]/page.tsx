import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Target, Zap, Medal } from 'lucide-react'
import { getFlag, PHASE_LABELS } from '@/lib/scoring'
import type { Match, Prediction, Profile } from '@/lib/types'

const PHASE_ORDER = ['groups', 'round_of_16', 'quarterfinals', 'semifinals', 'final']

function computeLeaderboard(profiles: Profile[], predictions: any[], specials: any[]) {
  return (profiles || []).map(p => {
    const matchPoints = (predictions || []).filter((x: any) => x.user_id === p.id).reduce((s: number, x: any) => s + (x.points_earned || 0), 0)
    const sp = (specials || []).find((s: any) => s.user_id === p.id)
    const specialPoints = sp ? (sp.champion_points + sp.runner_up_points + sp.top_scorer_points + (sp.golden_ball_points || 0) + (sp.golden_glove_points || 0) + sp.revelation_player_points) : 0
    const bonus = p.bonus_points || 0
    return { ...p, match_points: matchPoints, special_points: specialPoints, total_points: matchPoints + specialPoints + bonus }
  }).sort((a, b) => b.total_points - a.total_points)
}

export default async function PlayerPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: theirPreds },
    { data: myPreds },
    { data: allMatches },
    { data: theirSpecial },
    { data: specialRes },
    { data: allProfiles },
    { data: allPredictions },
    { data: allSpecials },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('predictions').select('*').eq('user_id', userId),
    supabase.from('predictions').select('*').eq('user_id', user!.id),
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('special_predictions').select('*').eq('user_id', userId).single(),
    supabase.from('special_results').select('*').eq('id', 1).single(),
    supabase.from('profiles').select('*'),
    supabase.from('predictions').select('*'),
    supabase.from('special_predictions').select('*'),
  ])

  if (!profile) notFound()

  const leaderboard = computeLeaderboard(allProfiles || [], allPredictions || [], allSpecials || [])
  const theirRank = leaderboard.findIndex(u => u.id === userId) + 1
  const theirScore = leaderboard.find(u => u.id === userId)
  const myScore = leaderboard.find(u => u.id === user?.id)
  const totalPlayers = leaderboard.length

  const finishedMatches = (allMatches || []).filter((m: Match) => m.status === 'finished')

  // Head-to-head stats
  let bothRight = 0, onlyMeRight = 0, onlyThemRight = 0, bothWrong = 0
  for (const m of finishedMatches) {
    const mine = (myPreds || []).find((p: Prediction) => p.match_id === m.id)
    const theirs = (theirPreds || []).find((p: Prediction) => p.match_id === m.id)
    const iGot = (mine?.points_earned ?? 0) > 0
    const theyGot = (theirs?.points_earned ?? 0) > 0
    if (iGot && theyGot) bothRight++
    else if (iGot && !theyGot) onlyMeRight++
    else if (!iGot && theyGot) onlyThemRight++
    else if (mine && theirs && mine.predicted_home !== -1 && theirs.predicted_home !== -1) bothWrong++
  }

  // Group matches by phase
  const matchesByPhase = PHASE_ORDER.map(phase => ({
    phase,
    matches: (allMatches || []).filter((m: Match) => m.phase === phase),
  })).filter(g => g.matches.length > 0)

  const isMe = userId === user?.id

  return (
    <div className="space-y-5 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-8 h-8 rounded-full border border-[#E8E3DC] flex items-center justify-center hover:bg-[#FAFAF9] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#6B6460]" strokeWidth={1.75} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[#1A1614] tracking-tight">{profile.name}</h1>
          <p className="text-xs text-[#9D9491]">Pronósticos {isMe ? '(tú)' : ''}</p>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Posición', value: theirRank ? `#${theirRank}` : '—', sub: `de ${totalPlayers}`, icon: Medal },
          { label: 'Puntos', value: theirScore?.total_points ?? 0, sub: 'acumulados', icon: Trophy },
          { label: 'Efectividad', value: finishedMatches.length > 0 ? `${Math.round(((bothRight + onlyThemRight) / finishedMatches.length) * 100)}%` : '—', sub: 'en partidos', icon: Target },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="card-p p-4 text-center">
            <div className="flex justify-center mb-2">
              <Icon className="w-4 h-4 text-[#8B1538]" strokeWidth={1.75} />
            </div>
            <div className="text-2xl font-semibold text-[#1A1614] tracking-tight">{value}</div>
            <div className="text-xs text-[#9D9491] mt-0.5">{label}</div>
            <div className="text-[10px] text-[#C0B8B4]">{sub}</div>
          </div>
        ))}
      </div>

      {/* Head-to-head (only show vs other players) */}
      {!isMe && finishedMatches.length > 0 && (
        <div className="card-p overflow-hidden">
          <div className="card-section flex items-center gap-2.5">
            <div className="accent-bar" />
            <h2 className="font-semibold text-[#1A1614] text-sm">Head to Head vs {profile.name}</h2>
          </div>
          <div className="grid grid-cols-4 gap-px bg-[#E8E3DC]">
            {[
              { label: 'Ambos acertaron', value: bothRight, color: '#2d6a3f' },
              { label: 'Solo yo', value: onlyMeRight, color: '#8B1538' },
              { label: `Solo ${profile.name.split(' ')[0]}`, value: onlyThemRight, color: '#C4982A' },
              { label: 'Ninguno', value: bothWrong, color: '#9D9491' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white px-3 py-3 text-center">
                <div className="text-xl font-semibold" style={{ color }}>{value}</div>
                <div className="text-[10px] text-[#9D9491] mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions by phase */}
      {matchesByPhase.map(({ phase, matches }) => (
        <div key={phase} className="card-p overflow-hidden">
          <div className="card-section flex items-center gap-2.5">
            <div className="accent-bar" />
            <h2 className="font-semibold text-[#1A1614] text-sm">{PHASE_LABELS[phase]}</h2>
          </div>
          <div>
            {matches.map((m: Match) => {
              const theirPred = (theirPreds || []).find((p: Prediction) => p.match_id === m.id)
              const myPred = !isMe ? (myPreds || []).find((p: Prediction) => p.match_id === m.id) : null
              const isPending = m.status === 'pending'
              const isFinished = m.status === 'finished'

              return (
                <div key={m.id} className="px-4 py-3 border-b border-[#F5F4F2] last:border-0">
                  {/* Match row */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-right font-medium text-[#1A1614] truncate">
                      {getFlag(m.home_team)} {m.home_team}
                    </span>
                    {isFinished ? (
                      <span className="font-semibold text-[#8B1538] px-1 shrink-0">{m.home_score}–{m.away_score}</span>
                    ) : (
                      <span className="text-xs text-[#9D9491] px-1 shrink-0">
                        {m.match_date ? new Date(m.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'vs'}
                      </span>
                    )}
                    <span className="flex-1 font-medium text-[#1A1614] truncate">
                      {getFlag(m.away_team)} {m.away_team}
                    </span>
                  </div>

                  {/* Predictions row */}
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    {/* Their prediction */}
                    <div className="flex-1 flex justify-end">
                      {!theirPred ? (
                        <span className="text-[#C0B8B4]">sin pronóstico</span>
                      ) : theirPred.predicted_home === -1 ? (
                        <span className="text-red-400">−1 pen.</span>
                      ) : isPending ? (
                        <span className="text-[#9D9491]">{theirPred.predicted_home}–{theirPred.predicted_away}</span>
                      ) : (
                        <span className={`font-semibold ${theirPred.points_earned > 0 ? 'text-green-600' : 'text-[#9D9491]'}`}>
                          {theirPred.predicted_home}–{theirPred.predicted_away}
                          {isFinished && (
                            <span className="ml-1 font-normal">
                              ({theirPred.points_earned > 0 ? `+${theirPred.points_earned}` : '0'})
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {!isMe && (
                      <>
                        <span className="text-[#E8E3DC] shrink-0">|</span>
                        {/* My prediction */}
                        <div className="flex-1">
                          {!myPred ? (
                            <span className="text-[#C0B8B4]">sin pronóstico</span>
                          ) : myPred.predicted_home === -1 ? (
                            <span className="text-red-400">−1 pen.</span>
                          ) : isPending ? (
                            <span className="text-[#9D9491]">{myPred.predicted_home}–{myPred.predicted_away}</span>
                          ) : (
                            <span className={`font-semibold ${myPred.points_earned > 0 ? 'text-green-600' : 'text-[#9D9491]'}`}>
                              {myPred.predicted_home}–{myPred.predicted_away}
                              {isFinished && (
                                <span className="ml-1 font-normal">
                                  ({myPred.points_earned > 0 ? `+${myPred.points_earned}` : '0'})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Column labels on first match with comparison */}
                  {!isMe && (
                    <div className="flex items-center gap-2 text-[9px] text-[#C0B8B4] mt-0.5">
                      <div className="flex-1 text-right">{profile.name.split(' ')[0]}</div>
                      <span className="shrink-0 opacity-0">|</span>
                      <div className="flex-1">Tú</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Special predictions */}
      {theirSpecial && (
        <div className="card-p overflow-hidden">
          <div className="card-section flex items-center gap-2.5">
            <div className="accent-bar" />
            <h2 className="font-semibold text-[#1A1614] text-sm">Pronósticos Especiales</h2>
          </div>
          <div className="px-5 py-4">
            <div className="space-y-3">
              {[
                { label: 'Campeón', pred: theirSpecial.champion, real: specialRes?.champion, pts: theirSpecial.champion_points },
                { label: 'Subcampeón', pred: theirSpecial.runner_up, real: specialRes?.runner_up, pts: theirSpecial.runner_up_points },
                { label: 'adidas Golden Boot', pred: theirSpecial.top_scorer, real: specialRes?.top_scorer, pts: theirSpecial.top_scorer_points },
                { label: 'adidas Golden Ball', pred: (theirSpecial as any).golden_ball, real: (specialRes as any)?.golden_ball, pts: (theirSpecial as any).golden_ball_points },
                { label: 'adidas Golden Glove', pred: (theirSpecial as any).golden_glove, real: (specialRes as any)?.golden_glove, pts: (theirSpecial as any).golden_glove_points },
                { label: 'FIFA Best Young Player', pred: theirSpecial.revelation_player, real: specialRes?.revelation_player, pts: theirSpecial.revelation_player_points },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#F5F4F2] last:border-0">
                  <div>
                    <div className="text-xs text-[#9D9491] uppercase tracking-wider">{item.label}</div>
                    <div className="font-medium text-sm text-[#1A1614] mt-0.5">
                      {item.pred ? `${getFlag(item.pred)} ${item.pred}` : <span className="text-[#C0B8B4]">Sin pronóstico</span>}
                    </div>
                    {item.real && <div className="text-xs text-[#9D9491]">Resultado: {item.real}</div>}
                  </div>
                  {item.pts !== undefined && specialRes?.champion && (
                    <span className={`text-sm font-semibold ${item.pts > 0 ? 'text-green-600' : 'text-[#9D9491]'}`}>
                      {item.pts > 0 ? `+${item.pts}` : '0'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
