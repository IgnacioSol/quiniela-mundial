'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react'
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
type Tab = 'groups' | PhaseType | 'specials'

export default function PredictionsClient({ matches, predictions, deadlines, specialPrediction, specialResultsExist, userId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
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
  const [saved, setSaved] = useState<number | null>(null)
  const [savingSpecial, setSavingSpecial] = useState(false)
  const [savedSpecial, setSavedSpecial] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['A']))

  function isPhaseLocked(phase: PhaseType) {
    const dl = deadlines.find(d => d.phase === phase)
    if (!dl) return false
    if (dl.is_locked) return true
    if (dl.deadline && new Date(dl.deadline) < new Date()) return true
    return false
  }

  // Deadline banner
  const upcomingDeadline = (() => {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    for (const dl of deadlines) {
      if (!dl.is_locked && dl.deadline) {
        const d = new Date(dl.deadline)
        if (d > now && d < in24h) return { phase: PHASE_LABELS[dl.phase as PhaseType], deadline: d }
      }
    }
    return null
  })()

  async function savePrediction(matchId: number) {
    const pred = localPreds[matchId]
    if (!pred || pred.home === '' || pred.away === '') return
    setSaving(matchId)
    const supabase = createClient()
    await supabase.from('predictions').upsert({
      user_id: userId, match_id: matchId,
      predicted_home: Number(pred.home), predicted_away: Number(pred.away), points_earned: 0,
    }, { onConflict: 'user_id,match_id' })
    setSaving(null); setSaved(matchId)
    setTimeout(() => setSaved(null), 2000)
  }

  async function saveSpecial() {
    setSavingSpecial(true)
    const supabase = createClient()
    await supabase.from('special_predictions').upsert({
      user_id: userId, champion: special.champion || null, runner_up: special.runner_up || null,
      top_scorer: special.top_scorer || null, revelation_player: special.revelation_player || null,
      revelation_team: special.revelation_team || null,
      champion_points: 0, runner_up_points: 0, top_scorer_points: 0,
      revelation_player_points: 0, revelation_team_points: 0,
    }, { onConflict: 'user_id' })
    setSavingSpecial(false); setSavedSpecial(true)
    setTimeout(() => setSavedSpecial(false), 2000)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'groups', label: 'Grupos' },
    ...KNOCKOUT_PHASES.filter(p => matches.some(m => m.phase === p)).map(p => ({ key: p as Tab, label: PHASE_LABELS[p] })),
    { key: 'specials', label: 'Especiales' },
  ]

  function MatchRow({ match, locked }: { match: Match; locked: boolean }) {
    const pred = localPreds[match.id]
    const isFinished = match.status === 'finished'
    const existingPred = predictions.find(p => p.match_id === match.id)
    const isSaved = saved === match.id

    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F4F2] last:border-0 hover:bg-[#FAFAF9] transition-colors group">
        <div className="flex-1 text-right">
          <span className="text-sm font-medium text-[#1A1614]">{getFlag(match.home_team)} {match.home_team}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isFinished ? (
            <span className="text-sm font-semibold text-[#8B1538] px-2">{match.home_score}–{match.away_score}</span>
          ) : (
            <>
              <input type="number" min={0} max={20}
                className="w-11 h-8 text-center text-sm border border-[#E8E3DC] rounded-lg bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                value={pred?.home ?? ''} disabled={locked}
                onChange={e => setLocalPreds(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
              />
              <span className="text-[#C0B8B4] text-xs">—</span>
              <input type="number" min={0} max={20}
                className="w-11 h-8 text-center text-sm border border-[#E8E3DC] rounded-lg bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                value={pred?.away ?? ''} disabled={locked}
                onChange={e => setLocalPreds(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))}
              />
            </>
          )}
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-[#1A1614]">{getFlag(match.away_team)} {match.away_team}</span>
        </div>
        <div className="w-16 flex items-center justify-end">
          {!locked && !isFinished && (
            <button onClick={() => savePrediction(match.id)} disabled={saving === match.id}
              className={`h-7 px-3 rounded-lg text-xs font-medium transition-all ${isSaved ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-[#F5EEF1] text-[#8B1538] hover:bg-[#8B1538] hover:text-white border border-transparent'}`}>
              {saving === match.id ? '...' : isSaved ? <span className="flex items-center gap-1"><Check className="w-3 h-3" />Listo</span> : 'Guardar'}
            </button>
          )}
          {isFinished && existingPred && (
            <span className={`text-xs font-semibold ${existingPred.points_earned > 0 ? 'text-green-600' : existingPred.points_earned < 0 ? 'text-red-400' : 'text-[#9D9491]'}`}>
              {existingPred.points_earned > 0 ? '+' : ''}{existingPred.points_earned}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 py-2">
      <h1 className="text-xl font-semibold text-[#1A1614] tracking-tight">Pronósticos</h1>

      {upcomingDeadline && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" strokeWidth={2} />
          <div>
            <p className="text-sm font-medium text-red-700">Cierre próximo — {upcomingDeadline.phase}</p>
            <p className="text-xs text-red-500 mt-0.5">
              Cierra a las {upcomingDeadline.deadline.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}. Sin pronóstico = −1 punto por partido.
            </p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#E8E3DC]">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === key ? 'text-[#8B1538] border-[#8B1538]' : 'text-[#6B6460] border-transparent hover:text-[#1A1614]'}`}>
            {label}
            {key !== 'specials' && key !== 'groups' && isPhaseLocked(key as PhaseType) && (
              <Lock className="w-3 h-3 ml-1 inline opacity-50" />
            )}
          </button>
        ))}
      </div>

      {/* Groups tab */}
      {activeTab === 'groups' && (
        <div>
          {isPhaseLocked('groups') && (
            <div className="flex items-center gap-2 p-3 bg-[#F5F4F2] rounded-xl mb-4">
              <Lock className="w-3.5 h-3.5 text-[#9D9491]" />
              <p className="text-sm text-[#6B6460]">Fase de grupos cerrada — ya no puedes modificar pronósticos.</p>
            </div>
          )}
          {matches.filter(m => m.phase === 'groups').length === 0 ? (
            <div className="card-p p-10 text-center text-[#9D9491] text-sm">Partidos de grupos no disponibles aún</div>
          ) : (
            <div className="space-y-3">
              {GROUPS.map(group => {
                const gm = matches.filter(m => m.phase === 'groups' && m.group_name === group)
                if (gm.length === 0) return null
                const teams = [...new Set(gm.flatMap(m => [m.home_team, m.away_team]))]
                const isOpen = expandedGroups.has(group)
                return (
                  <div key={group} className="card-p overflow-hidden">
                    <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FAFAF9] transition-colors"
                      onClick={() => setExpandedGroups(prev => { const s = new Set(prev); s.has(group) ? s.delete(group) : s.add(group); return s })}>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#8B1538] flex items-center justify-center text-white text-xs font-bold">{group}</div>
                        <span className="text-sm text-[#6B6460]">{teams.map(t => t).join(' · ')}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#9D9491]" /> : <ChevronDown className="w-4 h-4 text-[#9D9491]" />}
                    </button>
                    {isOpen && gm.map(m => <MatchRow key={m.id} match={m} locked={isPhaseLocked('groups')} />)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Knockout tabs */}
      {KNOCKOUT_PHASES.map(phase => activeTab === phase && (
        <div key={phase}>
          {isPhaseLocked(phase) && (
            <div className="flex items-center gap-2 p-3 bg-[#F5F4F2] rounded-xl mb-4">
              <Lock className="w-3.5 h-3.5 text-[#9D9491]" />
              <p className="text-sm text-[#6B6460]">Esta fase está cerrada.</p>
            </div>
          )}
          <div className="card-p overflow-hidden">
            {matches.filter(m => m.phase === phase).length === 0 ? (
              <p className="text-sm text-[#9D9491] text-center py-10">Partidos no disponibles aún</p>
            ) : matches.filter(m => m.phase === phase).map(m => (
              <MatchRow key={m.id} match={m} locked={isPhaseLocked(phase)} />
            ))}
          </div>
        </div>
      ))}

      {/* Specials tab */}
      {activeTab === 'specials' && (
        <div className="card-p overflow-hidden">
          <div className="card-section">
            <h3 className="font-semibold text-[#1A1614] text-sm">Pronósticos del Torneo</h3>
            <p className="text-xs text-[#9D9491] mt-0.5">Solo puedes modificarlos antes de que el admin ingrese los resultados.</p>
          </div>
          {specialResultsExist && (
            <div className="flex items-center gap-2 mx-5 mt-4 p-3 bg-[#F5F4F2] rounded-xl">
              <Lock className="w-3.5 h-3.5 text-[#9D9491]" />
              <p className="text-sm text-[#6B6460]">Resultados ya ingresados — no se pueden modificar.</p>
            </div>
          )}
          <div className="px-5 py-4 space-y-4">
            {[
              { key: 'champion', label: 'Campeón del Mundial', type: 'team' },
              { key: 'runner_up', label: 'Subcampeón', type: 'team' },
              { key: 'top_scorer', label: 'Goleador del Torneo', type: 'text' },
              { key: 'revelation_player', label: 'Jugador Revelación', type: 'text' },
              { key: 'revelation_team', label: 'Selección Revelación', type: 'team' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-[#6B6460] mb-1.5 uppercase tracking-wider">{field.label}</label>
                {field.type === 'team' ? (
                  <select
                    className="w-full h-10 px-3 border border-[#E8E3DC] rounded-xl bg-white text-sm text-[#1A1614] focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none disabled:opacity-40"
                    value={special[field.key as keyof typeof special]}
                    onChange={e => setSpecial(p => ({ ...p, [field.key]: e.target.value }))}
                    disabled={specialResultsExist}
                  >
                    <option value="">Selecciona un equipo</option>
                    {WC2026_TEAMS.map(t => <option key={t} value={t}>{getFlag(t)} {t}</option>)}
                  </select>
                ) : (
                  <input className="input-p" placeholder="Nombre del jugador"
                    value={special[field.key as keyof typeof special]}
                    onChange={e => setSpecial(p => ({ ...p, [field.key]: e.target.value }))}
                    disabled={specialResultsExist}
                  />
                )}
              </div>
            ))}
            {!specialResultsExist && (
              <button onClick={saveSpecial} disabled={savingSpecial} className="btn-primary mt-2">
                {savingSpecial ? 'Guardando...' : savedSpecial ? 'Guardado correctamente' : 'Guardar pronósticos especiales'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
