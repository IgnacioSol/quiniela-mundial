import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Swords, Users, Star } from 'lucide-react'

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/matches', label: 'Partidos', icon: Swords },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/specials', label: 'Especiales', icon: Star },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center gap-1 border-b border-[#E8E3DC] pb-0">
        <span className="text-xs font-medium text-[#9D9491] px-2 pb-3">Admin</span>
        {adminLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-[#6B6460] hover:text-[#1A1614] border-b-2 border-transparent hover:border-[#E8E3DC] transition-all -mb-px">
            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}
