'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createSession, resumeSession, getStoredToken, clearToken } from '@/lib/api'

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
  initSession: () => Promise<boolean>
  loginWithToken: (token: string) => Promise<boolean>
  logout: () => Promise<void>
  setProfileComplete: (complete: boolean) => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    const init = async () => {
      const storedToken = getStoredToken()
      if (storedToken) {
        try {
          const session = await resumeSession(storedToken)
          setToken(session.token)
          setEvent(session.event)
          setProfileComplete(session.profile_complete)
        } catch (error) {
          console.error('Error al recuperar sesión:', error)
          clearToken()
        }
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const initSession = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const session = await createSession()
      setToken(session.token)
      setEvent(session.event)
      setProfileComplete(session.profile_complete)
      return session.profile_complete
    } catch (error) {
      console.error('Error al crear sesión:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithToken = async (manualToken: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const session = await resumeSession(manualToken)
      setToken(session.token)
      setEvent(session.event)
      setProfileComplete(session.profile_complete)
      return session.profile_complete
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      clearToken()
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    clearToken()
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
        loginWithToken,
        logout,
        setProfileComplete,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider')
  }
  return context
}
