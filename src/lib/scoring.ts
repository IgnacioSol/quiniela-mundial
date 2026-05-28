import type { ScoringConfig } from './types'

export function calcMatchPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  config: ScoringConfig
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return config.exact_score_points
  }
  const predictedResult = Math.sign(predictedHome - predictedAway)
  const actualResult = Math.sign(actualHome - actualAway)
  if (predictedResult === actualResult) {
    return config.correct_winner_points
  }
  return 0
}

export const PHASE_LABELS: Record<string, string> = {
  groups: 'Fase de Grupos',
  round_of_16: 'Octavos de Final',
  quarterfinals: 'Cuartos de Final',
  semifinals: 'Semifinales',
  final: 'Final',
}

export const WC2026_TEAMS = [
  'Argentina', 'Brasil', 'Francia', 'España', 'Inglaterra', 'Alemania',
  'Portugal', 'Países Bajos', 'Bélgica', 'Italia', 'Uruguay', 'Colombia',
  'México', 'Estados Unidos', 'Canadá', 'Marruecos', 'Senegal', 'Nigeria',
  'Costa de Marfil', 'Ghana', 'Egipto', 'Camerún', 'Sudáfrica', 'Túnez',
  'Japón', 'Corea del Sur', 'Arabia Saudita', 'Irán', 'Australia', 'Qatar',
  'Indonesia', 'Uzbekistán', 'Chile', 'Ecuador', 'Paraguay', 'Perú',
  'Venezuela', 'Bolivia', 'Costa Rica', 'Honduras', 'Panamá', 'Jamaica',
  'Croacia', 'Polonia', 'Serbia', 'Suiza', 'Dinamarca', 'Austria',
]
