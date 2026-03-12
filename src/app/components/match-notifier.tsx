'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getMatches, getStoredToken } from '@/lib/api'

export function MatchNotifier() {
  const router = useRouter()
  const pathname = usePathname()
  const [newMatchesCount, setNewMatchesCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const shouldRun = pathname !== '/'

  function dismiss() {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsExiting(false)
    }, 300)
  }

  useEffect(() => {
    if (!shouldRun) return

    const token = getStoredToken()
    if (!token) return

    const checkMatches = async () => {
      try {
        const storedCount = parseInt(localStorage.getItem('linker_matches_count') || '0')
        const matches = await getMatches()
        if (matches.length > storedCount) {
          setNewMatchesCount(matches.length - storedCount)
          setIsVisible(true)
          setIsExiting(false)
          localStorage.setItem('linker_matches_count', matches.length.toString())
        }
      } catch {
        // Silently fail
      }
    }

    checkMatches()

    const interval = setInterval(async () => {
      if (!getStoredToken()) {
        clearInterval(interval)
        return
      }

      try {
        const storedCount = parseInt(localStorage.getItem('linker_matches_count') || '0')
        const matches = await getMatches()
        if (matches.length > storedCount) {
          setNewMatchesCount(matches.length - storedCount)
          setIsVisible(true)
          setIsExiting(false)
          localStorage.setItem('linker_matches_count', matches.length.toString())
        }
      } catch {
        // Silently fail
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [shouldRun])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 safe-bottom max-w-[400px] mx-auto">
      <div
        className={`bg-accent/95 text-white p-4 rounded-2xl shadow-[0_8px_32px_rgba(19,146,236,0.3)] flex items-center justify-between cursor-pointer border border-white/10 backdrop-blur-lg transition-all duration-300 ${
          isExiting ? 'opacity-0 translate-y-4 scale-95' : 'animate-slide-up'
        }`}
        onClick={() => {
          dismiss()
          router.push('/conexiones')
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15">
            <span className="material-symbols-outlined fill-icon text-xl">handshake</span>
          </div>
          <div>
            <p className="font-semibold text-[15px] tracking-[-0.01em]">¡Nueva conexión!</p>
            <p className="text-sm opacity-85 font-light">
              {newMatchesCount > 1
                ? `Tienes ${newMatchesCount} nuevas conexiones`
                : '¡Alguien quiere conectar contigo!'}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
          className="p-2 hover:bg-white/15 active:bg-white/20 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  )
}
