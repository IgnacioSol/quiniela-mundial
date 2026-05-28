import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: userCount }, { count: matchCount }, { count: finishedCount }, { data: payments }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('profiles').select('quota_paid, quota_amount'),
  ])

  const totalCollected = (payments || []).filter(p => p.quota_paid).reduce((s, p) => s + (p.quota_amount || 0), 0)
  const pendingPayments = (payments || []).filter(p => !p.quota_paid).length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Participantes', value: userCount ?? 0, icon: '👥' },
          { label: 'Partidos totales', value: matchCount ?? 0, icon: '🏟️' },
          { label: 'Partidos jugados', value: finishedCount ?? 0, icon: '✅' },
          { label: 'Pagos pendientes', value: pendingPayments, icon: '💰' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl">{stat.icon}</div>
              <div className="text-3xl font-bold mt-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Total recaudado</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${totalCollected.toLocaleString('es-MX')}</p>
          <p className="text-sm text-muted-foreground mt-1">De participantes que ya pagaron</p>
        </CardContent>
      </Card>
    </div>
  )
}
