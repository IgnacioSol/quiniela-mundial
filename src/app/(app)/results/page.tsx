import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getFlag } from '@/lib/scoring'
import Bracket from '@/components/bracket'
import type { Match, Prediction, PhaseType } from '@/lib/types'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: allMatches }, { data: predictions }, { data: specialPred }, { data: specialRes }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user!.id),
    supabase.from('special_predictions').select('*').eq('user_id', user!.id).single(),
    supabase.from('special_results').select('*').eq('id', 1).single(),
  ])

  const finishedGroups = (allMatches || []).filter((m: Match) => m.phase === 'groups' && m.status === 'finished')
  const knockoutMatches = (allMatches || []).filter((m: Match) => m.phase !== 'groups')
  const myPreds = predictions || []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#8B1538]">📊 Resultados</h1>

      <Tabs defaultValue="groups">
        <TabsList className="bg-[#f3e8d0] flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="groups" className="text-xs data-[state=active]:bg-[#8B1538] data-[state=active]:text-white">
            Fase de Grupos
          </TabsTrigger>
          <TabsTrigger value="bracket" className="text-xs data-[state=active]:bg-[#8B1538] data-[state=active]:text-white">
            🏆 Llaves
          </TabsTrigger>
          <TabsTrigger value="specials" className="text-xs data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black">
            ⭐ Especiales
          </TabsTrigger>
        </TabsList>

        {/* GRUPOS */}
        <TabsContent value="groups" className="mt-4">
          {finishedGroups.length === 0 ? (
            <div className="card-mundial p-8 text-center text-muted-foreground">No hay resultados de grupos todavía</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GROUPS.map(group => {
                const gMatches = finishedGroups.filter((m: Match) => m.group_name === group)
                if (gMatches.length === 0) return null
                return (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 mundial-gradient rounded-full flex items-center justify-center text-white font-bold text-xs shadow">{group}</div>
                      <span className="text-sm font-bold text-[#8B1538]">Grupo {group}</span>
                    </div>
                    <div className="space-y-2">
                      {gMatches.map((match: Match) => {
                        const pred = myPreds.find((p: Prediction) => p.match_id === match.id)
                        const homeWins = match.home_score! > match.away_score!
                        const awayWins = match.away_score! > match.home_score!
                        return (
                          <div key={match.id} className="card-mundial p-3">
                            <div className="flex items-center gap-2">
                              <span className={`flex-1 text-right text-sm font-semibold ${homeWins ? 'text-[#8B1538]' : ''}`}>
                                {getFlag(match.home_team)} {match.home_team}
                              </span>
                              <span className="font-bold text-[#8B1538] text-base px-1">{match.home_score}–{match.away_score}</span>
                              <span className={`flex-1 text-sm font-semibold ${awayWins ? 'text-[#8B1538]' : ''}`}>
                                {getFlag(match.away_team)} {match.away_team}
                              </span>
                              {pred && (
                                <Badge className={pred.points_earned >= 2 ? 'bg-green-600' : pred.points_earned === 1 ? 'bg-yellow-500 text-black' : 'bg-gray-300 text-gray-700'}>
                                  {pred.points_earned}pts
                                </Badge>
                              )}
                            </div>
                            {pred && (
                              <div className="text-xs text-center text-muted-foreground mt-1">
                                Tu pronóstico: {pred.predicted_home}–{pred.predicted_away}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* LLAVES */}
        <TabsContent value="bracket" className="mt-4">
          <Bracket matches={knockoutMatches} />
        </TabsContent>

        {/* ESPECIALES */}
        <TabsContent value="specials" className="mt-4">
          <div className="card-mundial overflow-hidden">
            <div className="bg-[#C9A84C] px-5 py-3">
              <h2 className="font-bold text-[#1a0510]">⭐ Pronósticos Especiales</h2>
            </div>
            <div className="p-5">
              {!specialRes?.champion ? (
                <p className="text-center text-muted-foreground py-4">Los resultados especiales aún no han sido ingresados</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: '🏆 Campeón', pred: specialPred?.champion, real: specialRes?.champion, pts: specialPred?.champion_points },
                    { label: '🥈 Subcampeón', pred: specialPred?.runner_up, real: specialRes?.runner_up, pts: specialPred?.runner_up_points },
                    { label: '⚽ Goleador', pred: specialPred?.top_scorer, real: specialRes?.top_scorer, pts: specialPred?.top_scorer_points },
                    { label: '⭐ Jug. Revelación', pred: specialPred?.revelation_player, real: specialRes?.revelation_player, pts: specialPred?.revelation_player_points },
                    { label: '🌟 Sel. Revelación', pred: specialPred?.revelation_team, real: specialRes?.revelation_team, pts: specialPred?.revelation_team_points },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between border border-[#e8d5c0] rounded-xl p-3">
                      <div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                        <div className="font-bold text-sm text-[#8B1538]">{item.real ? `${getFlag(item.real)} ${item.real}` : '—'}</div>
                        {item.pred && <div className="text-xs text-muted-foreground">Tu pronóstico: {item.pred}</div>}
                      </div>
                      {item.pts !== undefined && (
                        <Badge className={item.pts > 0 ? 'bg-green-600' : 'bg-gray-300 text-gray-700'}>{item.pts}pts</Badge>
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
