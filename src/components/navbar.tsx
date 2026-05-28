'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Trophy, TrendingUp, PenLine, BarChart3, Settings, LogOut } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Ranking', icon: Trophy },
  { href: '/evolution', label: 'Evolución', icon: TrendingUp },
  { href: '/predictions', label: 'Pronósticos', icon: PenLine },
  { href: '/results', label: 'Resultados', icon: BarChart3 },
]

export default function Navbar({ profile, pendingCount }: { profile: Profile; pendingCount: number }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E8E3DC]"
      style={{ boxShadow: '0 1px 0 #E8E3DC' }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#8B1538] flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-[#1A1614] text-sm tracking-tight hidden sm:block">Mundial 2026</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-[#F5EEF1] text-[#8B1538]'
                    : 'text-[#6B6460] hover:text-[#1A1614] hover:bg-[#F5F4F2]'
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2 : 1.75} />
                <span className="hidden md:inline">{label}</span>
                {href === '/predictions' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
          {profile.is_admin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                pathname.startsWith('/admin')
                  ? 'bg-[#FAF5E8] text-[#C4982A]'
                  : 'text-[#6B6460] hover:text-[#1A1614] hover:bg-[#F5F4F2]'
              )}
            >
              <Settings className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-[#6B6460] hidden sm:block font-medium">{profile.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-[#9D9491] hover:text-[#1A1614] hover:bg-[#F5F4F2] transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  )
}
