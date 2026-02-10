'use client'

import { EventInfo } from '@/lib/api'

interface EventCardProps {
    event: EventInfo
    onCheckIn: (event: EventInfo) => void
}

export function EventCard({ event, onCheckIn }: EventCardProps) {
    const startDate = new Date(event.starts_at)
    const endDate = new Date(event.ends_at)

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        })
    }

    const isOngoing = new Date() >= startDate && new Date() <= endDate
    const isUpcoming = new Date() < startDate

    return (
        <div className="relative overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10 transition-all hover:ring-primary/50 hover:scale-[1.02]">
            {/* Cover Image */}
            <div className="relative h-40 overflow-hidden">
                {event.cover_image_url ? (
                    <img
                        src={event.cover_image_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <span className="text-5xl">🎪</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {event.is_virtual ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/80 text-white backdrop-blur-sm">
                            🌐 Virtual
                        </span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/80 text-white backdrop-blur-sm">
                            📍 Presencial
                        </span>
                    )}
                    {isOngoing && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/80 text-white backdrop-blur-sm animate-pulse">
                            🔴 Live
                        </span>
                    )}
                </div>

                {/* Participant count */}
                <div className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full bg-black/50 text-white backdrop-blur-sm">
                    👥 {event.participant_count}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-lg font-bold mb-1 line-clamp-1">{event.name}</h3>
                {event.description && (
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {event.description}
                    </p>
                )}

                <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
                    <span className="flex items-center gap-1">
                        📅 {formatDate(startDate)} - {formatDate(endDate)}
                    </span>
                    {event.location && (
                        <span className="flex items-center gap-1 truncate">
                            📍 {event.location}
                        </span>
                    )}
                </div>

                <button
                    onClick={() => onCheckIn(event)}
                    className="btn btn-primary w-full"
                >
                    Check-in →
                </button>
            </div>
        </div>
    )
}
