import { getFlag } from '@/lib/scoring'
import type { Match } from '@/lib/types'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

type TeamStat = {
  name: string; pj: number; pg: number; pe: number; pp: number
  gf: number; gc: number; gd: number; pts: number
}

function calcStandings(matches: Match[], group: string): TeamStat[] {
  const gm = matches.filter(m => m.group_name === group && m.status === 'finished')
  const teams: Record<string, TeamStat> = {}

  // Init teams from all group matches (even unplayed ones)
  const allGroupMatches = matches.filter(m => m.group_name === group)
  allGroupMatches.forEach(m => {
    if (!teams[m.home_team]) teams[m.home_team] = { name: m.home_team, pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,gd:0,pts:0 }
    if (!teams[m.away_team]) teams[m.away_team] = { name: m.away_team, pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,gd:0,pts:0 }
  })

  gm.forEach(m => {
    const h = m.home_score!; const a = m.away_score!
    teams[m.home_team].pj++; teams[m.away_team].pj++
    teams[m.home_team].gf += h; teams[m.home_team].gc += a
    teams[m.away_team].gf += a; teams[m.away_team].gc += h
    if (h > a) { teams[m.home_team].pg++; teams[m.away_team].pp++ }
    else if (h < a) { teams[m.away_team].pg++; teams[m.home_team].pp++ }
    else { teams[m.home_team].pe++; teams[m.away_team].pe++ }
  })

  return Object.values(teams).map(t => ({
    ...t, gd: t.gf - t.gc, pts: t.pg * 3 + t.pe
  })).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

export default function GroupStandings({ matches }: { matches: Match[] }) {
  const groupMatches = matches.filter(m => m.phase === 'groups')
  const activeGroups = GROUPS.filter(g => groupMatches.some(m => m.group_name === g))

  if (activeGroups.length === 0) {
    return (
      <div className="card-mundial p-8 text-center text-muted-foreground">
        Las tablas de grupos aparecerán cuando empiece el torneo
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activeGroups.map(group => {
        const standings = calcStandings(groupMatches, group)
        return (
          <div key={group} className="card-mundial overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#8B1538]">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs">{group}</div>
              <span className="text-white font-bold text-sm">Grupo {group}</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#f3e8d0] text-[#8B1538]">
                  <th className="text-left px-3 py-1.5 font-bold">Equipo</th>
                  <th className="text-center px-1 py-1.5 font-bold">PJ</th>
                  <th className="text-center px-1 py-1.5 font-bold">PG</th>
                  <th className="text-center px-1 py-1.5 font-bold">PE</th>
                  <th className="text-center px-1 py-1.5 font-bold">PP</th>
                  <th className="text-center px-1 py-1.5 font-bold">GD</th>
                  <th className="text-center px-1 py-1.5 font-bold text-[#8B1538]">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8d5c0]">
                {standings.map((t, i) => (
                  <tr key={t.name} className={i < 2 ? 'bg-green-50' : ''}>
                    <td className="px-3 py-2 font-medium flex items-center gap-1">
                      {i < 2 && <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>}
                      {i >= 2 && <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"></span>}
                      <span>{getFlag(t.name)}</span>
                      <span className="truncate max-w-[100px]">{t.name}</span>
                    </td>
                    <td className="text-center px-1 py-2 text-muted-foreground">{t.pj}</td>
                    <td className="text-center px-1 py-2">{t.pg}</td>
                    <td className="text-center px-1 py-2">{t.pe}</td>
                    <td className="text-center px-1 py-2">{t.pp}</td>
                    <td className="text-center px-1 py-2">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                    <td className="text-center px-1 py-2 font-bold text-[#8B1538]">{t.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-1.5 bg-[#f8f4f0] flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Clasifican</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
