import { createClient } from '@/lib/supabase/server'
import ExploreClient from './explore-client'
import type { Match } from '@/lib/types'

export type TeamStat = {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}

export type GroupStandings = { group: string; teams: TeamStat[] }

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function buildStandings(matches: Match[]): GroupStandings[] {
  const result: GroupStandings[] = []

  for (const group of GROUPS) {
    const gm = matches.filter(m => m.group_name === group)
    if (gm.length === 0) continue

    const statsMap = new Map<string, TeamStat>()
    const ensureTeam = (team: string) => {
      if (!statsMap.has(team)) statsMap.set(team, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 })
      return statsMap.get(team)!
    }

    for (const m of gm) {
      const home = ensureTeam(m.home_team)
      const away = ensureTeam(m.away_team)
      if (m.status === 'finished' && m.home_score !== null && m.away_score !== null) {
        home.played++; away.played++
        home.gf += m.home_score; home.ga += m.away_score
        away.gf += m.away_score; away.ga += m.home_score
        if (m.home_score > m.away_score) { home.won++; away.lost++; home.pts += 3 }
        else if (m.home_score === m.away_score) { home.drawn++; away.drawn++; home.pts++; away.pts++ }
        else { home.lost++; away.won++; away.pts += 3 }
        home.gd = home.gf - home.ga
        away.gd = away.gf - away.ga
      }
    }

    const teams = [...statsMap.values()].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    result.push({ group, teams })
  }

  return result
}

export default async function ExplorePage() {
  const supabase = await createClient()

  const [{ data: matches }, { data: scorers }] = await Promise.all([
    supabase.from('matches').select('*').eq('phase', 'groups').order('match_date', { ascending: true }),
    supabase.from('scorers').select('*').order('goals', { ascending: false }),
  ])

  const groupStandings = buildStandings((matches || []) as Match[])

  return (
    <ExploreClient
      groupStandings={groupStandings}
      scorers={scorers || []}
    />
  )
}
