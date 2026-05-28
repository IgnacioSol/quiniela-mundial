'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WC2026_TEAMS } from '@/lib/scoring'
import type { SpecialResults, ScoringConfig, SpecialPrediction } from '@/lib/types'

type Props = {
  specialResults: SpecialResults | null
  config: ScoringConfig | null
  specialPredictions: SpecialPrediction[]
}

export default function SpecialsClient({ specialResults: initialRes, config: initialConfig, specialPredictions }: Props) {
  const router = useRouter()
  const [results, setResults] = useState({
    champion: initialRes?.champion || '',
    runner_up: initialRes?.runner_up || '',
    top_scorer: initialRes?.top_scorer || '',
    revelation_player: initialRes?.revelation_player || '',
    revelation_team: initialRes?.revelation_team || '',
  })
  const [config, setConfig] = useState(initialConfig || {
    id: 1, exact_score_points: 2, correct_winner_points: 1,
    champion_points: 10, runner_up_points: 5, top_scorer_points: 5,
    revelation_player_points: 5, revelation_team_points: 5
  })
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  async function saveResults() {
    setSaving(true)
    const supabase = createClient()

    await supabase.from('special_results').upsert({
      id: 1,
      champion: results.champion || null,
      runner_up: results.runner_up || null,
      top_scorer: results.top_scorer || null,
      revelation_player: results.revelation_player || null,
      revelation_team: results.revelation_team || null,
    })

    // Recalculate points for all special predictions
    for (const pred of specialPredictions) {
      await supabase.from('special_predictions').update({
        champion_points: pred.champion === results.champion ? config.champion_points : 0,
        runner_up_points: pred.runner_up === results.runner_up ? config.runner_up_points : 0,
        top_scorer_points: pred.top_scorer?.toLowerCase() === results.top_scorer?.toLowerCase() ? config.top_scorer_points : 0,
        revelation_player_points: pred.revelation_player?.toLowerCase() === results.revelation_player?.toLowerCase() ? config.revelation_player_points : 0,
        revelation_team_points: pred.revelation_team === results.revelation_team ? config.revelation_team_points : 0,
      }).eq('id', pred.id)
    }

    setSaving(false)
    router.refresh()
  }

  async function saveConfig() {
    setSavingConfig(true)
    const supabase = createClient()
    await supabase.from('scoring_config').update({
      exact_score_points: config.exact_score_points,
      correct_winner_points: config.correct_winner_points,
      champion_points: config.champion_points,
      runner_up_points: config.runner_up_points,
      top_scorer_points: config.top_scorer_points,
      revelation_player_points: config.revelation_player_points,
      revelation_team_points: config.revelation_team_points,
    }).eq('id', 1)
    setSavingConfig(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resultados Especiales & Puntuación</h1>

      <Card>
        <CardHeader><CardTitle>Resultados Especiales del Torneo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Al guardar, se recalculan automáticamente los puntos de todos los participantes.</p>
          {[
            { key: 'champion', label: 'Campeón', type: 'team' },
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
                  value={results[field.key as keyof typeof results]}
                  onChange={e => setResults(p => ({ ...p, [field.key]: e.target.value }))}
                >
                  <option value="">-- Seleccionar --</option>
                  {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <Input
                  value={results[field.key as keyof typeof results]}
                  onChange={e => setResults(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder="Nombre..."
                />
              )}
            </div>
          ))}
          <Button onClick={saveResults} disabled={saving} className="w-full">
            {saving ? 'Guardando y calculando puntos...' : 'Guardar Resultados Especiales'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Configuración de Puntuación</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'exact_score_points', label: 'Resultado exacto (pts)' },
            { key: 'correct_winner_points', label: 'Ganador/Empate correcto (pts)' },
            { key: 'champion_points', label: 'Campeón correcto (pts)' },
            { key: 'runner_up_points', label: 'Subcampeón correcto (pts)' },
            { key: 'top_scorer_points', label: 'Goleador correcto (pts)' },
            { key: 'revelation_player_points', label: 'Jugador revelación correcto (pts)' },
            { key: 'revelation_team_points', label: 'Selección revelación correcta (pts)' },
          ].map(field => (
            <div key={field.key} className="flex items-center gap-3">
              <Label className="flex-1">{field.label}</Label>
              <Input
                type="number"
                min={0}
                className="w-20"
                value={config[field.key as keyof typeof config] as number}
                onChange={e => setConfig(p => ({ ...p, [field.key]: Number(e.target.value) }))}
              />
            </div>
          ))}
          <Button onClick={saveConfig} disabled={savingConfig} className="w-full mt-2">
            {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
