'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: '🏆 Ranking' },
  { href: '/predictions', label: '✏️ Pronósticos' },
  { href: '/results', label: '📊 Resultados' },
]

export default function Navbar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="mundial-gradient sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2 text-white">
            <span className="text-2xl">⚽</span>
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs font-normal text-yellow-300 uppercase tracking-widest">FIFA</span>
              <span className="text-sm font-bold text-white">Mundial 2026</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  pathname === link.href
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}
            {profile.is_admin && (
              <Link
                href="/admin"
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  pathname.startsWith('/admin')
                    ? 'bg-yellow-400/30 text-yellow-300'
                    : 'text-yellow-300/70 hover:text-yellow-300 hover:bg-yellow-400/20'
                )}
              >
                ⚙️ Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80 hidden sm:inline">{profile.name}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-white/30 text-white hover:bg-white/20 hover:text-white bg-transparent"
          >
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}
