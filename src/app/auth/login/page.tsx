'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trophy } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Trophy mark */}
        <div className="flex justify-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-[#8B1538] flex items-center justify-center"
            style={{ boxShadow: '0 4px 20px rgba(139,21,56,0.25)' }}>
            <Trophy className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[1.6rem] font-semibold tracking-tight text-[#1A1614] text-center leading-tight mb-1.5">
          Quiniela Mundial 2026
        </h1>
        <p className="text-sm text-[#9D9491] text-center mb-8 tracking-wide">
          Predice. Compite. Gana.
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-p"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-p"
            required
          />

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-xs text-center mt-4">
          <span className="text-[#9D9491]">¿No tienes cuenta? </span>
          <Link href="/auth/register" className="text-[#8B1538] font-medium hover:underline">
            Regístrate
          </Link>
        </p>

        {/* Credit */}
        <p className="text-xs text-[#C0B8B4] text-center mt-12 tracking-widest">
          — Ignacio Solano M
        </p>
      </div>
    </div>
  )
}
