// API client for Linker — All calls via Supabase Edge Functions

import { supabase } from './supabase'

const EVENT_SLUG = process.env.NEXT_PUBLIC_EVENT_SLUG!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const STORAGE_KEY = 'linker_session'

// --- Types ---

export interface SessionResponse {
  session_id: string
  token: string
  event: { id: string; name: string; slug: string }
  profile_exists: boolean
  profile_complete: boolean
}

export interface ProfileData {
  display_name: string
  headline: string
  company?: string
  bio?: string
  photo_url?: string
  linkedin_url?: string
  whatsapp_number: string
  looking_for?: string[]
}

export interface Profile {
  id: string
  display_name: string
  headline?: string
  company?: string
  bio?: string
  photo_url?: string
  looking_for?: string[]
  linkedin_url?: string
}

export interface ProfileWithContact extends Profile {
  whatsapp_number?: string
}

export interface SwipeResult {
  success: boolean
  is_match: boolean
  match?: {
    id: string
    created_at: string
    contact: ProfileWithContact
  }
}

export interface Match {
  id: string
  created_at: string
  profile: ProfileWithContact
}

// --- Device fingerprint ---

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server'

  const components = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(),
  ]
  return components.join('|')
}

// --- Token storage ---

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// --- Edge Function invoke helper ---

async function invoke<T>(
  functionName: string,
  body: object,
  options?: { sendToken?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {}

  if (options?.sendToken !== false) {
    const token = getStoredToken()
    if (token) {
      headers['x-session-token'] = token
    }
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers,
  })

  if (error) {
    throw new Error(data?.error ?? error.message ?? 'Error de conexión')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data as T
}

// --- WhatsApp helpers ---

export function formatWhatsAppLink(number: string, eventName?: string): string {
  const message = eventName
    ? encodeURIComponent(`¡Hola! Nos conectamos en ${eventName} 🤝`)
    : ''
  return `https://wa.me/${number}${message ? `?text=${message}` : ''}`
}

// --- API calls ---

export async function createSession(): Promise<SessionResponse> {
  const deviceHash = getDeviceFingerprint()

  const data = await invoke<SessionResponse>('create-session', {
    event_slug: EVENT_SLUG,
    device_hash: deviceHash,
  }, { sendToken: false })

  storeToken(data.token)
  return data
}

export async function resumeSession(token: string): Promise<SessionResponse> {
  const { data, error } = await supabase.functions.invoke('create-session', {
    body: { token },
  })

  if (error || data?.error) {
    throw new Error(data?.error ?? 'Token inválido')
  }

  storeToken(data.token)
  return data as SessionResponse
}

export async function getOwnProfile(): Promise<ProfileData | null> {
  const token = getStoredToken()
  if (!token) return null

  try {
    const data = await invoke<{ profile: ProfileData | null }>('get-profile', {})
    return data.profile
  } catch {
    return null
  }
}

export async function upsertProfile(
  profileData: ProfileData
): Promise<{ profile: Profile; is_complete: boolean }> {
  return invoke<{ profile: Profile; is_complete: boolean }>('upsert-profile', profileData)
}

export async function getFeed(limit = 20): Promise<Profile[]> {
  try {
    const data = await invoke<{ profiles: Profile[] }>('get-feed', { limit })
    return data.profiles ?? []
  } catch {
    return []
  }
}

export async function submitSwipe(
  targetProfileId: string,
  action: 'connect' | 'skip'
): Promise<SwipeResult> {
  return invoke<SwipeResult>('submit-swipe', {
    target_profile_id: targetProfileId,
    action,
  })
}

export async function getMatches(): Promise<Match[]> {
  try {
    const data = await invoke<{ matches: Match[] }>('get-matches', {})
    return data.matches ?? []
  } catch {
    return []
  }
}

export async function uploadPhoto(file: File): Promise<string> {
  const token = getStoredToken()
  if (!token) throw new Error('Sin sesión activa')

  const formData = new FormData()
  formData.append('file', file)

  // Direct fetch because supabase.functions.invoke doesn't support FormData
  const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-session-token': token,
    },
    body: formData,
  })

  const data = await response.json()

  if (!response.ok || data.error) {
    throw new Error(data.error ?? 'No se pudo subir la foto')
  }

  return data.url
}
