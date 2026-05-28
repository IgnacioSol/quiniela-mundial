'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, RefreshCw } from 'lucide-react'
import { WC2026_TEAMS, getFlag } from '@/lib/scoring'
import type { SpecialResults, ScoringConfig, SpecialPrediction, Profile } from '@/lib/types'

type Props = {
  specialResults: SpecialResults | null
  config: ScoringConfig | null
  specialPredictions: SpecialPrediction[]
  profiles: Profile[]
}

const SPECIAL_FIELDS = [
  { key: 'champion', label: 'Campeón', type: 'team', points_key: 'champion_points' },
  { key: 'runner_up', label: 'Subcampeón', type: 'team', points_key: 'runner_up_points' },
  { key: 'top_scorer', label: 'Bota de Oro', type: 'player', points_key: 'top_scorer_points' },
  { key: 'golden_ball', label: 'Balón de Oro', type: 'player', points_key: 'golden_ball_points' },
  { key: 'golden_glove', label: 'Guante de Oro', type: 'player', points_key: 'golden_glove_points' },
  { key: 'revelation_player', label: 'Mejor Jugador Joven', type: 'player', points_key: 'revelation_player_points' },
] as const

export default function SpecialsClient({ specialResults: initialRes, config: initialConfig, specialPredictions, profiles }: Props) {
  const router = useRouter()
  const [results, setResults] = useState({
    champion: initialRes?.champion || '',
    runner_up: initialRes?.runner_up || '',
    top_scorer: initialRes?.top_scorer || '',
    golden_ball: initialRes?.golden_ball || '',
    golden_glove: initialRes?.golden_glove || '',
    revelation_player: initialRes?.revelation_player || '',
  })
  const [config, setConfig] = useState(initialConfig || {
    id: 1, exact_score_points: 3, correct_winner_points: 1,
    champion_points: 15, runner_up_points: 8, top_scorer_points: 8,
    golden_ball_points: 10, golden_glove_points: 5, revelation_player_points: 6,
    revelation_team_points: 0,
  })
  const [manualAdj, setManualAdj] = useState<Record<string, number>>(
    Object.fromEntries(profiles.map(p => [p.id, 0]))
  )
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingAdj, setSavingAdj] = useState<string | null>(null)
  const [savedAdj, setSavedAdj] = useState<string | null>(null)

  async function saveResults() {
    setSaving(true)
    const supabase = createClient()

    await supabase.from('special_results').upsert({
      id: 1,
      champion: results.champion || null,
      runner_up: results.runner_up || null,
      top_scorer: results.top_scorer || null,
      golden_ball: results.golden_ball || null,
      golden_glove: results.golden_glove || null,
      revelation_player: results.revelation_player || null,
    })

    // Recalculate all special prediction points
    for (const pred of specialPredictions) {
      const updates: Record<string, number> = {}
      for (const f of SPECIAL_FIELDS) {
        const predVal = (pred as any)[f.key]
        const realVal = results[f.key]
        const pts = (config as any)[f.points_key] || 0
        const match = f.type === 'team'
          ? predVal === realVal
          : predVal?.toLowerCase().trim() === realVal?.toLowerCase().trim()
        updates[f.points_key] = match && realVal ? pts : 0
      }
      await supabase.from('special_predictions').update(updates).eq('id', pred.id)
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
      golden_ball_points: config.golden_ball_points,
      golden_glove_points: config.golden_glove_points,
      revelation_player_points: config.revelation_player_points,
    }).eq('id', 1)
    setSavingConfig(false)
  }

  async function applyManualAdj(userId: string) {
    const adj = manualAdj[userId]
    if (isNaN(adj)) return
    setSavingAdj(userId)
    const supabase = createClient()

    // Store manual adjustment in profile (quota_amount field repurposed, or we can add a note)
    // We'll apply it as a bonus prediction entry (match_id = 0 = bonus)
    await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: 0,
      predicted_home: 0,
      predicted_away: 0,
      points_earned: adj,
    }, { onConflict: 'user_id,match_id' })

    setSavingAdj(null)
    setSavedAdj(userId)
    setTimeout(() => setSavedAdj(null), 2000)
    router.refresh()
  }

  const CONFIG_FIELDS = [
    { key: 'exact_score_points', label: 'Marcador exacto' },
    { key: 'correct_winner_points', label: 'Ganador / Empate' },
    { key: 'champion_points', label: 'Campeón' },
    { key: 'runner_up_points', label: 'Subcampeón' },
    { key: 'top_scorer_points', label: 'Bota de Oro' },
    { key: 'golden_ball_points', label: 'Balón de Oro' },
    { key: 'golden_glove_points', label: 'Guante de Oro' },
    { key: 'revelation_player_points', label: 'Mejor Jugador Joven' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[#1A1614] tracking-tight">Especiales & Configuración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Resultados especiales */}
        <div className="card-p overflow-hidden">
          <div className="card-section flex items-center gap-2.5">
            <div className="accent-bar" />
            <div>
              <h2 className="font-semibold text-[#1A1614] text-sm">Resultados FIFA</h2>
              <p className="text-xs text-[#9D9491] mt-0.5">Al guardar se recalculan puntos automáticamente</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-4">
            {SPECIAL_FIELDS.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-[#9D9491] mb-1.5 uppercase tracking-wider">{field.label}</label>
                {field.type === 'team' ? (
                  <select
                    className="w-full h-10 px-3 border border-[#E8E3DC] rounded-xl bg-white text-sm text-[#1A1614] focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none"
                    value={results[field.key]}
                    onChange={e => setResults(p => ({ ...p, [field.key]: e.target.value }))}
                  >
                    <option value="">Sin resultado</option>
                    {WC2026_TEAMS.map(t => <option key={t} value={t}>{getFlag(t)} {t}</option>)}
                  </select>
                ) : (
                  <input className="input-p" placeholder="Nombre del jugador"
                    value={results[field.key]}
                    onChange={e => setResults(p => ({ ...p, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <button onClick={saveResults} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
              {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Calculando...</> : 'Guardar y recalcular puntos'}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Puntuación */}
          <div className="card-p overflow-hidden">
            <div className="card-section flex items-center gap-2.5">
              <div className="accent-bar" />
              <h2 className="font-semibold text-[#1A1614] text-sm">Puntuación</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {CONFIG_FIELDS.map(field => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-[#6B6460] flex-1">{field.label}</label>
                  <input type="number" min={0}
                    className="w-16 h-8 text-center text-sm border border-[#E8E3DC] rounded-lg focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none"
                    value={(config as any)[field.key]}
                    onChange={e => setConfig(p => ({ ...p, [field.key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
              <button onClick={saveConfig} disabled={savingConfig}
                className="h-9 w-full bg-[#F5EEF1] text-[#8B1538] text-sm font-medium rounded-xl hover:bg-[#8B1538] hover:text-white transition-all mt-1">
                {savingConfig ? 'Guardando...' : 'Actualizar puntuación'}
              </button>
            </div>
          </div>

          {/* Ajuste manual de puntos */}
          <div className="card-p overflow-hidden">
            <div className="card-section flex items-center gap-2.5">
              <div className="accent-bar" />
              <div>
                <h2 className="font-semibold text-[#1A1614] text-sm">Ajuste manual de puntos</h2>
                <p className="text-xs text-[#9D9491] mt-0.5">Bonus o penalización arbitraria por participante</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              {profiles.map(profile => (
                <div key={profile.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#1A1614] flex-1">{profile.name}</span>
                  <input type="number"
                    className="w-20 h-8 text-center text-sm border border-[#E8E3DC] rounded-lg focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none tabular-nums"
                    value={manualAdj[profile.id] ?? 0}
                    onChange={e => setManualAdj(p => ({ ...p, [profile.id]: Number(e.target.value) }))}
                    placeholder="0"
                  />
                  <button
                    onClick={() => applyManualAdj(profile.id)}
                    disabled={savingAdj === profile.id}
                    className={`h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                      savedAdj === profile.id
                        ? 'bg-green-50 text-green-600 border border-green-100'
                        : 'bg-[#F5EEF1] text-[#8B1538] hover:bg-[#8B1538] hover:text-white'
                    }`}
                  >
                    {savedAdj === profile.id
                      ? <Check className="w-3 h-3" />
                      : savingAdj === profile.id ? '...' : 'Aplicar'
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
