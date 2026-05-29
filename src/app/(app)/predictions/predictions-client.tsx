'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, AlertTriangle, Check, ChevronDown, ChevronUp, Clock, Trash2 } from 'lucide-react'
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

// Compute jornada deadline: lock time = first match of that matchday across all groups
function getJornadaDeadline(match: Match, allMatches: Match[]): Date | null {
  if (!match.match_date) return null

  if (match.phase === 'groups') {
    const allGroup = allMatches.filter(m => m.phase === 'groups' && m.group_name && m.match_date)
    const matchDayMap = new Map<number, number>()
    const groups = [...new Set(allGroup.map(m => m.group_name!))]

    for (const group of groups) {
      const gm = allGroup
        .filter(m => m.group_name === group)
        .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())
      gm.forEach((m, i) => matchDayMap.set(m.id, Math.floor(i / 2) + 1))
    }

    const matchday = matchDayMap.get(match.id)
    if (matchday === undefined) return new Date(match.match_date)

    const jornadaMatches = allGroup.filter(m => matchDayMap.get(m.id) === matchday && m.match_date)
    const minTime = Math.min(...jornadaMatches.map(m => new Date(m.match_date!).getTime()))
    return new Date(minTime)
  }

  // Knockout: lock at first match of that phase
  const phaseMatches = allMatches.filter(m => m.phase === match.phase && m.match_date)
  if (phaseMatches.length === 0) return null
  const minTime = Math.min(...phaseMatches.map(m => new Date(m.match_date!).getTime()))
  return new Date(minTime)
}

function isMatchLocked(match: Match, allMatches: Match[]): boolean {
  if (match.status === 'finished') return true
  const deadline = getJornadaDeadline(match, allMatches)
  if (!deadline) return false
  return new Date() >= deadline
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function CountdownPill({ deadline }: { deadline: Date }) {
  const [display, setDisplay] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    function tick() {
      const ms = deadline.getTime() - Date.now()
      if (ms <= 0) { setDisplay(''); return }
      setDisplay(formatCountdown(ms))
      setUrgent(ms < 3600000) // < 1h = urgent
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [deadline])

  if (!display) return null
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${urgent ? 'text-orange-500' : 'text-[#9D9491]'}`}>
      <Clock className="w-2.5 h-2.5" />
      {display}
    </span>
  )
}

// Champion/runner-up lock at tournament start (June 11 2026)
const TOURNAMENT_START = new Date('2026-06-11T11:00:00-05:00')
function isTournamentStarted() { return new Date() >= TOURNAMENT_START }

export default function PredictionsClient({ matches, predictions, deadlines, specialPrediction, specialResultsExist, userId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
  const [localPreds, setLocalPreds] = useState<Record<number, { home: string; away: string }>>(() => {
    const map: Record<number, { home: string; away: string }> = {}
    predictions.filter(p => p.predicted_home !== -1).forEach(p => { map[p.match_id] = { home: String(p.predicted_home), away: String(p.predicted_away) } })
    return map
  })
  const [special, setSpecial] = useState({
    champion: specialPrediction?.champion || '',
    runner_up: specialPrediction?.runner_up || '',
    top_scorer: specialPrediction?.top_scorer || '',
    golden_ball: specialPrediction?.golden_ball || '',
    golden_glove: specialPrediction?.golden_glove || '',
    revelation_player: specialPrediction?.revelation_player || '',
  })
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [savedPredIds, setSavedPredIds] = useState<Set<number>>(
    () => new Set(predictions.filter(p => p.predicted_home !== -1).map(p => p.match_id))
  )
  const [savingSpecial, setSavingSpecial] = useState(false)
  const [savedSpecial, setSavedSpecial] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['A']))
  const [tournamentStarted, setTournamentStarted] = useState(isTournamentStarted())

  useEffect(() => {
    const id = setInterval(() => setTournamentStarted(isTournamentStarted()), 60000)
    return () => clearInterval(id)
  }, [])

  // Deadline banner: any phase locking within 24h
  const upcomingDeadline = (() => {
    const now = new Date()
    const in24h = new Date(now.getTime() + 86400000)
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
    setSavedPredIds(s => new Set(s).add(matchId))
    setTimeout(() => setSaved(null), 2500)
  }

  async function deletePrediction(matchId: number) {
    setDeleting(matchId)
    const supabase = createClient()
    await supabase.from('predictions').update({
      predicted_home: -1, predicted_away: -1, points_earned: 0,
    }).eq('user_id', userId).eq('match_id', matchId)
    setLocalPreds(p => { const copy = { ...p }; delete copy[matchId]; return copy })
    setSavedPredIds(s => { const copy = new Set(s); copy.delete(matchId); return copy })
    setDeleting(null)
  }

  async function saveSpecial() {
    setSavingSpecial(true)
    const supabase = createClient()
    await supabase.from('special_predictions').upsert({
      user_id: userId,
      champion: special.champion || null,
      runner_up: special.runner_up || null,
      top_scorer: special.top_scorer || null,
      golden_ball: special.golden_ball || null,
      golden_glove: special.golden_glove || null,
      revelation_player: special.revelation_player || null,
      champion_points: 0, runner_up_points: 0, top_scorer_points: 0,
      golden_ball_points: 0, golden_glove_points: 0, revelation_player_points: 0,
    }, { onConflict: 'user_id' })
    setSavingSpecial(false); setSavedSpecial(true)
    setTimeout(() => setSavedSpecial(false), 2500)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'groups', label: 'Grupos' },
    ...KNOCKOUT_PHASES
      .filter(p => matches.some(m => m.phase === p))
      .map(p => ({ key: p as Tab, label: PHASE_LABELS[p] })),
    { key: 'specials', label: 'Premios FIFA' },
  ]

  function MatchRow({ match }: { match: Match }) {
    const locked = isMatchLocked(match, matches)
    const pred = localPreds[match.id]
    const isFinished = match.status === 'finished'
    const existingPred = predictions.find(p => p.match_id === match.id)
    const isSaved = saved === match.id
    const deadline = getJornadaDeadline(match, matches)
    const msLeft = deadline ? deadline.getTime() - Date.now() : Infinity

    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F4F2] last:border-0 hover:bg-[#FAFAF9] transition-colors">
        <div className="flex-1 text-right min-w-0">
          <span className="text-sm font-medium text-[#1A1614] truncate block">{getFlag(match.home_team)} {match.home_team}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isFinished ? (
            <span className="text-sm font-semibold text-[#8B1538] px-2 tabular-nums">{match.home_score}–{match.away_score}</span>
          ) : (
            <>
              <input type="number" min={0} max={20}
                className="w-11 h-8 text-center text-sm border border-[#E8E3DC] rounded-lg bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none transition-all disabled:bg-[#F5F4F2] disabled:text-[#C0B8B4] disabled:cursor-not-allowed tabular-nums"
                value={pred?.home ?? ''} disabled={locked}
                onChange={e => setLocalPreds(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
              />
              <span className="text-[#C0B8B4] text-xs">–</span>
              <input type="number" min={0} max={20}
                className="w-11 h-8 text-center text-sm border border-[#E8E3DC] rounded-lg bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none transition-all disabled:bg-[#F5F4F2] disabled:text-[#C0B8B4] disabled:cursor-not-allowed tabular-nums"
                value={pred?.away ?? ''} disabled={locked}
                onChange={e => setLocalPreds(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))}
              />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-[#1A1614] truncate block">{getFlag(match.away_team)} {match.away_team}</span>
        </div>

        <div className="flex flex-col items-end gap-0.5 w-20 shrink-0">
          {locked && !isFinished && (
            <span className="flex items-center gap-1 text-xs text-[#C0B8B4]">
              <Lock className="w-3 h-3" /> Cerrado
            </span>
          )}
          {!locked && !isFinished && (
            <>
              <div className="flex gap-1 w-full">
                <button
                  onClick={() => savePrediction(match.id)}
                  disabled={saving === match.id}
                  className={`h-7 px-3 rounded-lg text-xs font-medium transition-all flex-1 ${
                    isSaved
                      ? 'bg-green-50 text-green-600 border border-green-100'
                      : 'bg-[#F5EEF1] text-[#8B1538] hover:bg-[#8B1538] hover:text-white'
                  }`}
                >
                  {saving === match.id ? '...' : isSaved
                    ? <span className="flex items-center justify-center gap-1"><Check className="w-3 h-3" />Listo</span>
                    : 'Guardar'}
                </button>
                {savedPredIds.has(match.id) && (
                  <button
                    onClick={() => deletePrediction(match.id)}
                    disabled={deleting === match.id}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-[#C0B8B4] hover:bg-red-50 hover:text-red-400 transition-all"
                    title="Borrar pronóstico"
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                  </button>
                )}
              </div>
              {deadline && msLeft > 0 && (
                <CountdownPill deadline={deadline} />
              )}
            </>
          )}
          {isFinished && existingPred && (
            <span className={`text-xs font-semibold tabular-nums ${
              existingPred.points_earned > 0 ? 'text-green-600'
              : existingPred.points_earned < 0 ? 'text-red-400'
              : 'text-[#9D9491]'
            }`}>
              {existingPred.points_earned > 0 ? '+' : ''}{existingPred.points_earned}pts
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
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" strokeWidth={2} />
          <div>
            <p className="text-sm font-medium text-orange-700">Cierre próximo</p>
            <p className="text-xs text-orange-500 mt-0.5">
              Los pronósticos de <strong>{upcomingDeadline.phase}</strong> cierran a las{' '}
              {upcomingDeadline.deadline.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}.
              Sin pronóstico = −1pt por partido.
            </p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-[#E8E3DC] overflow-x-auto">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === key
                ? 'text-[#8B1538] border-[#8B1538]'
                : 'text-[#6B6460] border-transparent hover:text-[#1A1614]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Groups */}
      {activeTab === 'groups' && (
        <div className="space-y-3">
          {matches.filter(m => m.phase === 'groups').length === 0 ? (
            <div className="card-p p-10 text-center text-[#9D9491] text-sm">Partidos de grupos no disponibles aún</div>
          ) : GROUPS.map(group => {
            const gm = matches.filter(m => m.phase === 'groups' && m.group_name === group)
            if (gm.length === 0) return null
            const isOpen = expandedGroups.has(group)
            const teams = [...new Set(gm.flatMap(m => [m.home_team, m.away_team]))]
            const groupDeadline = gm[0] ? getJornadaDeadline(gm[0], matches) : null
            const groupLocked = gm.every(m => isMatchLocked(m, matches))

            return (
              <div key={group} className="card-p overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FAFAF9] transition-colors"
                  onClick={() => setExpandedGroups(prev => {
                    const s = new Set(prev)
                    s.has(group) ? s.delete(group) : s.add(group)
                    return s
                  })}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${groupLocked ? 'bg-[#E8E3DC] text-[#9D9491]' : 'bg-[#8B1538] text-white'}`}>
                      {group}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-[#1A1614]">Grupo {group}</div>
                      <div className="text-xs text-[#9D9491]">{teams.slice(0,2).join(' · ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {groupLocked
                      ? <span className="flex items-center gap-1 text-xs text-[#C0B8B4]"><Lock className="w-3 h-3" />Cerrado</span>
                      : groupDeadline && <CountdownPill deadline={groupDeadline} />
                    }
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#9D9491]" /> : <ChevronDown className="w-4 h-4 text-[#9D9491]" />}
                  </div>
                </button>
                {isOpen && gm.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            )
          })}
        </div>
      )}

      {/* Knockout phases */}
      {KNOCKOUT_PHASES.map(phase => activeTab === phase && (
        <div key={phase} className="card-p overflow-hidden">
          {matches.filter(m => m.phase === phase).length === 0 ? (
            <p className="text-sm text-[#9D9491] text-center py-10">Partidos no disponibles aún</p>
          ) : matches.filter(m => m.phase === phase).map(m => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      ))}

      {/* Premios FIFA */}
      {activeTab === 'specials' && (
        <div className="card-p overflow-hidden">
          <div className="card-section flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1A1614] text-sm">Premios FIFA World Cup 2026</h3>
              <p className="text-xs text-[#9D9491] mt-0.5">
                Campeón y Subcampeón: editables hasta el inicio del torneo.
                Premios individuales: hasta que el admin ingrese resultados.
              </p>
            </div>
            {tournamentStarted && (
              <span className="flex items-center gap-1 text-xs text-[#C0B8B4]">
                <Lock className="w-3 h-3" />Campeón bloqueado
              </span>
            )}
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Champion / Runner-up — locked after tournament start */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#6B6460] uppercase tracking-wider">Resultado del torneo</p>
              {[
                { key: 'champion', label: 'Campeón del Mundial', locked: tournamentStarted },
                { key: 'runner_up', label: 'Subcampeón', locked: tournamentStarted },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-[#9D9491] mb-1.5">{field.label}</label>
                  <div className="relative">
                    <select
                      className="w-full h-10 px-3 border border-[#E8E3DC] rounded-xl bg-white text-sm text-[#1A1614] focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none disabled:bg-[#F5F4F2] disabled:text-[#9D9491] disabled:cursor-not-allowed appearance-none"
                      value={special[field.key as keyof typeof special]}
                      onChange={e => setSpecial(p => ({ ...p, [field.key]: e.target.value }))}
                      disabled={field.locked || specialResultsExist}
                    >
                      <option value="">Selecciona un equipo</option>
                      {WC2026_TEAMS.map(t => <option key={t} value={t}>{getFlag(t)} {t}</option>)}
                    </select>
                    {field.locked && <Lock className="absolute right-3 top-3 w-3.5 h-3.5 text-[#C0B8B4]" />}
                  </div>
                </div>
              ))}
              {!tournamentStarted && !specialResultsExist && (
                <p className="text-xs text-[#9D9491] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Se bloquea el 11 jun a las 11:00am (inicio del Mundial)
                </p>
              )}
            </div>

            <div className="border-t border-[#F5F4F2]" />

            {/* Individual awards */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#6B6460] uppercase tracking-wider">Premios individuales</p>
              {[
                { key: 'top_scorer', label: 'adidas Golden Boot', placeholder: 'Máximo goleador del torneo' },
                { key: 'golden_ball', label: 'adidas Golden Ball', placeholder: 'Mejor jugador del torneo' },
                { key: 'golden_glove', label: 'adidas Golden Glove', placeholder: 'Mejor portero del torneo' },
                { key: 'revelation_player', label: 'FIFA Best Young Player Award', placeholder: 'Mejor jugador sub-21' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-[#9D9491] mb-1.5">{field.label}</label>
                  <input
                    className="input-p disabled:bg-[#F5F4F2] disabled:text-[#9D9491] disabled:cursor-not-allowed"
                    placeholder={field.placeholder}
                    value={special[field.key as keyof typeof special]}
                    onChange={e => setSpecial(p => ({ ...p, [field.key]: e.target.value }))}
                    disabled={specialResultsExist}
                  />
                </div>
              ))}
            </div>

            {!specialResultsExist && (
              <button onClick={saveSpecial} disabled={savingSpecial} className="btn-primary">
                {savingSpecial ? 'Guardando...' : savedSpecial ? 'Guardado correctamente' : 'Guardar pronósticos'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
