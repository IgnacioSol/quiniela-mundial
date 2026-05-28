'use client'

import { useState } from 'react'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'

export default function SyncButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [result, setResult] = useState<{ matchesUpdated: number; predictionsUpdated: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSync() {
    setState('loading')
    setResult(null)
    try {
      const res = await fetch('/api/sync-results')
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Error desconocido')
        setState('error')
      } else {
        setResult(data)
        setState('ok')
        setTimeout(() => setState('idle'), 4000)
      }
    } catch {
      setErrorMsg('Error de red')
      setState('error')
    }
  }

  return (
    <div className="card-p overflow-hidden">
      <div className="card-section flex items-center gap-2.5">
        <div className="accent-bar" />
        <div>
          <h2 className="font-semibold text-[#1A1614] text-sm">Sincronizar Resultados</h2>
          <p className="text-xs text-[#9D9491] mt-0.5">Corre automático cada 10 min — o forzar ahora</p>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center gap-4">
        <button
          onClick={handleSync}
          disabled={state === 'loading'}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          {state === 'loading' ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>

        {state === 'ok' && result && (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <Check className="w-4 h-4" strokeWidth={1.75} />
            {result.matchesUpdated} partidos · {result.predictionsUpdated} pronósticos actualizados
          </div>
        )}
        {state === 'error' && (
          <div className="flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" strokeWidth={1.75} />
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  )
}
