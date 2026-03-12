'use client'

import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session-context'

interface TopNavProps {
  matchCount?: number
}

export function TopNav({ matchCount = 0 }: TopNavProps) {
  const router = useRouter()
  const { event } = useSession()

  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 safe-top">
      {/* Avatar  profile */}
      <button
        onClick={() => router.push('/perfil')}
        className="flex size-10 items-center justify-center rounded-full bg-surface-elevated/60 text-ink-secondary hover:text-accent active:scale-90 transition-all duration-200"
        aria-label="Mi perfil"
      >
        <span className="material-symbols-outlined text-[20px]">person</span>
      </button>

      {/* Center title */}
      <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-ink-secondary">
        {event?.name || 'Linker'}
      </h1>

      {/* Connections */}
      <button
        onClick={() => router.push('/conexiones')}
        className="relative flex size-10 items-center justify-center rounded-full bg-surface-elevated/60 text-ink-secondary hover:text-accent active:scale-90 transition-all duration-200"
        aria-label="Conexiones"
      >
        <span className="material-symbols-outlined text-[20px]">handshake</span>
        {matchCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-[0_2px_8px_var(--color-accent-glow)]">
            {matchCount > 99 ? '99+' : matchCount}
          </span>
        )}
      </button>
    </header>
  )
}
