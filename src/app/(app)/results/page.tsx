import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PHASE_LABELS } from '@/lib/scoring'
import type { Match, Prediction, PhaseType } from '@/lib/types'

const PHASES: PhaseType[] = ['groups', 'round_of_16', 'quarterfinals', 'semifinals', 'final']

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: matches }, { data: predictions }, { data: specialPred }, { data: specialRes }] = await Promise.all([
    supabase.from('matches').select('*').eq('status', 'finished').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user!.id),
    supabase.from('special_predictions').select('*').eq('user_id', user!.id).single(),
    supabase.from('special_results').select('*').eq('id', 1).single(),
  ])

  const finishedMatches = matches || []
  const myPreds = predictions || []

  function getMatchesForPhase(phase: PhaseType) {
    return finishedMatches.filter((m: Match) => m.phase === phase)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Resultados</h1>
      <Tabs defaultValue="groups">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {PHASES.map(phase => {
            const count = getMatchesForPhase(phase).length
            return (
              <TabsTrigger key={phase} value={phase} className="text-xs">
                {PHASE_LABELS[phase]}
                {count > 0 && <Badge variant="secondary" className="ml-1 text-xs h-4">{count}</Badge>}
              </TabsTrigger>
            )
          })}
          <TabsTrigger value="specials" className="text-xs">Especiales ★</TabsTrigger>
        </TabsList>

        {PHASES.map(phase => {
          const phaseMatches = getMatchesForPhase(phase)
          return (
            <TabsContent key={phase} value={phase} className="mt-4">
              {phaseMatches.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No hay resultados para esta fase todavía
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {phaseMatches.map((match: Match) => {
                    const pred = myPreds.find((p: Prediction) => p.match_id === match.id)
                    return (
                      <Card key={match.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="font-semibold flex-1 text-right">{match.home_team}</span>
                                <span className="font-bold text-lg px-2">
                                  {match.home_score} - {match.away_score}
                                </span>
                                <span className="font-semibold flex-1">{match.away_team}</span>
                              </div>
                              {pred ? (
                                <div className="mt-1 text-center text-xs text-muted-foreground">
                                  Tu pronóstico: {pred.predicted_home} - {pred.predicted_away}
                                </div>
                              ) : (
                                <div className="mt-1 text-center text-xs text-muted-foreground">
                                  No hiciste pronóstico
                                </div>
                              )}
                            </div>
                            {pred && (
                              <Badge
                                variant={pred.points_earned === 0 ? 'secondary' : pred.points_earned >= 2 ? 'default' : 'outline'}
                                className="ml-3"
                              >
                                {pred.points_earned} pts
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          )
        })}

        <TabsContent value="specials" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pronósticos Especiales</CardTitle></CardHeader>
            <CardContent>
              {!specialRes?.champion ? (
                <p className="text-center text-muted-foreground py-4">
                  Los resultados especiales aún no han sido ingresados
                </p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Campeón', pred: specialPred?.champion, real: specialRes?.champion, pts: specialPred?.champion_points },
                    { label: 'Subcampeón', pred: specialPred?.runner_up, real: specialRes?.runner_up, pts: specialPred?.runner_up_points },
                    { label: 'Goleador', pred: specialPred?.top_scorer, real: specialRes?.top_scorer, pts: specialPred?.top_scorer_points },
                    { label: 'Jug. Revelación', pred: specialPred?.revelation_player, real: specialRes?.revelation_player, pts: specialPred?.revelation_player_points },
                    { label: 'Sel. Revelación', pred: specialPred?.revelation_team, real: specialRes?.revelation_team, pts: specialPred?.revelation_team_points },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                        <div className="font-medium text-sm">{item.real || '—'}</div>
                        {item.pred && (
                          <div className="text-xs text-muted-foreground">Tu pronóstico: {item.pred}</div>
                        )}
                      </div>
                      {item.pts !== undefined && (
                        <Badge variant={item.pts > 0 ? 'default' : 'secondary'}>{item.pts} pts</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
