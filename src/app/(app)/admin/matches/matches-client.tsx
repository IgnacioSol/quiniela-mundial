'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PHASE_LABELS, WC2026_TEAMS } from '@/lib/scoring'
import type { Match, PhaseDeadline, PhaseType } from '@/lib/types'
import { calcMatchPoints } from '@/lib/scoring'

const PHASES: PhaseType[] = ['groups', 'round_of_16', 'quarterfinals', 'semifinals', 'final']

type Props = { matches: Match[]; deadlines: PhaseDeadline[] }

export default function MatchesClient({ matches: initialMatches, deadlines: initialDeadlines }: Props) {
  const router = useRouter()
  const [matches, setMatches] = useState(initialMatches)
  const [deadlines, setDeadlines] = useState(initialDeadlines)
  const [newMatch, setNewMatch] = useState({ home_team: '', away_team: '', phase: 'groups' as PhaseType, match_date: '', group_name: '' })
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [saving, setSaving] = useState<number | 'new' | null>(null)

  async function addMatch() {
    if (!newMatch.home_team || !newMatch.away_team) return
    setSaving('new')
    const supabase = createClient()
    const { data } = await supabase.from('matches').insert({
      home_team: newMatch.home_team,
      away_team: newMatch.away_team,
      phase: newMatch.phase,
      match_date: newMatch.match_date || null,
      group_name: newMatch.group_name || null,
      status: 'pending',
      home_score: null,
      away_score: null,
    }).select().single()
    if (data) setMatches(prev => [...prev, data])
    setNewMatch({ home_team: '', away_team: '', phase: 'groups', match_date: '', group_name: '' })
    setSaving(null)
  }

  async function saveResult(match: Match) {
    const s = scores[match.id]
    if (!s || s.home === '' || s.away === '') return
    setSaving(match.id)
    const supabase = createClient()
    const home = Number(s.home)
    const away = Number(s.away)

    await supabase.from('matches').update({ home_score: home, away_score: away, status: 'finished' }).eq('id', match.id)

    // recalculate points for all predictions on this match
    const { data: config } = await supabase.from('scoring_config').select('*').single()
    const { data: preds } = await supabase.from('predictions').select('*').eq('match_id', match.id)
    if (preds && config) {
      for (const pred of preds) {
        const pts = calcMatchPoints(pred.predicted_home, pred.predicted_away, home, away, config)
        await supabase.from('predictions').update({ points_earned: pts }).eq('id', pred.id)
      }
    }

    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, home_score: home, away_score: away, status: 'finished' } : m))
    setSaving(null)
    router.refresh()
  }

  async function deleteMatch(id: number) {
    const supabase = createClient()
    await supabase.from('matches').delete().eq('id', id)
    setMatches(prev => prev.filter(m => m.id !== id))
  }

  async function saveDeadline(phase: PhaseType, deadline: string, locked: boolean) {
    const supabase = createClient()
    await supabase.from('phase_deadlines').upsert({ phase, deadline: deadline || null, is_locked: locked }, { onConflict: 'phase' })
    setDeadlines(prev => prev.map(d => d.phase === phase ? { ...d, deadline, is_locked: locked } : d))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Partidos</h1>

      <Card>
        <CardHeader><CardTitle>Agregar Partido</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Local</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={newMatch.home_team} onChange={e => setNewMatch(p => ({ ...p, home_team: e.target.value }))}>
                <option value="">-- Equipo local --</option>
                {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Visitante</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={newMatch.away_team} onChange={e => setNewMatch(p => ({ ...p, away_team: e.target.value }))}>
                <option value="">-- Equipo visitante --</option>
                {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Fase</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={newMatch.phase} onChange={e => setNewMatch(p => ({ ...p, phase: e.target.value as PhaseType }))}>
                {PHASES.map(ph => <option key={ph} value={ph}>{PHASE_LABELS[ph]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Grupo (opcional)</Label>
              <Input placeholder="A, B, C..." value={newMatch.group_name} onChange={e => setNewMatch(p => ({ ...p, group_name: e.target.value }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Fecha y hora</Label>
              <Input type="datetime-local" value={newMatch.match_date} onChange={e => setNewMatch(p => ({ ...p, match_date: e.target.value }))} />
            </div>
          </div>
          <Button className="mt-3 w-full" onClick={addMatch} disabled={saving === 'new'}>
            {saving === 'new' ? 'Guardando...' : 'Agregar Partido'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fechas límite por Fase</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PHASES.map(phase => {
              const dl = deadlines.find(d => d.phase === phase) || { phase, deadline: null, is_locked: false }
              return (
                <div key={phase} className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium w-36">{PHASE_LABELS[phase]}</span>
                  <Input
                    type="datetime-local"
                    className="w-48"
                    defaultValue={dl.deadline?.slice(0, 16) || ''}
                    onBlur={e => saveDeadline(phase, e.target.value, dl.is_locked)}
                  />
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dl.is_locked}
                      onChange={e => saveDeadline(phase, dl.deadline || '', e.target.checked)}
                    />
                    Bloquear manualmente
                  </label>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="groups">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {PHASES.map(ph => (
            <TabsTrigger key={ph} value={ph} className="text-xs">
              {PHASE_LABELS[ph]}
              <Badge variant="secondary" className="ml-1 text-xs h-4">{matches.filter(m => m.phase === ph).length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {PHASES.map(ph => (
          <TabsContent key={ph} value={ph} className="mt-4 space-y-3">
            {matches.filter(m => m.phase === ph).length === 0 ? (
              <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">No hay partidos en esta fase</CardContent></Card>
            ) : (
              matches.filter(m => m.phase === ph).map(match => (
                <Card key={match.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold flex-1 text-right text-sm">{match.home_team}</span>
                      {match.status === 'finished' ? (
                        <span className="font-bold text-lg px-2">{match.home_score} - {match.away_score}</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input type="number" min={0} className="w-14 text-center" value={scores[match.id]?.home ?? ''} onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))} />
                          <span>-</span>
                          <Input type="number" min={0} className="w-14 text-center" value={scores[match.id]?.away ?? ''} onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))} />
                        </div>
                      )}
                      <span className="font-semibold flex-1 text-sm">{match.away_team}</span>
                      <div className="flex gap-2">
                        {match.status !== 'finished' && (
                          <Button size="sm" onClick={() => saveResult(match)} disabled={saving === match.id}>
                            {saving === match.id ? '...' : 'Guardar'}
                          </Button>
                        )}
                        {match.status === 'finished' && <Badge variant="default">✓ Jugado</Badge>}
                        <Button size="sm" variant="destructive" onClick={() => deleteMatch(match.id)}>✕</Button>
                      </div>
                    </div>
                    {match.match_date && (
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        {new Date(match.match_date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {match.group_name && ` · Grupo ${match.group_name}`}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
