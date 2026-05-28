export type PhaseType = 'groups' | 'round_of_16' | 'quarterfinals' | 'semifinals' | 'final'
export type MatchStatus = 'pending' | 'active' | 'finished'

export interface Profile {
  id: string
  name: string
  email: string
  is_admin: boolean
  quota_amount: number
  quota_paid: boolean
  created_at: string
}

export interface Match {
  id: number
  home_team: string
  away_team: string
  phase: PhaseType
  match_date: string | null
  home_score: number | null
  away_score: number | null
  status: MatchStatus
  group_name: string | null
  created_at: string
}

export interface Prediction {
  id: number
  user_id: string
  match_id: number
  predicted_home: number
  predicted_away: number
  points_earned: number
  created_at: string
}

export interface SpecialPrediction {
  id: number
  user_id: string
  champion: string | null
  runner_up: string | null
  top_scorer: string | null
  revelation_player: string | null
  revelation_team: string | null
  champion_points: number
  runner_up_points: number
  top_scorer_points: number
  revelation_player_points: number
  revelation_team_points: number
  created_at: string
}

export interface SpecialResults {
  id: number
  champion: string | null
  runner_up: string | null
  top_scorer: string | null
  revelation_player: string | null
  revelation_team: string | null
  updated_at: string
}

export interface ScoringConfig {
  id: number
  exact_score_points: number
  correct_winner_points: number
  champion_points: number
  runner_up_points: number
  top_scorer_points: number
  revelation_player_points: number
  revelation_team_points: number
}

export interface PhaseDeadline {
  phase: PhaseType
  deadline: string | null
  is_locked: boolean
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      matches: {
        Row: Match
        Insert: Omit<Match, 'id' | 'created_at'>
        Update: Partial<Omit<Match, 'id' | 'created_at'>>
        Relationships: []
      }
      predictions: {
        Row: Prediction
        Insert: Omit<Prediction, 'id' | 'created_at'>
        Update: Partial<Omit<Prediction, 'id' | 'created_at'>>
        Relationships: []
      }
      special_predictions: {
        Row: SpecialPrediction
        Insert: Omit<SpecialPrediction, 'id' | 'created_at'>
        Update: Partial<Omit<SpecialPrediction, 'id' | 'created_at'>>
        Relationships: []
      }
      special_results: {
        Row: SpecialResults
        Insert: Omit<SpecialResults, 'id' | 'updated_at'>
        Update: Partial<Omit<SpecialResults, 'id'>>
        Relationships: []
      }
      scoring_config: {
        Row: ScoringConfig
        Insert: Omit<ScoringConfig, 'id'>
        Update: Partial<Omit<ScoringConfig, 'id'>>
        Relationships: []
      }
      phase_deadlines: {
        Row: PhaseDeadline
        Insert: PhaseDeadline
        Update: Partial<PhaseDeadline>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
