'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getMatches, getStoredToken } from '@/lib/api'

// Simple notification component - only active on discover/matches pages
export function MatchNotifier({ eventSlug }: { eventSlug: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const [newMatchesCount, setNewMatchesCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    // Only run on discover or matches pages (not landing or profile)
    const shouldRun = pathname?.includes('/discover') || pathname?.includes('/matches')

    useEffect(() => {
        // Don't run if no token or not on relevant pages
        if (!shouldRun) return

        const token = getStoredToken(eventSlug)
        if (!token) return

        // Initial check
        const checkMatches = async () => {
            try {
                const storedCount = parseInt(localStorage.getItem(`matches_count_${eventSlug}`) || '0')
                const matches = await getMatches(eventSlug)
                if (matches.length > storedCount) {
                    setNewMatchesCount(matches.length - storedCount)
                    setIsVisible(true)
                    localStorage.setItem(`matches_count_${eventSlug}`, matches.length.toString())
                }
            } catch (error) {
                // Silently fail - user might not be authenticated yet
                console.log('Match check skipped - no valid session')
            }
        }

        checkMatches()

        // Polling every 10s (less aggressive)
        const interval = setInterval(async () => {
            // Re-check token each time
            if (!getStoredToken(eventSlug)) {
                clearInterval(interval)
                return
            }

            const storedCount = parseInt(localStorage.getItem(`matches_count_${eventSlug}`) || '0')
            try {
                const matches = await getMatches(eventSlug)
                if (matches.length > storedCount) {
                    setNewMatchesCount(matches.length - storedCount)
                    setIsVisible(true)
                    localStorage.setItem(`matches_count_${eventSlug}`, matches.length.toString())
                }
            } catch (e) {
                // Silently fail
            }
        }, 10000)

        return () => {
            clearInterval(interval)
        }
    }, [eventSlug, shouldRun])

    if (!isVisible) return null

    return (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-bounce-in safe-bottom max-w-[400px] mx-auto">
            <div
                className="bg-primary text-white p-4 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-white/10 backdrop-blur-md"
                onClick={() => {
                    setIsVisible(false)
                    router.push(`/e/${eventSlug}/matches`)
                }}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">💜</span>
                    <div>
                        <p className="font-bold">New Match!</p>
                        <p className="text-sm opacity-90">
                            {newMatchesCount > 1
                                ? `You have ${newMatchesCount} new connections`
                                : 'Someone you liked connected back!'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsVisible(false)
                    }}
                    className="p-2 hover:bg-white/20 rounded-full"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
