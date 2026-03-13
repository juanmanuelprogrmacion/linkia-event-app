'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error no controlado:', error)
  }, [error])

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-5">
          <span className="material-symbols-outlined text-[36px] text-destructive">error</span>
        </div>
        <h1 className="text-xl font-bold mb-2 tracking-[-0.02em]">Algo salió mal</h1>
        <p className="text-ink-secondary text-sm mb-7 font-light leading-relaxed">
          Ocurrió un error inesperado. Intenta de nuevo.
        </p>
        <button onClick={reset} className="btn btn-primary">
          Reintentar
        </button>
      </div>
    </main>
  )
}
