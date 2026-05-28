'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PHASE_LABELS, WC2026_TEAMS } from '@/lib/scoring'
import type { Match, Prediction, PhaseDeadline, SpecialPrediction, PhaseType } from '@/lib/types'

type Props = {
  matches: Match[]
  predictions: Prediction[]
  deadlines: PhaseDeadline[]
  specialPrediction: SpecialPrediction | null
  specialResultsExist: boolean
  userId: string
}

const PHASES: PhaseType[] = ['groups', 'round_of_16', 'quarterfinals', 'semifinals', 'final']

export default function PredictionsClient({ matches, predictions, deadlines, specialPrediction, specialResultsExist, userId }: Props) {
  const [localPreds, setLocalPreds] = useState<Record<number, { home: string; away: string }>>(() => {
    const map: Record<number, { home: string; away: string }> = {}
    predictions.forEach(p => {
      map[p.match_id] = { home: String(p.predicted_home), away: String(p.predicted_away) }
    })
    return map
  })
  const [special, setSpecial] = useState({
    champion: specialPrediction?.champion || '',
    runner_up: specialPrediction?.runner_up || '',
    top_scorer: specialPrediction?.top_scorer || '',
    revelation_player: specialPrediction?.revelation_player || '',
    revelation_team: specialPrediction?.revelation_team || '',
  })
  const [saving, setSaving] = useState<number | null>(null)
  const [savingSpecial, setSavingSpecial] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)
  const [savedSpecial, setSavedSpecial] = useState(false)

  function isPhaseLocked(phase: PhaseType) {
    const deadline = deadlines.find(d => d.phase === phase)
    if (!deadline) return false
    if (deadline.is_locked) return true
    if (deadline.deadline && new Date(deadline.deadline) < new Date()) return true
    return false
  }

  function getMatchesForPhase(phase: PhaseType) {
    return matches.filter(m => m.phase === phase)
  }

  async function savePrediction(matchId: number) {
    const pred = localPreds[matchId]
    if (!pred || pred.home === '' || pred.away === '') return
    setSaving(matchId)
    const supabase = createClient()
    await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: matchId,
      predicted_home: Number(pred.home),
      predicted_away: Number(pred.away),
      points_earned: 0,
    }, { onConflict: 'user_id,match_id' })
    setSaving(null)
    setSaved(matchId)
    setTimeout(() => setSaved(null), 1500)
  }

  async function saveSpecial() {
    setSavingSpecial(true)
    const supabase = createClient()
    await supabase.from('special_predictions').upsert({
      user_id: userId,
      champion: special.champion || null,
      runner_up: special.runner_up || null,
      top_scorer: special.top_scorer || null,
      revelation_player: special.revelation_player || null,
      revelation_team: special.revelation_team || null,
      champion_points: 0,
      runner_up_points: 0,
      top_scorer_points: 0,
      revelation_player_points: 0,
      revelation_team_points: 0,
    }, { onConflict: 'user_id' })
    setSavingSpecial(false)
    setSavedSpecial(true)
    setTimeout(() => setSavedSpecial(false), 1500)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mis Pronósticos</h1>
      <Tabs defaultValue="groups">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {PHASES.map(phase => {
            const count = getMatchesForPhase(phase).length
            return (
              <TabsTrigger key={phase} value={phase} className="text-xs">
                {PHASE_LABELS[phase]}
                {count > 0 && <Badge variant="secondary" className="ml-1 text-xs h-4">{count}</Badge>}
                {isPhaseLocked(phase) && <span className="ml-1">🔒</span>}
              </TabsTrigger>
            )
          })}
          <TabsTrigger value="specials" className="text-xs">
            Especiales ★
          </TabsTrigger>
        </TabsList>

        {PHASES.map(phase => {
          const phaseMatches = getMatchesForPhase(phase)
          const locked = isPhaseLocked(phase)
          return (
            <TabsContent key={phase} value={phase} className="mt-4">
              {phaseMatches.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Los partidos de esta fase aún no están cargados
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {locked && (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm text-yellow-800 dark:text-yellow-200">
                      🔒 Esta fase está cerrada. Ya no puedes modificar tus pronósticos.
                    </div>
                  )}
                  {phaseMatches.map(match => {
                    const pred = localPreds[match.id]
                    const isFinished = match.status === 'finished'
                    const existingPred = predictions.find(p => p.match_id === match.id)
                    return (
                      <Card key={match.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex-1 text-center sm:text-right">
                              <span className="font-semibold">{match.home_team}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={20}
                                className="w-14 text-center"
                                value={pred?.home ?? ''}
                                onChange={e => setLocalPreds(prev => ({ ...prev, [match.id]: { ...prev[match.id], home: e.target.value } }))}
                                disabled={locked || isFinished}
                              />
                              <span className="text-muted-foreground font-bold">-</span>
                              <Input
                                type="number"
                                min={0}
                                max={20}
                                className="w-14 text-center"
                                value={pred?.away ?? ''}
                                onChange={e => setLocalPreds(prev => ({ ...prev, [match.id]: { ...prev[match.id], away: e.target.value } }))}
                                disabled={locked || isFinished}
                              />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                              <span className="font-semibold">{match.away_team}</span>
                            </div>
                            {!locked && !isFinished && (
                              <Button
                                size="sm"
                                onClick={() => savePrediction(match.id)}
                                disabled={saving === match.id}
                                variant={saved === match.id ? 'default' : 'outline'}
                              >
                                {saving === match.id ? '...' : saved === match.id ? '✓' : 'Guardar'}
                              </Button>
                            )}
                            {isFinished && existingPred && (
                              <Badge variant={existingPred.points_earned > 0 ? 'default' : 'secondary'}>
                                {existingPred.points_earned} pts
                              </Badge>
                            )}
                          </div>
                          {isFinished && match.home_score !== null && (
                            <div className="mt-2 text-center text-sm text-muted-foreground">
                              Resultado: {match.home_score} - {match.away_score}
                            </div>
                          )}
                          {match.match_date && (
                            <div className="mt-1 text-center text-xs text-muted-foreground">
                              {new Date(match.match_date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
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
            <CardHeader>
              <CardTitle>Pronósticos Especiales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {specialResultsExist && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm text-yellow-800 dark:text-yellow-200">
                  🔒 Los resultados especiales ya fueron ingresados. No puedes modificar estos pronósticos.
                </div>
              )}
              {[
                { key: 'champion', label: 'Campeón del Mundial', type: 'team' },
                { key: 'runner_up', label: 'Subcampeón', type: 'team' },
                { key: 'top_scorer', label: 'Goleador del Torneo', type: 'text' },
                { key: 'revelation_player', label: 'Jugador Revelación', type: 'text' },
                { key: 'revelation_team', label: 'Selección Revelación', type: 'team' },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <Label>{field.label}</Label>
                  {field.type === 'team' ? (
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={special[field.key as keyof typeof special]}
                      onChange={e => setSpecial(prev => ({ ...prev, [field.key]: e.target.value }))}
                      disabled={specialResultsExist}
                    >
                      <option value="">-- Selecciona un equipo --</option>
                      {WC2026_TEAMS.map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="Nombre del jugador"
                      value={special[field.key as keyof typeof special]}
                      onChange={e => setSpecial(prev => ({ ...prev, [field.key]: e.target.value }))}
                      disabled={specialResultsExist}
                    />
                  )}
                </div>
              ))}
              {!specialResultsExist && (
                <Button onClick={saveSpecial} disabled={savingSpecial} className="w-full">
                  {savingSpecial ? 'Guardando...' : savedSpecial ? '✓ Guardado' : 'Guardar Pronósticos Especiales'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
