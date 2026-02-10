'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createSession, getStoredToken, clearToken } from '@/lib/api'

interface Event {
    id: string
    name: string
    slug: string
}

interface SessionContextType {
    isLoading: boolean
    isAuthenticated: boolean
    token: string | null
    event: Event | null
    profileComplete: boolean
    initSession: (eventSlug: string) => Promise<boolean>
    logout: () => void
    setProfileComplete: (complete: boolean) => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children, eventSlug }: { children: ReactNode; eventSlug: string }) {
    const [isLoading, setIsLoading] = useState(true)
    const [token, setToken] = useState<string | null>(null)
    const [event, setEvent] = useState<Event | null>(null)
    const [profileComplete, setProfileComplete] = useState(false)

    useEffect(() => {
        const init = async () => {
            const storedToken = getStoredToken(eventSlug)
            if (storedToken) {
                // Resume existing session
                try {
                    const session = await createSession(eventSlug)
                    setToken(session.token)
                    setEvent(session.event)
                    setProfileComplete(session.profile_complete)
                } catch (error) {
                    console.error('Failed to resume session:', error)
                    clearToken(eventSlug)
                }
            }
            setIsLoading(false)
        }
        init()
    }, [eventSlug])

    const initSession = async (slug: string): Promise<boolean> => {
        try {
            setIsLoading(true)
            const session = await createSession(slug)
            setToken(session.token)
            setEvent(session.event)
            setProfileComplete(session.profile_complete)
            return session.profile_complete
        } catch (error) {
            console.error('Failed to create session:', error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        if (event) {
            clearToken(event.slug)
        }
        setToken(null)
        setEvent(null)
        setProfileComplete(false)
    }

    return (
        <SessionContext.Provider
            value={{
                isLoading,
                isAuthenticated: !!token,
                token,
                event,
                profileComplete,
                initSession,
                logout,
                setProfileComplete
            }}
        >
            {children}
        </SessionContext.Provider>
    )
}

export function useSession() {
    const context = useContext(SessionContext)
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider')
    }
    return context
}
