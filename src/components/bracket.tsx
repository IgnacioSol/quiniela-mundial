import { getFlag } from '@/lib/scoring'
import type { Match } from '@/lib/types'

type BracketMatch = Match & { prediction?: { predicted_home: number; predicted_away: number; points_earned: number } }

function BracketTeam({ team, score, isWinner }: { team?: string; score?: number | null; isWinner?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${isWinner ? 'bg-[#8B1538] text-white' : 'bg-white'}`}>
      <span className="text-base">{team ? getFlag(team) : '🏳️'}</span>
      <span className={`text-xs font-semibold flex-1 truncate ${isWinner ? 'text-white' : 'text-[#1a0510]'}`}>
        {team || 'Por definir'}
      </span>
      {score !== null && score !== undefined && (
        <span className={`text-sm font-bold ${isWinner ? 'text-yellow-300' : 'text-[#8B1538]'}`}>{score}</span>
      )}
    </div>
  )
}

function BracketCard({ match, label }: { match?: BracketMatch; label?: string }) {
  const homeWins = match?.status === 'finished' && match.home_score !== null && match.away_score !== null
    && match.home_score > match.away_score
  const awayWins = match?.status === 'finished' && match.home_score !== null && match.away_score !== null
    && match.away_score > match.home_score

  return (
    <div className="flex flex-col w-44">
      {label && <div className="text-xs text-center text-[#8B1538] font-bold mb-1 uppercase tracking-wider">{label}</div>}
      <div className="rounded-lg overflow-hidden border-2 border-[#e8d5c0] shadow-md">
        <BracketTeam team={match?.home_team} score={match?.home_score} isWinner={homeWins} />
        <div className="h-px bg-[#e8d5c0]" />
        <BracketTeam team={match?.away_team} score={match?.away_score} isWinner={awayWins} />
      </div>
      {match?.match_date && (
        <div className="text-xs text-center text-muted-foreground mt-1">
          {new Date(match.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
        </div>
      )}
    </div>
  )
}

type Props = { matches: Match[] }

export default function Bracket({ matches }: Props) {
  const r32 = matches.filter(m => m.phase === 'round_of_16').slice(0, 16)
  const r16 = matches.filter(m => m.phase === 'quarterfinals').slice(0, 8)
  const qf  = matches.filter(m => m.phase === 'semifinals').slice(0, 4)
  const sf  = matches.filter(m => m.phase === 'final').slice(0, 2)
  const final = matches.find(m => m.phase === 'final' && !sf.includes(m as Match))
    || matches.filter(m => m.phase === 'final')[sf.length]

  const hasAnyData = r32.length > 0 || r16.length > 0 || qf.length > 0 || sf.length > 0

  if (!hasAnyData) {
    return (
      <div className="card-mundial p-12 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-muted-foreground font-medium">Las llaves estarán disponibles cuando termine la fase de grupos</p>
        <p className="text-xs text-muted-foreground mt-2">A partir de julio 2026</p>
      </div>
    )
  }

  // Determine which rounds to show
  const rounds = [
    { label: 'Ronda de 32', matches: r32, show: r32.length > 0 },
    { label: 'Octavos', matches: r16, show: r16.length > 0 },
    { label: 'Cuartos', matches: qf, show: qf.length > 0 },
    { label: 'Semis', matches: sf, show: sf.length > 0 },
  ].filter(r => r.show)

  return (
    <div className="space-y-8">
      {/* Bracket horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max px-4 py-4 items-center">
          {rounds.map((round, ri) => (
            <div key={round.label} className="flex flex-col gap-4">
              <div className="text-center">
                <span className="bg-[#8B1538] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {round.label}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {round.matches.map((match, mi) => (
                  <BracketCard key={match.id} match={match as BracketMatch} />
                ))}
              </div>
            </div>
          ))}

          {/* Final */}
          {(sf.length > 0 || final) && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <span className="bg-[#C9A84C] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  🏆 Final
                </span>
              </div>
              <BracketCard match={final as BracketMatch} label="CAMPEÓN" />
            </div>
          )}
        </div>
      </div>

      {/* Cards por ronda (vista alternativa para móvil) */}
      <div className="md:hidden space-y-6">
        {rounds.map(round => (
          <div key={round.label}>
            <h3 className="font-bold text-[#8B1538] mb-3 border-b border-[#e8d5c0] pb-2">{round.label}</h3>
            <div className="space-y-3">
              {round.matches.map(match => {
                const homeWins = match.status === 'finished' && match.home_score! > match.away_score!
                const awayWins = match.status === 'finished' && match.away_score! > match.home_score!
                return (
                  <div key={match.id} className="card-mundial p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex-1 text-right text-sm font-semibold ${homeWins ? 'text-[#8B1538]' : ''}`}>
                        {getFlag(match.home_team)} {match.home_team || 'Por definir'}
                      </span>
                      <span className="font-bold text-[#8B1538] px-2">
                        {match.status === 'finished' ? `${match.home_score}–${match.away_score}` : 'vs'}
                      </span>
                      <span className={`flex-1 text-sm font-semibold ${awayWins ? 'text-[#8B1538]' : ''}`}>
                        {getFlag(match.away_team)} {match.away_team || 'Por definir'}
                      </span>
                    </div>
                    {match.match_date && (
                      <div className="text-xs text-center text-muted-foreground mt-1">
                        {new Date(match.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
