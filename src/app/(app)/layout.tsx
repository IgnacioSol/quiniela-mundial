import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/navbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // Count pending predictions (unlocked phases, unfinished matches without prediction)
  const [{ data: pendingMatches }, { data: myPredictions }, { data: deadlines }] = await Promise.all([
    supabase.from('matches').select('id, phase').eq('status', 'pending'),
    supabase.from('predictions').select('match_id').eq('user_id', user.id),
    supabase.from('phase_deadlines').select('*'),
  ])

  const predictedIds = new Set((myPredictions || []).map((p: any) => p.match_id))
  const pendingCount = (pendingMatches || []).filter((m: any) => {
    const dl = (deadlines || []).find((d: any) => d.phase === m.phase)
    const locked = dl?.is_locked || (dl?.deadline && new Date(dl.deadline) < new Date())
    return !locked && !predictedIds.has(m.id)
  }).length

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} pendingCount={pendingCount} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
