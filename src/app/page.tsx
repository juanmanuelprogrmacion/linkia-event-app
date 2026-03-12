'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session-context'

const TEST_TOKEN = 'test-dev-token-linker-2026'

export default function EntryPage() {
  const router = useRouter()
  const { isLoading, isAuthenticated, profileComplete, initSession, loginWithToken } =
    useSession()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated && profileComplete) {
      router.replace('/descubrir')
    } else if (isAuthenticated && !profileComplete) {
      router.replace('/perfil')
    }
  }, [isLoading, isAuthenticated, profileComplete, router])

  async function handleNewSession() {
    setIsLoggingIn(true)
    const complete = await initSession()
    router.replace(complete ? '/descubrir' : '/perfil')
  }

  async function handleTestLogin() {
    setIsLoggingIn(true)
    const complete = await loginWithToken(TEST_TOKEN)
    router.replace(complete ? '/descubrir' : '/perfil')
  }

  if (isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-11 h-11 spinner" />
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="relative min-h-dvh flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Layered ambient background */}
        <div className="ambient-glow" />

        {/* Decorative orbs */}
        <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-accent/[0.04] blur-[80px] animate-float" />
        <div className="absolute bottom-[20%] right-[5%] w-48 h-48 rounded-full bg-connect/[0.03] blur-[60px] animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo + Brand */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-[80px] h-[80px] rounded-[22px] bg-accent/10 mb-7 animate-breathe">
              <span className="material-symbols-outlined text-accent text-[38px]">hub</span>
            </div>
            <h1 className="text-[2.75rem] font-extrabold tracking-[-0.03em] leading-none mb-3">
              Linker
            </h1>
            <p className="text-ink-secondary text-[1.0625rem] leading-relaxed font-light tracking-[-0.01em]">
              Conecta con profesionales del evento
            </p>
            <div className="section-divider mt-8 mx-auto w-16 opacity-60" />
          </div>

          {/* CTA */}
          <div className="space-y-3.5 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <button
              onClick={handleNewSession}
              disabled={isLoggingIn}
              className="btn btn-primary w-full h-[56px] text-[1.0625rem] tracking-[-0.01em]"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="w-5 h-5 spinner" style={{ borderWidth: '2px' }} />
                  Entrando...
                </span>
              ) : (
                'Entrar al evento'
              )}
            </button>

            <button
              onClick={handleTestLogin}
              disabled={isLoggingIn}
              className="btn btn-secondary w-full h-11 text-[13px]"
            >
              <span className="material-symbols-outlined text-base">bug_report</span>
              Test Login
            </button>
          </div>

          {/* Footer hint */}
          <p className="text-center text-ink-muted text-[13px] mt-8 animate-fade-in font-light tracking-wide" style={{ animationDelay: '400ms' }}>
            Escanea el QR del evento para comenzar
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="w-11 h-11 spinner" />
    </main>
  )
}
