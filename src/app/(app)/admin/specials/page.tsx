import { createClient } from '@/lib/supabase/server'
import SpecialsClient from './specials-client'

export default async function AdminSpecialsPage() {
  const supabase = await createClient()
  const [{ data: specialRes }, { data: config }, { data: specialPreds }, { data: profiles }] = await Promise.all([
    supabase.from('special_results').select('*').eq('id', 1).single(),
    supabase.from('scoring_config').select('*').single(),
    supabase.from('special_predictions').select('*'),
    supabase.from('profiles').select('*').order('name'),
  ])
  return <SpecialsClient
    specialResults={specialRes}
    config={config}
    specialPredictions={specialPreds || []}
    profiles={profiles || []}
  />
}
