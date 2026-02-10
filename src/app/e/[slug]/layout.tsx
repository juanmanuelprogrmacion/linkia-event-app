'use client'

import { MatchNotifier } from '@/app/components/match-notifier'
import { useParams } from 'next/navigation'

export default function EventLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const params = useParams()
    const slug = params.slug as string

    return (
        <div className="min-h-dvh flex flex-col">
            <MatchNotifier eventSlug={slug} />
            {children}
        </div>
    )
}
