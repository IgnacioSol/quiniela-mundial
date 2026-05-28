import { createClient } from '@/lib/supabase/server'
import MatchesClient from './matches-client'

export default async function AdminMatchesPage() {
  const supabase = await createClient()
  const [{ data: matches }, { data: deadlines }] = await Promise.all([
    supabase.from('matches').select('*').order('phase').order('match_date', { ascending: true }),
    supabase.from('phase_deadlines').select('*'),
  ])

  return <MatchesClient matches={matches || []} deadlines={deadlines || []} />
}
