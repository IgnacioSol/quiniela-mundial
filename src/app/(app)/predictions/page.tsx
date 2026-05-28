import { createClient } from '@/lib/supabase/server'
import PredictionsClient from './predictions-client'

export default async function PredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: matches }, { data: predictions }, { data: deadlines }, { data: specialPred }, { data: specialRes }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user!.id),
    supabase.from('phase_deadlines').select('*'),
    supabase.from('special_predictions').select('*').eq('user_id', user!.id).single(),
    supabase.from('special_results').select('*').eq('id', 1).single(),
  ])

  return (
    <PredictionsClient
      matches={matches || []}
      predictions={predictions || []}
      deadlines={deadlines || []}
      specialPrediction={specialPred || null}
      specialResultsExist={!!(specialRes?.champion || specialRes?.top_scorer)}
      userId={user!.id}
    />
  )
}
