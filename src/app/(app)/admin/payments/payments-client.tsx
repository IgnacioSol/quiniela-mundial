'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Profile } from '@/lib/types'

export default function PaymentsClient({ profiles: initial }: { profiles: Profile[] }) {
  const [profiles, setProfiles] = useState(initial)
  const [globalQuota, setGlobalQuota] = useState('')

  const totalCollected = profiles.filter(p => p.quota_paid).reduce((s, p) => s + (p.quota_amount || 0), 0)
  const totalExpected = profiles.reduce((s, p) => s + (p.quota_amount || 0), 0)

  async function setAllQuotas() {
    const amount = Number(globalQuota)
    if (!amount || isNaN(amount)) return
    const supabase = createClient()
    await supabase.from('profiles').update({ quota_amount: amount })
    setProfiles(prev => prev.map(p => ({ ...p, quota_amount: amount })))
    setGlobalQuota('')
  }

  async function togglePaid(user: Profile) {
    const supabase = createClient()
    await supabase.from('profiles').update({ quota_paid: !user.quota_paid }).eq('id', user.id)
    setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, quota_paid: !user.quota_paid } : p))
  }

  async function updateAmount(id: string, amount: string) {
    const num = Number(amount)
    if (isNaN(num)) return
    const supabase = createClient()
    await supabase.from('profiles').update({ quota_amount: num }).eq('id', id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, quota_amount: num } : p))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cuotas y Pagos</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">${totalCollected.toLocaleString('es-MX')}</div>
            <div className="text-xs text-muted-foreground mt-1">Recaudado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">${totalExpected.toLocaleString('es-MX')}</div>
            <div className="text-xs text-muted-foreground mt-1">Total esperado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{profiles.filter(p => !p.quota_paid).length}</div>
            <div className="text-xs text-muted-foreground mt-1">Pendientes de pago</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Establecer cuota global</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input
            type="number"
            placeholder="Ej: 200"
            value={globalQuota}
            onChange={e => setGlobalQuota(e.target.value)}
            className="max-w-32"
          />
          <Button onClick={setAllQuotas}>Aplicar a todos</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cuota</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={user.quota_amount || 0}
                      className="w-24"
                      onBlur={e => updateAmount(user.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.quota_paid ? 'default' : 'destructive'}>
                      {user.quota_paid ? '✓ Pagado' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={user.quota_paid ? 'outline' : 'default'}
                      onClick={() => togglePaid(user)}
                    >
                      {user.quota_paid ? 'Marcar pendiente' : 'Marcar pagado'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
