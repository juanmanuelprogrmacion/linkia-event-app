'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getMatches, formatWhatsAppLink } from '@/lib/api'
import type { Match } from '@/lib/api'
import { useSession } from '@/lib/session-context'
import { TopNav } from '@/app/components/top-nav'
import { MatchNotifier } from '@/app/components/match-notifier'

export default function ConnectionsPage() {
  const router = useRouter()
  const { isLoading: sessionLoading, isAuthenticated, profileComplete, event } = useSession()

  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  useEffect(() => {
    if (sessionLoading) return
    if (!isAuthenticated) {
      router.replace('/')
      return
    }
    if (!profileComplete) {
      router.replace('/perfil')
    }
  }, [sessionLoading, isAuthenticated, profileComplete, router])

  useEffect(() => {
    if (!sessionLoading && isAuthenticated && profileComplete) {
      loadMatches()
    }
  }, [sessionLoading, isAuthenticated, profileComplete])

  async function loadMatches() {
    try {
      setError(null)
      const data = await getMatches()
      setMatches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar conexiones')
    } finally {
      setIsLoading(false)
    }
  }

  function formatRelativeTime(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin}m`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `Hace ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays}d`
  }

  if (sessionLoading || isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-11 h-11 spinner mx-auto mb-4" />
          <p className="text-ink-secondary text-sm font-light">Cargando conexiones...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex flex-col max-w-[430px] mx-auto safe-bottom">
      <TopNav matchCount={matches.length} />

      {/* Error */}
      {error && (
        <div className="px-4 mb-4 animate-scale-in">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-4 text-center text-sm">
            <p className="mb-2">{error}</p>
            <button onClick={loadMatches} className="underline font-medium">
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pb-4 smooth-scroll">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
            <div className="w-[72px] h-[72px] rounded-full bg-surface flex items-center justify-center mb-5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
              <span className="material-symbols-outlined text-[32px] text-ink-muted">handshake</span>
            </div>
            <h2 className="text-lg font-semibold mb-1.5 tracking-[-0.02em]">Aún no tienes conexiones</h2>
            <p className="text-ink-secondary text-sm mb-7 font-light leading-relaxed">
              ¡Empieza a descubrir personas en el evento!
            </p>
            <button onClick={() => router.push('/descubrir')} className="btn btn-primary">
              Descubrir
            </button>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {matches.map((match) => (
              <ConnectionCard
                key={match.id}
                match={match}
                eventName={event?.name}
                formatTime={formatRelativeTime}
                onSelect={() => setSelectedMatch(match)}
              />
            ))}
          </div>
        )}
      </div>

      <MatchNotifier />

      <AnimatePresence>
        {selectedMatch && (
          <ProfileDetailModal
            match={selectedMatch}
            eventName={event?.name}
            onClose={() => setSelectedMatch(null)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

function ConnectionCard({
  match,
  eventName,
  formatTime,
  onSelect,
}: {
  match: Match
  eventName?: string
  formatTime: (d: string) => string
  onSelect: () => void
}) {
  const whatsappLink = match.profile.whatsapp_number
    ? formatWhatsAppLink(match.profile.whatsapp_number, eventName)
    : null

  return (
    <div className="connection-card p-5 cursor-pointer" onClick={onSelect}>
      {/* Top row: photo + info + time */}
      <div className="flex items-center gap-4">
        <div className="w-[68px] h-[68px] rounded-full overflow-hidden bg-surface-elevated shrink-0 ring-2 ring-border-subtle ring-offset-2 ring-offset-surface">
          {match.profile.photo_url ? (
            <img
              src={match.profile.photo_url}
              alt={match.profile.display_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-ink-muted">person</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-bold text-[1.0625rem] truncate tracking-[-0.02em]">{match.profile.display_name}</h3>
            <span className="text-[11px] text-ink-muted shrink-0 tabular-nums font-light">{formatTime(match.created_at)}</span>
          </div>
          {match.profile.headline && (
            <p className="text-[0.9375rem] text-ink-secondary truncate font-light mt-0.5">{match.profile.headline}</p>
          )}
          {match.profile.company && (
            <p className="text-sm text-ink-muted truncate font-light mt-0.5">{match.profile.company}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      {match.profile.looking_for && match.profile.looking_for.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {match.profile.looking_for.map((tag) => (
            <span key={tag} className="tag tag-primary">{tag}</span>
          ))}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-2.5 mt-4" onClick={(e) => e.stopPropagation()}>
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-btn flex-1 py-2.5"
          >
            <span className="material-symbols-outlined text-[18px] fill-icon">chat</span>
            WhatsApp
          </a>
        )}
        {match.profile.linkedin_url && (
          <a
            href={match.profile.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="linkedin-btn flex-1 justify-center"
          >
            <span className="material-symbols-outlined text-[18px] text-accent">link</span>
            LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}

function ProfileDetailModal({
  match,
  eventName,
  onClose,
}: {
  match: Match
  eventName?: string
  onClose: () => void
}) {
  const profile = match.profile
  const whatsappLink = profile.whatsapp_number
    ? formatWhatsAppLink(profile.whatsapp_number, eventName)
    : null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-[430px] max-h-[90dvh] overflow-auto rounded-t-[28px] glass safe-bottom hide-scrollbar"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-ink-muted/30" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-surface-elevated/80 backdrop-blur-sm active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Photo */}
        <div className="w-full aspect-square bg-surface-elevated -mt-3">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-ink-muted">person</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-[1.375rem] font-bold tracking-[-0.02em]">{profile.display_name}</h2>
            {profile.headline && (
              <p className="text-ink-secondary text-[0.9375rem] mt-1 font-light">{profile.headline}</p>
            )}
            {profile.company && (
              <p className="text-sm text-ink-muted font-light mt-0.5">{profile.company}</p>
            )}
          </div>

          {profile.bio && (
            <p className="text-[0.9375rem] text-ink-secondary leading-relaxed font-light">{profile.bio}</p>
          )}

          {profile.looking_for && profile.looking_for.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.looking_for.map((tag) => (
                <span key={tag} className="tag tag-primary">{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp flex-1 h-[52px]"
              >
                <span className="material-symbols-outlined text-lg fill-icon">chat</span>
                WhatsApp
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-linkedin flex-1 h-[52px]"
              >
                <span className="material-symbols-outlined text-lg text-accent">link</span>
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
