'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSession, getStoredToken } from '@/lib/api'

export default function EventLandingPage() {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string

    const [isLoading, setIsLoading] = useState(true)
    const [event, setEvent] = useState<{ name: string; slug: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            try {
                const session = await createSession(slug)
                setEvent(session.event)
                setIsLoading(false)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load event')
                setIsLoading(false)
            }
        }

        init()
    }, [slug])

    if (isLoading) {
        return (
            <main className="min-h-dvh flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading event...</p>
                </div>
            </main>
        )
    }

    if (error) {
        return (
            <main className="min-h-dvh flex items-center justify-center p-6">
                <div className="glass rounded-2xl p-8 max-w-md text-center">
                    <div className="text-5xl mb-4">😕</div>
                    <h1 className="text-xl font-semibold mb-2">Event Not Found</h1>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <a href="/" className="btn btn-primary">
                        Go Home
                    </a>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-dvh flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-md">
                {/* Event badge */}
                <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                    Live Event
                </div>

                {/* Event name */}
                <h1 className="text-3xl font-bold mb-4">{event?.name}</h1>

                {/* Description */}
                <p className="text-gray-400 mb-8">
                    Connect with other attendees through our Tinder-style networking.
                    Mutual connections unlock contact information.
                </p>

                {/* Features */}
                <div className="glass rounded-2xl p-6 mb-8 text-left">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="font-medium">No Login Required</p>
                                <p className="text-sm text-gray-400">Your identity stays anonymous</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🤝</span>
                            <div>
                                <p className="font-medium">Match to Connect</p>
                                <p className="text-sm text-gray-400">Contact info revealed only on mutual match</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📱</span>
                            <div>
                                <p className="font-medium">Simple Swipe Interface</p>
                                <p className="text-sm text-gray-400">Skip or Connect with other attendees</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={() => router.push(`/e/${slug}/profile`)}
                    className="btn btn-primary w-full text-lg"
                >
                    Get Started
                </button>

                <p className="text-xs text-gray-500 mt-6">
                    By continuing, you agree to share your profile with other attendees
                </p>
            </div>
        </main>
    )
}
