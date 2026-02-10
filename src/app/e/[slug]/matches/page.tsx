'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getMatches, getStoredToken } from '@/lib/api'

interface Match {
    id: string
    created_at: string
    profile: {
        id: string
        display_name: string
        headline?: string
        photo_url?: string
        email?: string
        phone?: string
        linkedin_url?: string
        website_url?: string
    }
}

export default function MatchesPage() {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string

    const [matches, setMatches] = useState<Match[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

    useEffect(() => {
        if (!getStoredToken(slug)) {
            router.push(`/e/${slug}`)
            return
        }

        const loadMatches = async () => {
            try {
                const data = await getMatches(slug)
                setMatches(data)
            } catch (error) {
                console.error('Failed to load matches:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadMatches()
    }, [slug, router])

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <main className="min-h-dvh flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading matches...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-dvh flex flex-col safe-top safe-bottom">
            {/* Header */}
            <header className="flex items-center gap-4 p-4 border-b border-white/10">
                <button
                    onClick={() => router.push(`/e/${slug}/discover`)}
                    className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors"
                >
                    ←
                </button>
                <h1 className="text-xl font-bold">Your Matches</h1>
                <span className="ml-auto text-gray-400">{matches.length}</span>
            </header>

            {/* Matches list */}
            <div className="flex-1 overflow-auto">
                {matches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <div className="text-6xl mb-4">💜</div>
                        <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
                        <p className="text-gray-400 mb-6">
                            Keep swiping to find connections at this event!
                        </p>
                        <button
                            onClick={() => router.push(`/e/${slug}/discover`)}
                            className="btn btn-primary"
                        >
                            Back to Swiping
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {matches.map((match) => (
                            <button
                                key={match.id}
                                onClick={() => setSelectedMatch(match)}
                                className="w-full flex items-center gap-4 p-4 hover:bg-surface transition-colors text-left"
                            >
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-surface flex-shrink-0">
                                    {match.profile.photo_url ? (
                                        <img
                                            src={match.profile.photo_url}
                                            alt={match.profile.display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                            👤
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{match.profile.display_name}</h3>
                                    {match.profile.headline && (
                                        <p className="text-sm text-gray-400 truncate">{match.profile.headline}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Matched {formatDate(match.created_at)}</p>
                                </div>
                                <span className="text-gray-500">→</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Match detail modal */}
            {selectedMatch && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-end justify-center z-50"
                    onClick={() => setSelectedMatch(null)}
                >
                    <div
                        className="glass rounded-t-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-6" />

                        {/* Profile header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface flex-shrink-0">
                                {selectedMatch.profile.photo_url ? (
                                    <img
                                        src={selectedMatch.profile.photo_url}
                                        alt={selectedMatch.profile.display_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        👤
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{selectedMatch.profile.display_name}</h2>
                                {selectedMatch.profile.headline && (
                                    <p className="text-gray-400">{selectedMatch.profile.headline}</p>
                                )}
                            </div>
                        </div>

                        {/* Contact info */}
                        <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wide mb-3">
                            Contact Information
                        </h3>
                        <div className="space-y-3 mb-6">
                            {selectedMatch.profile.email && (
                                <a
                                    href={`mailto:${selectedMatch.profile.email}`}
                                    className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-light transition-colors"
                                >
                                    <span className="text-xl">📧</span>
                                    <span className="text-primary">{selectedMatch.profile.email}</span>
                                </a>
                            )}
                            {selectedMatch.profile.phone && (
                                <a
                                    href={`tel:${selectedMatch.profile.phone}`}
                                    className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-light transition-colors"
                                >
                                    <span className="text-xl">📱</span>
                                    <span className="text-primary">{selectedMatch.profile.phone}</span>
                                </a>
                            )}
                            {selectedMatch.profile.linkedin_url && (
                                <a
                                    href={selectedMatch.profile.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-light transition-colors"
                                >
                                    <span className="text-xl">💼</span>
                                    <span className="text-primary">LinkedIn Profile</span>
                                </a>
                            )}
                            {selectedMatch.profile.website_url && (
                                <a
                                    href={selectedMatch.profile.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-light transition-colors"
                                >
                                    <span className="text-xl">🌐</span>
                                    <span className="text-primary">Website</span>
                                </a>
                            )}
                            {!selectedMatch.profile.email &&
                                !selectedMatch.profile.phone &&
                                !selectedMatch.profile.linkedin_url &&
                                !selectedMatch.profile.website_url && (
                                    <p className="text-gray-400 text-center py-4">No contact info shared</p>
                                )}
                        </div>

                        <button
                            onClick={() => setSelectedMatch(null)}
                            className="btn btn-primary w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}
