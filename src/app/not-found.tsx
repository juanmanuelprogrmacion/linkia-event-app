'use client'

import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-5">
          <span className="material-symbols-outlined text-[36px] text-accent">explore_off</span>
        </div>
        <h1 className="text-xl font-bold mb-2 tracking-[-0.02em]">Página no encontrada</h1>
        <p className="text-ink-secondary text-sm mb-7 font-light leading-relaxed">
          Esta página no existe o fue movida.
        </p>
        <button onClick={() => router.replace('/')} className="btn btn-primary">
          Ir al inicio
        </button>
      </div>
    </main>
  )
}
