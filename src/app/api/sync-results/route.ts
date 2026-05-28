import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcMatchPoints } from '@/lib/scoring'
import type { ScoringConfig } from '@/lib/types'

// football-data.org team names → Spanish names used in our DB
const TEAM_MAP: Record<string, string> = {
  'Mexico': 'México',
  'South Africa': 'Sudáfrica',
  'Korea Republic': 'Corea del Sur',
  'Czechia': 'República Checa',
  'Czech Republic': 'República Checa',
  'Canada': 'Canadá',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  'Qatar': 'Catar',
  'Switzerland': 'Suiza',
  'Brazil': 'Brasil',
  'Morocco': 'Marruecos',
  'Haiti': 'Haití',
  'Scotland': 'Escocia',
  'USA': 'Estados Unidos',
  'United States': 'Estados Unidos',
  'Paraguay': 'Paraguay',
  'Australia': 'Australia',
  'Turkey': 'Turquía',
  'Türkiye': 'Turquía',
  'Germany': 'Alemania',
  'Curaçao': 'Curazao',
  "Côte d'Ivoire": 'Costa de Marfil',
  'Ivory Coast': 'Costa de Marfil',
  'Ecuador': 'Ecuador',
  'Netherlands': 'Países Bajos',
  'Japan': 'Japón',
  'Sweden': 'Suecia',
  'Tunisia': 'Túnez',
  'Belgium': 'Bélgica',
  'Egypt': 'Egipto',
  'Iran': 'Irán',
  'New Zealand': 'Nueva Zelanda',
  'Spain': 'España',
  'Cape Verde': 'Cabo Verde',
  'Saudi Arabia': 'Arabia Saudita',
  'Uruguay': 'Uruguay',
  'France': 'Francia',
  'Senegal': 'Senegal',
  'Iraq': 'Irak',
  'Norway': 'Noruega',
  'Argentina': 'Argentina',
  'Algeria': 'Argelia',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Portugal': 'Portugal',
  'DR Congo': 'RD Congo',
  'Congo DR': 'RD Congo',
  'Uzbekistan': 'Uzbekistán',
  'Colombia': 'Colombia',
  'England': 'Inglaterra',
  'Croatia': 'Croacia',
  'Ghana': 'Ghana',
  'Panama': 'Panamá',
}

const STATUS_MAP: Record<string, string> = {
  'SCHEDULED': 'pending',
  'TIMED': 'pending',
  'IN_PLAY': 'active',
  'PAUSED': 'active',
  'LIVE': 'active',
  'FINISHED': 'finished',
  'AWARDED': 'finished',
}

export async function GET(request: Request) {
  const supabase = await createClient()

  // Allow Vercel cron (CRON_SECRET) or authenticated admin
  const authHeader = request.headers.get('authorization')
  const isVercelCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY not set' }, { status: 500 })

  // Fetch WC 2026 matches from football-data.org
  const apiRes = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': apiKey },
    next: { revalidate: 0 },
  })

  if (!apiRes.ok) {
    const text = await apiRes.text()
    return NextResponse.json({ error: `API error ${apiRes.status}`, detail: text }, { status: 502 })
  }

  const { matches: apiMatches } = await apiRes.json()

  const [{ data: dbMatches }, { data: config }] = await Promise.all([
    supabase.from('matches').select('*'),
    supabase.from('scoring_config').select('*').single(),
  ])

  let matchesUpdated = 0
  let predictionsUpdated = 0
  const errors: string[] = []

  for (const apiMatch of apiMatches ?? []) {
    const newStatus = STATUS_MAP[apiMatch.status]
    if (!newStatus) continue

    const homeSpanish = TEAM_MAP[apiMatch.homeTeam?.name]
    const awaySpanish = TEAM_MAP[apiMatch.awayTeam?.name]

    if (!homeSpanish || !awaySpanish) {
      if (apiMatch.status !== 'SCHEDULED' && apiMatch.status !== 'TIMED') {
        errors.push(`No mapping: ${apiMatch.homeTeam?.name} vs ${apiMatch.awayTeam?.name}`)
      }
      continue
    }

    const dbMatch = (dbMatches || []).find(m =>
      m.home_team === homeSpanish && m.away_team === awaySpanish
    )
    if (!dbMatch) continue

    const homeScore = apiMatch.score?.fullTime?.home ?? null
    const awayScore = apiMatch.score?.fullTime?.away ?? null

    // Skip if nothing changed
    if (
      dbMatch.status === newStatus &&
      dbMatch.home_score === homeScore &&
      dbMatch.away_score === awayScore
    ) continue

    await supabase.from('matches').update({
      status: newStatus,
      home_score: homeScore,
      away_score: awayScore,
    }).eq('id', dbMatch.id)

    matchesUpdated++

    // Recalculate points only for finished matches
    if (newStatus === 'finished' && homeScore !== null && awayScore !== null && config) {
      const { data: preds } = await supabase.from('predictions').select('*').eq('match_id', dbMatch.id)
      for (const pred of preds ?? []) {
        const pts = pred.predicted_home === -1
          ? -1
          : calcMatchPoints(pred.predicted_home, pred.predicted_away, homeScore, awayScore, config as ScoringConfig)
        await supabase.from('predictions').update({ points_earned: pts }).eq('id', pred.id)
        predictionsUpdated++
      }
    }
  }

  return NextResponse.json({
    ok: true,
    matchesUpdated,
    predictionsUpdated,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  })
}
