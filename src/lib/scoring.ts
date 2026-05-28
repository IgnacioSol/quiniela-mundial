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

export const TEAM_FLAGS: Record<string, string> = {
  'México': '🇲🇽', 'Sudáfrica': '🇿🇦', 'Corea del Sur': '🇰🇷', 'República Checa': '🇨🇿',
  'Canadá': '🇨🇦', 'Bosnia y Herzegovina': '🇧🇦', 'Catar': '🇶🇦', 'Suiza': '🇨🇭',
  'Brasil': '🇧🇷', 'Marruecos': '🇲🇦', 'Haití': '🇭🇹', 'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Estados Unidos': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Turquía': '🇹🇷',
  'Alemania': '🇩🇪', 'Curazao': '🇨🇼', 'Costa de Marfil': '🇨🇮', 'Ecuador': '🇪🇨',
  'Países Bajos': '🇳🇱', 'Japón': '🇯🇵', 'Suecia': '🇸🇪', 'Túnez': '🇹🇳',
  'Bélgica': '🇧🇪', 'Egipto': '🇪🇬', 'Irán': '🇮🇷', 'Nueva Zelanda': '🇳🇿',
  'España': '🇪🇸', 'Cabo Verde': '🇨🇻', 'Arabia Saudita': '🇸🇦', 'Uruguay': '🇺🇾',
  'Francia': '🇫🇷', 'Senegal': '🇸🇳', 'Irak': '🇮🇶', 'Noruega': '🇳🇴',
  'Argentina': '🇦🇷', 'Argelia': '🇩🇿', 'Austria': '🇦🇹', 'Jordania': '🇯🇴',
  'Portugal': '🇵🇹', 'RD Congo': '🇨🇩', 'Uzbekistán': '🇺🇿', 'Colombia': '🇨🇴',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croacia': '🇭🇷', 'Ghana': '🇬🇭', 'Panamá': '🇵🇦',
}

export function getFlag(team: string): string {
  return TEAM_FLAGS[team] || '🏳️'
}

export const WC2026_TEAMS = [
  // Grupo A
  'México', 'Sudáfrica', 'Corea del Sur', 'República Checa',
  // Grupo B
  'Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza',
  // Grupo C
  'Brasil', 'Marruecos', 'Haití', 'Escocia',
  // Grupo D
  'Estados Unidos', 'Paraguay', 'Australia', 'Turquía',
  // Grupo E
  'Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador',
  // Grupo F
  'Países Bajos', 'Japón', 'Suecia', 'Túnez',
  // Grupo G
  'Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda',
  // Grupo H
  'España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay',
  // Grupo I
  'Francia', 'Senegal', 'Irak', 'Noruega',
  // Grupo J
  'Argentina', 'Argelia', 'Austria', 'Jordania',
  // Grupo K
  'Portugal', 'RD Congo', 'Uzbekistán', 'Colombia',
  // Grupo L
  'Inglaterra', 'Croacia', 'Ghana', 'Panamá',
]
