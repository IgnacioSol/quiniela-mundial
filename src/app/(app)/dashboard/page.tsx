import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PHASE_LABELS } from '@/lib/scoring'
import type { Profile, Match, Prediction, SpecialPrediction } from '@/lib/types'

type UserScore = Profile & { total_points: number; match_points: number; special_points: number }

async function getLeaderboard(supabase: Awaited<ReturnType<typeof createClient>>): Promise<UserScore[]> {
  const [{ data: profiles }, { data: predictions }, { data: specials }] = await Promise.all([
    supabase.from('profiles').select('*').order('name'),
    supabase.from('predictions').select('*'),
    supabase.from('special_predictions').select('*'),
  ])

  return (profiles || []).map(profile => {
    const matchPoints = (predictions || [])
      .filter(p => p.user_id === profile.id)
      .reduce((sum, p) => sum + (p.points_earned || 0), 0)

    const sp = (specials || []).find(s => s.user_id === profile.id)
    const specialPoints = sp
      ? (sp.champion_points + sp.runner_up_points + sp.top_scorer_points +
         sp.revelation_player_points + sp.revelation_team_points)
      : 0

    return { ...profile, match_points: matchPoints, special_points: specialPoints, total_points: matchPoints + specialPoints }
  }).sort((a, b) => b.total_points - a.total_points)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [leaderboard, { data: upcomingMatches }, { data: config }] = await Promise.all([
    getLeaderboard(supabase),
    supabase.from('matches')
      .select('*')
      .eq('status', 'pending')
      .order('match_date', { ascending: true })
      .limit(5),
    supabase.from('scoring_config').select('*').single(),
  ])

  const currentUserRank = leaderboard.findIndex(u => u.id === user?.id) + 1
  const currentUser = leaderboard.find(u => u.id === user?.id)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">#{currentUserRank || '-'}</div>
            <div className="text-sm text-muted-foreground mt-1">Tu posición</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{currentUser?.total_points ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Tus puntos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{leaderboard.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Participantes</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Posiciones</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aún no hay participantes</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((user, i) => (
                  <div key={user.id} className={`flex items-center justify-between py-2 px-3 rounded-md ${user.id === user?.id ? 'bg-muted' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm w-6 text-center">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <div>
                        <span className="font-medium text-sm">{user.name}</span>
                        <div className="flex gap-1 mt-0.5">
                          <Badge variant="outline" className="text-xs h-4">⚽ {user.match_points}pts</Badge>
                          <Badge variant="outline" className="text-xs h-4">★ {user.special_points}pts</Badge>
                        </div>
                      </div>
                    </div>
                    <span className="font-bold">{user.total_points}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Partidos</CardTitle>
          </CardHeader>
          <CardContent>
            {!upcomingMatches?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay partidos próximos cargados</p>
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((match: Match) => (
                  <div key={match.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm flex-1 text-right">{match.home_team}</span>
                      <span className="text-xs text-muted-foreground px-2">vs</span>
                      <span className="font-medium text-sm flex-1">{match.away_team}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="secondary" className="text-xs">{PHASE_LABELS[match.phase]}</Badge>
                      {match.match_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(match.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Sistema de Puntuación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Resultado exacto', value: `${config.exact_score_points} pts` },
                { label: 'Ganador/Empate', value: `${config.correct_winner_points} pt` },
                { label: 'Campeón', value: `${config.champion_points} pts` },
                { label: 'Subcampeón', value: `${config.runner_up_points} pts` },
                { label: 'Goleador', value: `${config.top_scorer_points} pts` },
                { label: 'Jug. Revelación', value: `${config.revelation_player_points} pts` },
                { label: 'Sel. Revelación', value: `${config.revelation_team_points} pts` },
              ].map(item => (
                <div key={item.label} className="text-center bg-muted rounded-md p-2">
                  <div className="font-bold text-lg">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
