'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { getFlag } from '@/lib/scoring'
import type { GroupStandings, TeamStat } from './page'
import type { Scorer } from '@/lib/types'

type Tab = 'groups' | 'scorers'

export default function ExploreClient({
  groupStandings,
  scorers,
}: {
  groupStandings: GroupStandings[]
  scorers: Scorer[]
}) {
  const [tab, setTab] = useState<Tab>('groups')
  const [query, setQuery] = useState('')

  const q = query.toLowerCase().trim()

  const filteredGroups = groupStandings.filter(g =>
    !q || g.teams.some(t => t.team.toLowerCase().includes(q))
  )

  const filteredScorers = scorers.filter(s =>
    !q || s.player_name.toLowerCase().includes(q) || s.team.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-5 py-2">
      <h1 className="text-xl font-semibold text-[#1A1614] tracking-tight">Explorar</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9D9491]" strokeWidth={1.75} />
        <input
          type="text"
          placeholder="Buscar selección o jugador…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 border border-[#E8E3DC] rounded-xl bg-white text-sm text-[#1A1614] placeholder:text-[#C0B8B4] focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-[#E8E3DC]">
        {([['groups', 'Grupos'], ['scorers', 'Goleadores']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === key
                ? 'text-[#8B1538] border-[#8B1538]'
                : 'text-[#6B6460] border-transparent hover:text-[#1A1614]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grupos */}
      {tab === 'groups' && (
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <p className="text-sm text-[#9D9491] text-center py-10">Sin resultados</p>
          ) : filteredGroups.map(({ group, teams }) => (
            <div key={group} className="card-p overflow-hidden">
              <div className="card-section flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#8B1538] flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {group}
                </div>
                <h2 className="font-semibold text-[#1A1614] text-sm">Grupo {group}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#F5F4F2]">
                      <th className="text-left px-4 py-2 text-[#9D9491] font-medium w-6">#</th>
                      <th className="text-left px-2 py-2 text-[#9D9491] font-medium">Selección</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">PJ</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">G</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">E</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">P</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">GF</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">GC</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">DG</th>
                      <th className="text-center px-3 py-2 text-[#9D9491] font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t: TeamStat, i: number) => {
                      const highlight = q && t.team.toLowerCase().includes(q)
                      return (
                        <tr
                          key={t.team}
                          className={`border-b border-[#F5F4F2] last:border-0 ${highlight ? 'bg-[#F5EEF1]' : 'hover:bg-[#FAFAF9]'}`}
                        >
                          <td className="px-4 py-2.5 text-[#C0B8B4] font-medium">{i + 1}</td>
                          <td className="px-2 py-2.5 font-medium text-[#1A1614] whitespace-nowrap">
                            {getFlag(t.team)} {t.team}
                          </td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460]">{t.played}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460]">{t.won}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460]">{t.drawn}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460]">{t.lost}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460]">{t.gf}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460]">{t.ga}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460]">
                            {t.gd > 0 ? `+${t.gd}` : t.gd}
                          </td>
                          <td className="text-center px-3 py-2.5 font-bold text-[#1A1614]">{t.pts}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goleadores */}
      {tab === 'scorers' && (
        <div className="card-p overflow-hidden">
          {filteredScorers.length === 0 ? (
            <p className="text-sm text-[#9D9491] text-center py-10">
              {scorers.length === 0
                ? 'Los goleadores aparecerán cuando inicie el torneo'
                : 'Sin resultados'}
            </p>
          ) : (
            <div>
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-0 px-4 py-2 border-b border-[#F5F4F2] text-[10px] font-medium text-[#9D9491] uppercase tracking-wider">
                <span className="w-6 text-center">#</span>
                <span className="pl-3">Jugador</span>
                <span className="w-12 text-center">Goles</span>
                <span className="w-12 text-center">Asist.</span>
                <span className="w-12 text-center">Pen.</span>
              </div>
              {filteredScorers.map((s, i) => {
                const highlight = q && (s.player_name.toLowerCase().includes(q) || s.team.toLowerCase().includes(q))
                return (
                  <div
                    key={s.id}
                    className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-0 px-4 py-3 border-b border-[#F5F4F2] last:border-0 ${highlight ? 'bg-[#F5EEF1]' : 'hover:bg-[#FAFAF9]'}`}
                  >
                    <span className="w-6 text-center text-xs text-[#C0B8B4] font-medium">{i + 1}</span>
                    <div className="pl-3">
                      <div className="text-sm font-medium text-[#1A1614]">{s.player_name}</div>
                      <div className="text-xs text-[#9D9491] mt-0.5">{getFlag(s.team)} {s.team}</div>
                    </div>
                    <div className="w-12 text-center">
                      <span className="text-sm font-bold text-[#8B1538]">{s.goals}</span>
                    </div>
                    <div className="w-12 text-center text-xs text-[#6B6460]">{s.assists}</div>
                    <div className="w-12 text-center text-xs text-[#9D9491]">{s.penalties}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
