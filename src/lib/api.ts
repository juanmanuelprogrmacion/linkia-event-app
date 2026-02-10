// API client for LinkiaEvent Edge Functions

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

interface SessionResponse {
    session_id: string
    token: string
    event: { id: string; name: string; slug: string }
    profile_exists: boolean
    profile_complete: boolean
}

interface ProfileData {
    display_name: string
    headline?: string
    bio?: string
    photo_url?: string
    email?: string
    phone?: string
    linkedin_url?: string
    website_url?: string
}

interface Profile {
    id: string
    display_name: string
    headline?: string
    bio?: string
    photo_url?: string
}

interface ProfileWithContact extends Profile {
    email?: string
    phone?: string
    linkedin_url?: string
    website_url?: string
}

interface SwipeResult {
    success: boolean
    is_match: boolean
    match?: {
        id: string
        created_at: string
        contact: ProfileWithContact
    }
}

interface Match {
    id: string
    created_at: string
    profile: ProfileWithContact
}

// Generate device fingerprint
export function getDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server'

    const components = [
        navigator.userAgent,
        screen.width,
        screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        new Date().getTimezoneOffset()
    ]
    return components.join('|')
}

// Session storage helpers
const getStorageKey = (eventSlug: string) => `linkia_session_${eventSlug}`

export function getStoredToken(eventSlug: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(getStorageKey(eventSlug))
}

export function storeToken(eventSlug: string, token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(getStorageKey(eventSlug), token)
}

export function clearToken(eventSlug: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(getStorageKey(eventSlug))
}

// API calls
export async function createSession(eventSlug: string): Promise<SessionResponse> {
    const response = await fetch(`${FUNCTIONS_URL}/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_slug: eventSlug,
            device_fingerprint: getDeviceFingerprint()
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create session')
    }

    const data = await response.json()
    storeToken(eventSlug, data.token)
    return data
}

export async function upsertProfile(eventSlug: string, profileData: ProfileData): Promise<{ profile: Profile; is_complete: boolean }> {
    const token = getStoredToken(eventSlug)
    if (!token) throw new Error('No session token')

    const response = await fetch(`${FUNCTIONS_URL}/upsert-profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
    }

    return response.json()
}

export async function getFeed(eventSlug: string, limit = 10): Promise<Profile[]> {
    const token = getStoredToken(eventSlug)
    if (!token) throw new Error('No session token')

    const response = await fetch(`${FUNCTIONS_URL}/get-feed?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get feed')
    }

    const data = await response.json()
    return data.profiles
}

export async function submitSwipe(eventSlug: string, targetProfileId: string, action: 'connect' | 'skip'): Promise<SwipeResult> {
    const token = getStoredToken(eventSlug)
    if (!token) throw new Error('No session token')

    const response = await fetch(`${FUNCTIONS_URL}/submit-swipe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            target_profile_id: targetProfileId,
            action
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit swipe')
    }

    return response.json()
}

export async function getMatches(eventSlug: string): Promise<Match[]> {
    const token = getStoredToken(eventSlug)
    if (!token) throw new Error('No session token')

    const response = await fetch(`${FUNCTIONS_URL}/get-matches`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get matches')
    }

    const data = await response.json()
    return data.matches
}

export async function uploadPhoto(eventSlug: string, file: File): Promise<string> {
    const token = getStoredToken(eventSlug)
    if (!token) throw new Error('No session token')

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${FUNCTIONS_URL}/upload-photo`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload photo')
    }

    const data = await response.json()
    return data.photo_url
}

// Event discovery APIs
export interface EventInfo {
    id: string
    slug: string
    name: string
    description?: string
    location?: string
    starts_at: string
    ends_at: string
    cover_image_url?: string
    is_virtual: boolean
    participant_count: number
}

export async function getEvents(): Promise<EventInfo[]> {
    const response = await fetch(`${FUNCTIONS_URL}/get-events`, {
        method: 'GET'
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get events')
    }

    const data = await response.json()
    return data.events
}

export async function validateEventCode(eventSlug: string, code: string): Promise<{ valid: boolean; error?: string }> {
    const response = await fetch(`${FUNCTIONS_URL}/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_slug: eventSlug,
            access_code: code
        })
    })

    const data = await response.json()
    return { valid: data.valid ?? false, error: data.error }
}
