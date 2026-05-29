'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { getFlag } from '@/lib/scoring'
import type { GroupStandings, TeamStat } from './page'
import type { Scorer } from '@/lib/types'

type Tab = 'groups' | 'scorers'

const TEAM_CODES: Record<string, string> = {
  'México': 'mx', 'Canadá': 'ca', 'Estados Unidos': 'us',
  'Argentina': 'ar', 'Brasil': 'br', 'Uruguay': 'uy',
  'Colombia': 'co', 'Ecuador': 'ec', 'Paraguay': 'py',
  'Francia': 'fr', 'España': 'es', 'Alemania': 'de',
  'Inglaterra': 'gb-eng', 'Portugal': 'pt', 'Países Bajos': 'nl',
  'Bélgica': 'be', 'Suiza': 'ch', 'Austria': 'at',
  'Croacia': 'hr', 'Suecia': 'se', 'Noruega': 'no',
  'Escocia': 'gb-sct', 'Japón': 'jp', 'Corea del Sur': 'kr',
  'Australia': 'au', 'Irán': 'ir', 'Arabia Saudita': 'sa',
  'Jordania': 'jo', 'Irak': 'iq', 'Uzbekistán': 'uz',
  'Catar': 'qa', 'Turquía': 'tr', 'República Checa': 'cz',
  'Bosnia y Herzegovina': 'ba', 'Nueva Zelanda': 'nz',
  'Marruecos': 'ma', 'Senegal': 'sn', 'Ghana': 'gh',
  'Costa de Marfil': 'ci', 'Egipto': 'eg', 'Túnez': 'tn',
  'Argelia': 'dz', 'RD Congo': 'cd', 'Sudáfrica': 'za',
  'Cabo Verde': 'cv', 'Haití': 'ht', 'Panamá': 'pa',
  'Curazao': 'cw', 'Sudán del Sur': 'ss',
}

function Flag({ team, size = 22 }: { team: string; size?: number }) {
  const code = TEAM_CODES[team]
  if (!code) return <span className="text-base leading-none">{getFlag(team)}</span>
  return (
    <Image
      src={`https://flagcdn.com/w40/${code}.png`}
      width={size}
      height={Math.round(size * 2 / 3)}
      alt={team}
      className="rounded-[2px] object-cover shrink-0"
      unoptimized
    />
  )
}

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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C0B8B4]" strokeWidth={1.75} />
        <input
          type="text"
          placeholder="Buscar selección o jugador…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 border border-[#E8E3DC] rounded-xl bg-white text-sm text-[#1A1614] placeholder:text-[#C0B8B4] focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 outline-none transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#E8E3DC]">
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
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <p className="text-sm text-[#9D9491] text-center py-10">Sin resultados</p>
          ) : filteredGroups.map(({ group, teams }) => (
            <div key={group} className="card-p overflow-hidden">
              <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#8B1538] uppercase tracking-widest">Grupo {group}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[320px]">
                  <thead>
                    <tr className="border-y border-[#F5F4F2] bg-[#FAFAF9]">
                      <th className="text-left px-4 py-2 text-[#9D9491] font-medium w-7">#</th>
                      <th className="text-left px-2 py-2 text-[#9D9491] font-medium">Selección</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">PJ</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium hidden sm:table-cell">G</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium hidden sm:table-cell">E</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium hidden sm:table-cell">P</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium hidden sm:table-cell">GF</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium hidden sm:table-cell">GC</th>
                      <th className="text-center px-2 py-2 text-[#9D9491] font-medium">DG</th>
                      <th className="text-center px-4 py-2 text-[#9D9491] font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t: TeamStat, i: number) => {
                      const highlight = q && t.team.toLowerCase().includes(q)
                      return (
                        <tr
                          key={t.team}
                          className={`border-b border-[#F5F4F2] last:border-0 transition-colors ${
                            highlight ? 'bg-[#F5EEF1]' : 'hover:bg-[#FAFAF9]'
                          }`}
                        >
                          <td className="px-4 py-2.5 text-[#C0B8B4] font-medium">{i + 1}</td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2">
                              <Flag team={t.team} size={20} />
                              <span className="font-medium text-[#1A1614] whitespace-nowrap">{t.team}</span>
                            </div>
                          </td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460]">{t.played}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460] hidden sm:table-cell">{t.won}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460] hidden sm:table-cell">{t.drawn}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460] hidden sm:table-cell">{t.lost}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460] hidden sm:table-cell">{t.gf}</td>
                          <td className="text-center px-2 py-2.5 text-[#6B6460] hidden sm:table-cell">{t.ga}</td>
                          <td className={`text-center px-2 py-2.5 font-medium ${
                            t.gd > 0 ? 'text-green-600' : t.gd < 0 ? 'text-red-400' : 'text-[#9D9491]'
                          }`}>
                            {t.gd > 0 ? `+${t.gd}` : t.gd}
                          </td>
                          <td className="text-center px-4 py-2.5 font-bold text-[#1A1614]">{t.pts}</td>
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
          {scorers.length === 0 ? (
            <div className="py-14 text-center space-y-1.5">
              <p className="text-sm font-medium text-[#1A1614]">El torneo aún no ha comenzado</p>
              <p className="text-xs text-[#9D9491]">Los goleadores aparecerán a partir del 11 de junio</p>
            </div>
          ) : filteredScorers.length === 0 ? (
            <p className="text-sm text-[#9D9491] text-center py-10">Sin resultados</p>
          ) : (
            <div>
              {filteredScorers.map((s, i) => {
                const highlight = q && (s.player_name.toLowerCase().includes(q) || s.team.toLowerCase().includes(q))
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 px-5 py-3.5 border-b border-[#F5F4F2] last:border-0 transition-colors ${
                      highlight ? 'bg-[#F5EEF1]' : 'hover:bg-[#FAFAF9]'
                    }`}
                  >
                    {/* Position */}
                    <span className="w-5 text-center text-sm text-[#C0B8B4] font-semibold shrink-0">{i + 1}</span>

                    {/* Flag */}
                    <div className="shrink-0">
                      <Flag team={s.team} size={28} />
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#1A1614] truncate">{s.player_name}</div>
                      <div className="text-xs text-[#9D9491] mt-0.5 truncate">{s.team}</div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#8B1538] leading-none">{s.goals}</div>
                        <div className="text-[10px] text-[#9D9491] mt-0.5">goles</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-[#6B6460] leading-none">{s.assists}</div>
                        <div className="text-[10px] text-[#9D9491] mt-0.5">asist.</div>
                      </div>
                    </div>
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
