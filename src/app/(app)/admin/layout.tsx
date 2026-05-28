import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/matches', label: 'Partidos' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/payments', label: 'Cuotas' },
  { href: '/admin/specials', label: 'Especiales' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Admin:</span>
        {adminLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm px-3 py-1 rounded-md bg-muted hover:bg-muted/80 font-medium"
          >
            {link.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}
