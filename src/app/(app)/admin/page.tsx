import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import SyncButton from './sync-button'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: userCount }, { count: matchCount }, { count: finishedCount }, { count: pendingCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#8B1538]">📊 Panel de Administración</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Participantes', value: userCount ?? 0, icon: '👥' },
          { label: 'Partidos totales', value: matchCount ?? 0, icon: '🏟️' },
          { label: 'Partidos jugados', value: finishedCount ?? 0, icon: '✅' },
          { label: 'Partidos pendientes', value: pendingCount ?? 0, icon: '⏳' },
        ].map(stat => (
          <div key={stat.label} className="card-mundial p-4 text-center">
            <div className="text-2xl">{stat.icon}</div>
            <div className="text-3xl font-bold text-[#8B1538] mt-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <SyncButton />
    </div>
  )
}
