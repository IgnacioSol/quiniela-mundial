'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PHASE_LABELS, WC2026_TEAMS, getFlag } from '@/lib/scoring'
import type { Match, Prediction, PhaseDeadline, SpecialPrediction, PhaseType } from '@/lib/types'

type Props = {
  matches: Match[]
  predictions: Prediction[]
  deadlines: PhaseDeadline[]
  specialPrediction: SpecialPrediction | null
  specialResultsExist: boolean
  userId: string
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const KNOCKOUT_PHASES: PhaseType[] = ['round_of_16', 'quarterfinals', 'semifinals', 'final']

export default function PredictionsClient({ matches, predictions, deadlines, specialPrediction, specialResultsExist, userId }: Props) {
  const [localPreds, setLocalPreds] = useState<Record<number, { home: string; away: string }>>(() => {
    const map: Record<number, { home: string; away: string }> = {}
    predictions.forEach(p => { map[p.match_id] = { home: String(p.predicted_home), away: String(p.predicted_away) } })
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
    const dl = deadlines.find(d => d.phase === phase)
    if (!dl) return false
    if (dl.is_locked) return true
    if (dl.deadline && new Date(dl.deadline) < new Date()) return true
    return false
  }

  async function savePrediction(matchId: number) {
    const pred = localPreds[matchId]
    if (!pred || pred.home === '' || pred.away === '') return
    setSaving(matchId)
    const supabase = createClient()
    await supabase.from('predictions').upsert({
      user_id: userId, match_id: matchId,
      predicted_home: Number(pred.home), predicted_away: Number(pred.away), points_earned: 0,
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
      champion: special.champion || null, runner_up: special.runner_up || null,
      top_scorer: special.top_scorer || null, revelation_player: special.revelation_player || null,
      revelation_team: special.revelation_team || null,
      champion_points: 0, runner_up_points: 0, top_scorer_points: 0,
      revelation_player_points: 0, revelation_team_points: 0,
    }, { onConflict: 'user_id' })
    setSavingSpecial(false)
    setSavedSpecial(true)
    setTimeout(() => setSavedSpecial(false), 1500)
  }

  function MatchCard({ match, locked }: { match: Match; locked: boolean }) {
    const pred = localPreds[match.id]
    const isFinished = match.status === 'finished'
    const existingPred = predictions.find(p => p.match_id === match.id)
    return (
      <div className="card-mundial p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-right">
            <div className="font-semibold text-sm">{getFlag(match.home_team)} {match.home_team}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isFinished ? (
              <span className="font-bold text-lg text-[#8B1538] px-2">{match.home_score}–{match.away_score}</span>
            ) : (
              <>
                <Input type="number" min={0} max={20} className="w-12 h-8 text-center text-sm border-[#e8d5c0] focus:border-[#8B1538]"
                  value={pred?.home ?? ''}
                  onChange={e => setLocalPreds(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
                  disabled={locked} />
                <span className="text-muted-foreground font-bold text-xs">–</span>
                <Input type="number" min={0} max={20} className="w-12 h-8 text-center text-sm border-[#e8d5c0] focus:border-[#8B1538]"
                  value={pred?.away ?? ''}
                  onChange={e => setLocalPreds(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))}
                  disabled={locked} />
              </>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{getFlag(match.away_team)} {match.away_team}</div>
          </div>
          {!locked && !isFinished && (
            <Button size="sm" className="h-8 px-3 text-xs bg-[#8B1538] hover:bg-[#6b1028]"
              onClick={() => savePrediction(match.id)} disabled={saving === match.id}>
              {saving === match.id ? '...' : saved === match.id ? '✓' : 'Guardar'}
            </Button>
          )}
          {isFinished && existingPred && (
            <Badge className={existingPred.points_earned > 0 ? 'bg-green-600' : 'bg-gray-400'}>
              {existingPred.points_earned}pts
            </Badge>
          )}
        </div>
        {match.match_date && (
          <div className="text-center text-xs text-muted-foreground mt-1">
            {new Date(match.match_date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    )
  }

  // Deadline banner: find phase closing within 24h
  const upcomingDeadline = (() => {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    for (const dl of deadlines) {
      if (!dl.is_locked && dl.deadline) {
        const d = new Date(dl.deadline)
        if (d > now && d < in24h) {
          return { phase: PHASE_LABELS[dl.phase as PhaseType], deadline: d }
        }
      }
    }
    return null
  })()

  const groupMatches = matches.filter(m => m.phase === 'groups')
  const knockoutMatches = matches.filter(m => m.phase !== 'groups')
  const groupsLocked = isPhaseLocked('groups')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#8B1538]">✏️ Mis Pronósticos</h1>
      </div>

      {upcomingDeadline && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-red-700">¡Cierre próximo!</div>
            <div className="text-sm text-red-600">
              Los pronósticos de <strong>{upcomingDeadline.phase}</strong> cierran a las{' '}
              <strong>{upcomingDeadline.deadline.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</strong>.
              ¡No te quedes sin pronosticar o tendrás -1pt por partido!
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="groups">
        <TabsList className="bg-[#f3e8d0] flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="groups" className="text-xs data-[state=active]:bg-[#8B1538] data-[state=active]:text-white">
            Fase de Grupos {groupsLocked && '🔒'}
          </TabsTrigger>
          {KNOCKOUT_PHASES.map(phase => {
            const count = knockoutMatches.filter(m => m.phase === phase).length
            return (
              <TabsTrigger key={phase} value={phase} className="text-xs data-[state=active]:bg-[#8B1538] data-[state=active]:text-white">
                {PHASE_LABELS[phase]} {count > 0 && `(${count})`} {isPhaseLocked(phase) && '🔒'}
              </TabsTrigger>
            )
          })}
          <TabsTrigger value="specials" className="text-xs data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black">
            ⭐ Especiales
          </TabsTrigger>
        </TabsList>

        {/* FASE DE GRUPOS — dividida por grupo */}
        <TabsContent value="groups" className="mt-4">
          {groupsLocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-4">
              🔒 La fase de grupos está cerrada. Ya no puedes modificar tus pronósticos.
            </div>
          )}
          {groupMatches.length === 0 ? (
            <div className="card-mundial p-8 text-center text-muted-foreground">Los partidos de grupos aún no están cargados</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GROUPS.map(group => {
                const gMatches = groupMatches.filter(m => m.group_name === group)
                if (gMatches.length === 0) return null
                const teams = [...new Set(gMatches.flatMap(m => [m.home_team, m.away_team]))]
                return (
                  <div key={group} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 mundial-gradient rounded-full flex items-center justify-center text-white font-bold text-sm shadow">{group}</div>
                      <div className="text-xs text-muted-foreground">{teams.map(t => `${getFlag(t)} ${t}`).join(' · ')}</div>
                    </div>
                    <div className="space-y-2">
                      {gMatches.map(match => <MatchCard key={match.id} match={match} locked={groupsLocked} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* FASES ELIMINATORIAS */}
        {KNOCKOUT_PHASES.map(phase => (
          <TabsContent key={phase} value={phase} className="mt-4">
            {(() => {
              const phaseMatches = knockoutMatches.filter(m => m.phase === phase)
              const locked = isPhaseLocked(phase)
              return phaseMatches.length === 0 ? (
                <div className="card-mundial p-8 text-center text-muted-foreground">Los partidos de esta fase aún no están disponibles</div>
              ) : (
                <div className="space-y-3">
                  {locked && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">🔒 Esta fase está cerrada.</div>}
                  {phaseMatches.map(match => <MatchCard key={match.id} match={match} locked={locked} />)}
                </div>
              )
            })()}
          </TabsContent>
        ))}

        {/* ESPECIALES */}
        <TabsContent value="specials" className="mt-4">
          <div className="card-mundial overflow-hidden">
            <div className="bg-[#C9A84C] px-5 py-3">
              <h2 className="font-bold text-[#1a0510]">⭐ Pronósticos Especiales del Torneo</h2>
            </div>
            <div className="p-5 space-y-4">
              {specialResultsExist && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  🔒 Los resultados especiales ya fueron ingresados. No puedes modificar estos pronósticos.
                </div>
              )}
              {[
                { key: 'champion', label: '🏆 Campeón del Mundial', type: 'team' },
                { key: 'runner_up', label: '🥈 Subcampeón', type: 'team' },
                { key: 'top_scorer', label: '⚽ Goleador del Torneo', type: 'text' },
                { key: 'revelation_player', label: '⭐ Jugador Revelación', type: 'text' },
                { key: 'revelation_team', label: '🌟 Selección Revelación', type: 'team' },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <Label className="font-semibold text-[#8B1538]">{field.label}</Label>
                  {field.type === 'team' ? (
                    <select
                      className="w-full border border-[#e8d5c0] rounded-md px-3 py-2 text-sm bg-white focus:border-[#8B1538] focus:outline-none"
                      value={special[field.key as keyof typeof special]}
                      onChange={e => setSpecial(prev => ({ ...prev, [field.key]: e.target.value }))}
                      disabled={specialResultsExist}
                    >
                      <option value="">-- Selecciona un equipo --</option>
                      {WC2026_TEAMS.map(team => (
                        <option key={team} value={team}>{getFlag(team)} {team}</option>
                      ))}
                    </select>
                  ) : (
                    <Input className="border-[#e8d5c0] focus:border-[#8B1538]"
                      placeholder="Nombre del jugador"
                      value={special[field.key as keyof typeof special]}
                      onChange={e => setSpecial(prev => ({ ...prev, [field.key]: e.target.value }))}
                      disabled={specialResultsExist}
                    />
                  )}
                </div>
              ))}
              {!specialResultsExist && (
                <Button onClick={saveSpecial} disabled={savingSpecial} className="w-full bg-[#C9A84C] hover:bg-[#b8973b] text-black font-bold">
                  {savingSpecial ? 'Guardando...' : savedSpecial ? '✓ Guardado' : 'Guardar Pronósticos Especiales'}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
