'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { getEvents, EventInfo } from '@/lib/api'
import { EventCard } from './components/EventCard'
import { CodeModal } from './components/CodeModal'

export default function HomePage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventList = await getEvents()
        setEvents(eventList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events')
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])

  const handleCheckIn = (event: EventInfo) => {
    setSelectedEvent(event)
  }

  const handleCodeSuccess = (event: EventInfo) => {
    setSelectedEvent(null)
    router.push(`/e/${event.slug}`)
  }

  if (isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Cargando eventos...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-semibold mb-2">Error</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">LinkiaEvent</span>
          </h1>
          <p className="text-text-secondary">
            Conecta con profesionales en eventos en vivo
          </p>
        </motion.div>
      </header>

      {/* Events Grid */}
      <section className="flex-1 px-4 pb-8">
        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">No hay eventos activos</h2>
            <p className="text-text-secondary">
              Vuelve pronto para ver nuevos eventos
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 max-w-2xl mx-auto"
          >
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EventCard
                  event={event}
                  onCheckIn={handleCheckIn}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Footer */}
      <footer className="px-6 pb-8 text-center">
        <p className="text-xs text-text-secondary">
          🔒 Sin login • Networking anónimo
        </p>
      </footer>

      {/* Code Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <CodeModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onSuccess={handleCodeSuccess}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
