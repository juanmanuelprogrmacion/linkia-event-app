'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion'
import { getFeed, submitSwipe, getStoredToken } from '@/lib/api'

interface Profile {
    id: string
    display_name: string
    headline?: string
    bio?: string
    photo_url?: string
}

interface MatchData {
    id: string
    contact: {
        display_name: string
        photo_url?: string
        email?: string
        phone?: string
        linkedin_url?: string
        website_url?: string
    }
}

export default function DiscoverPage() {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string

    const [profiles, setProfiles] = useState<Profile[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [showMatch, setShowMatch] = useState<MatchData | null>(null)
    const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)

    const loadProfiles = useCallback(async () => {
        if (!getStoredToken(slug)) {
            router.push(`/e/${slug}`)
            return
        }

        try {
            const feedProfiles = await getFeed(slug, 20)
            setProfiles(prev => [...prev, ...feedProfiles])
        } catch (error) {
            console.error('Failed to load feed:', error)
            if (error instanceof Error && (error.message.includes('401') || error.message.includes('token'))) {
                router.push(`/e/${slug}`)
            }
        } finally {
            setIsLoading(false)
        }
    }, [slug, router])

    useEffect(() => {
        loadProfiles()
    }, [slug, loadProfiles])

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (currentIndex >= profiles.length) return

        const profile = profiles[currentIndex]
        const action = direction === 'right' ? 'connect' : 'skip'

        setCurrentIndex(prev => prev + 1)
        setDragDirection(null)

        try {
            const result = await submitSwipe(slug, profile.id, action)

            if (result.is_match && result.match) {
                setShowMatch(result.match)
            }

            if (profiles.length - currentIndex < 5) {
                loadProfiles()
            }
        } catch (error) {
            console.error('Swipe failed:', error)
        }
    }

    const currentProfile = profiles[currentIndex]
    const nextProfile = profiles[currentIndex + 1]

    if (isLoading && profiles.length === 0) {
        return (
            <main className="min-h-dvh flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary font-medium">Finding people...</p>
                </div>
            </main>
        )
    }

    return (
        <div className="relative flex h-dvh w-full max-w-[430px] mx-auto flex-col overflow-hidden bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
                <h1 className="text-xl font-bold text-primary">LinkiaEvent</h1>
                <button
                    onClick={() => router.push(`/e/${slug}/matches`)}
                    className="flex size-10 items-center justify-center rounded-full bg-surface text-text-secondary hover:text-primary transition-colors"
                >
                    💜
                </button>
            </header>

            {/* Swipe Deck Area */}
            <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-4 pt-4">
                {!currentProfile ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center glass rounded-2xl p-8 max-w-sm"
                    >
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-xl font-bold mb-2">You&apos;ve seen everyone!</h2>
                        <p className="text-text-secondary mb-6">
                            Check back later as more attendees join.
                        </p>
                        <button
                            onClick={() => router.push(`/e/${slug}/matches`)}
                            className="btn btn-primary w-full"
                        >
                            View Your Matches
                        </button>
                    </motion.div>
                ) : (
                    <div className="relative w-full h-full max-w-sm">
                        {/* Background Card Shadow */}
                        {nextProfile && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-[calc(100%-2rem)] w-[90%] rounded-2xl bg-surface opacity-50 -z-10" />
                        )}

                        {/* Main Profile Card */}
                        <SwipeableCard
                            key={currentProfile.id}
                            profile={currentProfile}
                            onSwipe={handleSwipe}
                            onDrag={(dir) => setDragDirection(dir)}
                        />
                    </div>
                )}
            </main>

            {/* Action buttons */}
            {currentProfile && (
                <footer className="flex items-center justify-center gap-8 px-6 pb-10 pt-4 shrink-0 safe-bottom">
                    <button
                        onClick={() => handleSwipe('left')}
                        className={`btn-icon btn-skip transition-all ${dragDirection === 'left' ? 'scale-110 !text-error' : ''}`}
                    >
                        ✕
                    </button>
                    <button
                        onClick={() => handleSwipe('right')}
                        className={`btn-icon btn-connect transition-all ${dragDirection === 'right' ? 'scale-110' : ''}`}
                    >
                        ✓
                    </button>
                </footer>
            )}

            {/* Match popup */}
            <AnimatePresence>
                {showMatch && (
                    <MatchPopup match={showMatch} onClose={() => setShowMatch(null)} />
                )}
            </AnimatePresence>
        </div>
    )
}

function SwipeableCard({ profile, onSwipe, onDrag }: {
    profile: Profile,
    onSwipe: (dir: 'left' | 'right') => void,
    onDrag: (dir: 'left' | 'right' | null) => void
}) {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-12, 12])
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            onDrag={(e, info) => {
                if (info.offset.x > 50) onDrag('right')
                else if (info.offset.x < -50) onDrag('left')
                else onDrag(null)
            }}
            whileTap={{ cursor: 'grabbing' }}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl cursor-grab ring-1 ring-white/10 touch-pan-y bg-surface"
        >
            {/* Profile Image */}
            <div className="absolute inset-0">
                {profile.photo_url ? (
                    <img
                        src={profile.photo_url}
                        alt={profile.display_name}
                        className="w-full h-full object-cover"
                        style={{
                            imageRendering: 'auto',
                            WebkitBackfaceVisibility: 'hidden',
                            backfaceVisibility: 'hidden'
                        }}
                        loading="eager"
                        decoding="async"
                        draggable={false}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface-light">
                        <span className="text-8xl opacity-50">👤</span>
                    </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
            </div>

            {/* Swipe Indicators */}
            <motion.div
                style={{ opacity: useTransform(x, [-100, -30], [1, 0]) }}
                className="swipe-indicator swipe-nope"
            >
                NOPE
            </motion.div>

            <motion.div
                style={{ opacity: useTransform(x, [30, 100], [0, 1]) }}
                className="swipe-indicator swipe-like"
            >
                LIKE
            </motion.div>

            {/* Card Content */}
            <div className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-2xl border-t border-white/10 p-5 pointer-events-none">
                <h2 className="text-2xl font-bold text-white mb-1">{profile.display_name}</h2>
                {profile.headline && (
                    <p className="text-lg font-medium text-primary mb-2">{profile.headline}</p>
                )}
                {profile.bio && (
                    <p className="text-sm text-slate-300 line-clamp-2">{profile.bio}</p>
                )}
            </div>
        </motion.div>
    )
}

function MatchPopup({ match, onClose }: { match: MatchData; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col celebratory-gradient px-6 pt-4 pb-12 max-w-[430px] mx-auto"
        >
            {/* Close button */}
            <div className="flex justify-end h-12 mb-4">
                <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                    <span className="text-2xl">✕</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center"
                >
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-3xl font-extrabold mb-2">
                        It&apos;s a <span className="text-primary">Match!</span>
                    </h1>
                    <p className="text-white/70 text-lg">You and {match.contact.display_name} like each other!</p>
                </motion.div>

                {/* Avatar */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                >
                    <div className="absolute inset-0 w-40 h-40 bg-primary/20 rounded-full blur-2xl pulse-glow" />
                    <div className="w-32 h-32 rounded-full border-4 border-background shadow-2xl overflow-hidden bg-surface relative">
                        {match.contact.photo_url ? (
                            <img src={match.contact.photo_url} alt={match.contact.display_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">👤</div>
                        )}
                    </div>
                </motion.div>

                {/* Contact Info */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass rounded-xl p-4 w-full max-w-sm space-y-3"
                >
                    {match.contact.email && (
                        <a href={`mailto:${match.contact.email}`} className="flex items-center gap-3 text-primary hover:text-white transition-colors">
                            <span>📧</span>
                            <span className="truncate text-sm">{match.contact.email}</span>
                        </a>
                    )}
                    {match.contact.phone && (
                        <a href={`tel:${match.contact.phone}`} className="flex items-center gap-3 text-primary hover:text-white transition-colors">
                            <span>📱</span>
                            <span className="text-sm">{match.contact.phone}</span>
                        </a>
                    )}
                    {match.contact.linkedin_url && (
                        <a href={match.contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:text-white transition-colors">
                            <span>💼</span>
                            <span className="truncate text-sm">LinkedIn Profile</span>
                        </a>
                    )}
                    {!match.contact.email && !match.contact.phone && !match.contact.linkedin_url && (
                        <p className="text-text-secondary text-center text-sm">No contact info shared, but you&apos;re matched!</p>
                    )}
                </motion.div>
            </div>

            {/* Action */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <button onClick={onClose} className="btn btn-primary w-full h-14 text-lg">
                    Keep Swiping
                </button>
            </motion.div>
        </motion.div>
    )
}
