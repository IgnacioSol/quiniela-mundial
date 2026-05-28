import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getFlag } from '@/lib/scoring'
import Bracket from '@/components/bracket'
import GroupStandings from '@/components/group-standings'
import type { Match, Prediction } from '@/lib/types'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: allMatches }, { data: predictions }, { data: specialPred }, { data: specialRes }, { data: allPredictions }, { data: allProfiles }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user!.id),
    supabase.from('special_predictions').select('*').eq('user_id', user!.id).single(),
    supabase.from('special_results').select('*').eq('id', 1).single(),
    supabase.from('predictions').select('user_id, match_id, points_earned'),
    supabase.from('profiles').select('id, name'),
  ])

  const finishedGroups = (allMatches || []).filter((m: Match) => m.phase === 'groups' && m.status === 'finished')
  const allGroupMatches = (allMatches || []).filter((m: Match) => m.phase === 'groups')
  const knockoutMatches = (allMatches || []).filter((m: Match) => m.phase !== 'groups')
  const myPreds = predictions || []

  return (
    <div className="space-y-5 py-2">
      <h1 className="text-xl font-semibold text-[#1A1614] tracking-tight">Resultados</h1>

      <Tabs defaultValue="standings">
        <TabsList className="bg-transparent border-b border-[#E8E3DC] rounded-none p-0 h-auto w-full flex gap-0 justify-start">
          {[
            { value: 'standings', label: 'Grupos' },
            { value: 'groups', label: 'Mis puntos' },
            { value: 'bracket', label: 'Llaves' },
            { value: 'specials', label: 'Especiales' },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value}
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#6B6460] data-[state=active]:text-[#8B1538] data-[state=active]:border-[#8B1538] data-[state=active]:bg-transparent data-[state=active]:shadow-none -mb-px">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="standings" className="mt-5">
          <GroupStandings matches={allGroupMatches} />
        </TabsContent>

        <TabsContent value="groups" className="mt-5">
          {finishedGroups.length === 0 ? (
            <div className="card-p p-10 text-center text-sm text-[#9D9491]">No hay resultados todavía</div>
          ) : (
            <div className="space-y-4">
              {GROUPS.map(group => {
                const gm = finishedGroups.filter((m: Match) => m.group_name === group)
                if (gm.length === 0) return null
                return (
                  <div key={group} className="card-p overflow-hidden">
                    <div className="card-section flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#8B1538] flex items-center justify-center text-white text-xs font-bold">{group}</div>
                      <span className="text-sm font-semibold text-[#1A1614]">Grupo {group}</span>
                    </div>
                    {gm.map((m: Match) => {
                      const pred = myPreds.find((p: Prediction) => p.match_id === m.id)
                      const hw = m.home_score! > m.away_score!
                      const aw = m.away_score! > m.home_score!
                      const matchPreds = (allPredictions || []).filter((p: any) => p.match_id === m.id && p.points_earned !== null)
                      const acertaron = matchPreds.filter((p: any) => p.points_earned > 0)
                      const total = matchPreds.length
                      return (
                        <div key={m.id} className="px-4 py-3 border-b border-[#F5F4F2] last:border-0">
                          <div className="flex items-center gap-3">
                            <span className={`flex-1 text-right text-sm font-medium ${hw ? 'text-[#1A1614]' : 'text-[#9D9491]'}`}>
                              {getFlag(m.home_team)} {m.home_team}
                            </span>
                            <span className="font-semibold text-sm text-[#8B1538] px-2">{m.home_score}–{m.away_score}</span>
                            <span className={`flex-1 text-sm font-medium ${aw ? 'text-[#1A1614]' : 'text-[#9D9491]'}`}>
                              {getFlag(m.away_team)} {m.away_team}
                            </span>
                            {pred && pred.predicted_home !== -1 && (
                              <div className="text-right w-16">
                                <span className={`text-xs font-semibold ${pred.points_earned > 0 ? 'text-green-600' : 'text-[#9D9491]'}`}>
                                  {pred.points_earned > 0 ? '+' : ''}{pred.points_earned}
                                </span>
                                <div className="text-[10px] text-[#C0B8B4]">{pred.predicted_home}–{pred.predicted_away}</div>
                              </div>
                            )}
                            {pred?.predicted_home === -1 && (
                              <span className="text-xs text-red-400 font-medium w-16 text-right">−1 pen.</span>
                            )}
                          </div>
                          {total > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                              <span className="text-[10px] text-[#9D9491]">
                                {acertaron.length}/{total} acertaron
                              </span>
                              {acertaron.map((p: any) => {
                                const profile = (allProfiles || []).find((pr: any) => pr.id === p.user_id)
                                return profile ? (
                                  <span key={p.user_id} className="text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5">
                                    {profile.name.split(' ')[0]}
                                  </span>
                                ) : null
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bracket" className="mt-5">
          <Bracket matches={knockoutMatches} />
        </TabsContent>

        <TabsContent value="specials" className="mt-5">
          <div className="card-p overflow-hidden">
            <div className="card-section">
              <h3 className="font-semibold text-[#1A1614] text-sm">Pronósticos Especiales</h3>
            </div>
            <div className="px-5 py-4">
              {!specialRes?.champion ? (
                <p className="text-sm text-[#9D9491] text-center py-4">Resultados especiales aún no ingresados</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Campeón', pred: specialPred?.champion, real: specialRes?.champion, pts: specialPred?.champion_points },
                    { label: 'Subcampeón', pred: specialPred?.runner_up, real: specialRes?.runner_up, pts: specialPred?.runner_up_points },
                    { label: 'adidas Golden Boot', pred: specialPred?.top_scorer, real: specialRes?.top_scorer, pts: specialPred?.top_scorer_points },
                    { label: 'adidas Golden Ball', pred: (specialPred as any)?.golden_ball, real: (specialRes as any)?.golden_ball, pts: (specialPred as any)?.golden_ball_points },
                    { label: 'adidas Golden Glove', pred: (specialPred as any)?.golden_glove, real: (specialRes as any)?.golden_glove, pts: (specialPred as any)?.golden_glove_points },
                    { label: 'FIFA Best Young Player', pred: specialPred?.revelation_player, real: specialRes?.revelation_player, pts: specialPred?.revelation_player_points },
                    { label: 'Sel. Revelación', pred: specialPred?.revelation_team, real: specialRes?.revelation_team, pts: specialPred?.revelation_team_points },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#F5F4F2] last:border-0">
                      <div>
                        <div className="text-xs text-[#9D9491] uppercase tracking-wider">{item.label}</div>
                        <div className="font-medium text-sm text-[#1A1614] mt-0.5">{item.real ? `${getFlag(item.real)} ${item.real}` : '—'}</div>
                        {item.pred && <div className="text-xs text-[#9D9491]">Tu pronóstico: {item.pred}</div>}
                      </div>
                      {item.pts !== undefined && (
                        <span className={`text-sm font-semibold ${item.pts > 0 ? 'text-green-600' : 'text-[#9D9491]'}`}>
                          {item.pts > 0 ? `+${item.pts}` : item.pts}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
