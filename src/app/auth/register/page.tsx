'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trophy } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, name, email, is_admin: false, quota_amount: 0, quota_paid: false })
    }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-[#8B1538] flex items-center justify-center"
            style={{ boxShadow: '0 4px 20px rgba(139,21,56,0.25)' }}>
            <Trophy className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-[1.6rem] font-semibold tracking-tight text-[#1A1614] text-center leading-tight mb-1.5">
          Quiniela Mundial 2026
        </h1>
        <p className="text-sm text-[#9D9491] text-center mb-8 tracking-wide">
          Crea tu cuenta y únete a la quiniela.
        </p>

        <form onSubmit={handleRegister} className="space-y-3">
          <input placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} className="input-p" required />
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} className="input-p" required />
          <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} className="input-p" required />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-xs text-center mt-4">
          <span className="text-[#9D9491]">¿Ya tienes cuenta? </span>
          <Link href="/auth/login" className="text-[#8B1538] font-medium hover:underline">Inicia sesión</Link>
        </p>

        <p className="text-xs text-[#C0B8B4] text-center mt-12 tracking-widest">
          — Ignacio Solano M
        </p>
      </div>
    </div>
  )
}
