'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  PanInfo,
} from 'framer-motion'
import { getFeed, submitSwipe, getStoredToken, getMatches, formatWhatsAppLink } from '@/lib/api'
import type { Profile, ProfileWithContact } from '@/lib/api'
import { useSession } from '@/lib/session-context'
import { TopNav } from '@/app/components/top-nav'
import { MatchNotifier } from '@/app/components/match-notifier'

interface MatchData {
  id: string
  contact: ProfileWithContact
}

export default function DiscoverPage() {
  const router = useRouter()
  const { isLoading: sessionLoading, isAuthenticated, profileComplete, event } = useSession()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showMatch, setShowMatch] = useState<MatchData | null>(null)
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)
  const [matchCount, setMatchCount] = useState(0)

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

  const loadProfiles = useCallback(async () => {
    if (!getStoredToken()) return
    try {
      const feedProfiles = await getFeed(20)
      setProfiles((prev) => [...prev, ...feedProfiles])
    } catch (error) {
      console.error('Error al cargar feed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!sessionLoading && isAuthenticated && profileComplete) {
      loadProfiles()
      getMatches()
        .then((m) => setMatchCount(m.length))
        .catch(() => {})
    }
  }, [sessionLoading, isAuthenticated, profileComplete, loadProfiles])

  async function handleSwipe(direction: 'left' | 'right') {
    if (currentIndex >= profiles.length) return

    const profile = profiles[currentIndex]
    const action = direction === 'right' ? 'connect' : 'skip'

    setCurrentIndex((prev) => prev + 1)
    setDragDirection(null)

    try {
      const result = await submitSwipe(profile.id, action)
      if (result.is_match && result.match) {
        setShowMatch(result.match)
        setMatchCount((prev) => prev + 1)
      }
      if (profiles.length - (currentIndex + 1) < 5) {
        loadProfiles()
      }
    } catch (error) {
      console.error('Error en swipe:', error)
    }
  }

  const currentProfile = profiles[currentIndex]
  const nextProfile = profiles[currentIndex + 1]

  // Show nothing while checking auth to avoid content flash before redirect
  if (sessionLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-11 h-11 spinner" />
      </main>
    )
  }

  if (isLoading && profiles.length === 0) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 spinner mx-auto mb-4" />
          <p className="text-ink-secondary text-sm font-light">Buscando perfiles...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="relative flex h-dvh w-full max-w-[430px] mx-auto flex-col overflow-hidden">
      <TopNav matchCount={matchCount} />

      {/* Swipe Deck */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-2 pt-2">
        {!currentProfile ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="text-center glass rounded-3xl p-8 max-w-sm"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-5">
              <span className="material-symbols-outlined text-[36px] text-accent">celebration</span>
            </div>
            <h2 className="text-xl font-bold mb-2 tracking-[-0.02em]">Has visto a todos por ahora</h2>
            <p className="text-ink-secondary text-sm mb-7 font-light leading-relaxed">
              ¡Vuelve más tarde para ver nuevos asistentes!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/conexiones')}
                className="btn btn-primary w-full"
              >
                Ver conexiones
              </button>
              <button
                onClick={() => {
                  setProfiles([])
                  setCurrentIndex(0)
                  setIsLoading(true)
                  loadProfiles()
                }}
                className="btn btn-secondary w-full"
              >
                Actualizar
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="relative w-full h-full max-w-sm">
            {/* Next card hint */}
            {nextProfile && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 h-[calc(100%-1.5rem)] w-[92%] rounded-[24px] bg-surface-elevated/50 -z-10 transition-opacity" />
            )}

            <AnimatePresence mode="popLayout">
              <SwipeableCard
                key={currentProfile.id}
                profile={currentProfile}
                onSwipe={handleSwipe}
                onDrag={(dir) => setDragDirection(dir)}
              />
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Action buttons */}
      {currentProfile && (
        <footer className="flex items-center justify-center gap-8 px-6 pb-8 pt-3 shrink-0 safe-bottom">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleSwipe('left')}
              className={`btn-icon btn-skip ${
                dragDirection === 'left' ? 'scale-110 !bg-destructive/15 !text-destructive !shadow-[0_4px_20px_rgba(239,68,68,0.15)]' : ''
              }`}
              aria-label="Pasar"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
            <span className="text-[10px] text-ink-muted font-medium tracking-[0.08em] uppercase">Pasar</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleSwipe('right')}
              className={`btn-icon btn-connect ${
                dragDirection === 'right' ? 'scale-110' : ''
              }`}
              aria-label="Conectar"
            >
              <span className="material-symbols-outlined text-[28px]">handshake</span>
            </button>
            <span className="text-[10px] text-accent font-medium tracking-[0.08em] uppercase">Conectar</span>
          </div>
        </footer>
      )}

      {/* Match popup */}
      <AnimatePresence>
        {showMatch && (
          <MatchPopup
            match={showMatch}
            eventName={event?.name}
            onClose={() => setShowMatch(null)}
          />
        )}
      </AnimatePresence>

      <MatchNotifier />
    </div>
  )
}

// --- Swipeable Card ---

function SwipeableCard({
  profile,
  onSwipe,
  onDrag,
}: {
  profile: Profile
  onSwipe: (dir: 'left' | 'right') => void
  onDrag: (dir: 'left' | 'right' | null) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-8, 8])
  const opacity = useTransform(x, [-250, -120, 0, 120, 250], [0.5, 1, 1, 1, 0.5])

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold = 100
    if (info.offset.x > threshold) {
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      onSwipe('left')
    } else {
      onDrag(null)
    }
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onDrag={(_e, info) => {
        if (info.offset.x > 50) onDrag('right')
        else if (info.offset.x < -50) onDrag('left')
        else onDrag(null)
      }}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute inset-0 profile-card cursor-grab touch-pan-y flex flex-col"
    >
      {/* Swipe Indicators */}
      <motion.div
        style={{ opacity: useTransform(x, [-100, -30], [1, 0]) }}
        className="swipe-indicator swipe-nope z-10"
      >
        PASAR
      </motion.div>
      <motion.div
        style={{ opacity: useTransform(x, [30, 100], [0, 1]) }}
        className="swipe-indicator swipe-like z-10"
      >
        CONECTAR
      </motion.div>

      {/* Photo */}
      <div className="relative h-[55%] overflow-hidden">
        {profile.photo_url ? (
          <Image
            src={profile.photo_url}
            alt={profile.display_name}
            fill
            priority
            draggable={false}
            className="object-cover"
            sizes="(max-width: 430px) 100vw, 430px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-elevated">
            <span className="material-symbols-outlined text-7xl text-ink-muted">person</span>
          </div>
        )}
        {/* Gradient fade into content */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-5 -mt-8 relative flex flex-col pointer-events-none">
        <h2 className="text-[1.375rem] font-bold leading-tight tracking-[-0.02em]">{profile.display_name}</h2>
        {profile.headline && (
          <p className="text-[15px] font-semibold text-accent mt-0.5 leading-snug tracking-[-0.01em]">
            {profile.headline}
          </p>
        )}
        {profile.company && (
          <p className="text-sm text-ink-secondary mt-0.5 font-light">{profile.company}</p>
        )}

        {profile.bio && (
          <p className="text-sm text-ink-secondary/80 mt-3 line-clamp-3 leading-relaxed font-light">
            {profile.bio}
          </p>
        )}

        {/* Tags + LinkedIn */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          {profile.looking_for && profile.looking_for.length > 0 && (
            <div className="flex flex-wrap gap-1.5 flex-1">
              {profile.looking_for.map((tag) => (
                <span key={tag} className="tag tag-primary">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-accent hover:underline pointer-events-auto shrink-0 opacity-70 transition-opacity hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="material-symbols-outlined text-sm">link</span>
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// --- Match Popup ---

function MatchPopup({
  match,
  eventName,
  onClose,
}: {
  match: MatchData
  eventName?: string
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000)
    return () => clearTimeout(timer)
  }, [onClose])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const whatsappLink = match.contact.whatsapp_number
    ? formatWhatsAppLink(match.contact.whatsapp_number, eventName)
    : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col celebratory-gradient px-6 pt-4 pb-12 max-w-[430px] mx-auto"
    >
      {/* Close */}
      <div className="flex justify-end h-10">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full text-ink-muted hover:text-ink hover:bg-surface active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-7">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 20 }}
          className="text-center"
        >
          <h1 className="text-[2rem] font-extrabold mb-1 tracking-[-0.03em]">
            ¡<span className="gradient-text">Conexión</span>!
          </h1>
          <p className="text-ink-secondary font-light">
            Tú y {match.contact.display_name} quieren conectar
          </p>
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
          className="relative"
        >
          <div className="absolute -inset-5 bg-accent/15 rounded-full blur-3xl pulse-glow" />
          <div className="w-[120px] h-[120px] rounded-full border-[3px] border-accent/25 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden bg-surface relative">
            {match.contact.photo_url ? (
              <Image
                src={match.contact.photo_url}
                alt={match.contact.display_name}
                fill
                className="object-cover"
                sizes="120px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-ink-muted">person</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 20 }}
          className="text-center"
        >
          <h2 className="font-bold text-xl mb-0.5 tracking-[-0.02em]">{match.contact.display_name}</h2>
          {match.contact.headline && (
            <p className="text-ink-secondary text-sm font-light">{match.contact.headline}</p>
          )}
          {match.contact.company && (
            <p className="text-ink-muted text-sm font-light">{match.contact.company}</p>
          )}
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', damping: 20 }}
        className="space-y-3"
      >
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp w-full h-14 text-[1.0625rem]"
          >
            <span className="material-symbols-outlined">chat</span>
            Enviar WhatsApp
          </a>
        )}
        <button onClick={onClose} className="btn btn-secondary w-full h-14 text-[1.0625rem]">
          Seguir descubriendo
        </button>
      </motion.div>
    </motion.div>
  )
}
