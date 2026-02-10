'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { upsertProfile, uploadPhoto, getStoredToken } from '@/lib/api'

export default function ProfileSetupPage() {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isLoading, setIsLoading] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const [formData, setFormData] = useState({
        display_name: '',
        headline: '',
        bio: '',
        email: '',
        phone: '',
        linkedin_url: '',
        website_url: ''
    })

    // Check token on mount
    useEffect(() => {
        if (!getStoredToken(slug)) {
            router.push(`/e/${slug}`)
            return
        }
        setIsMounted(true)
    }, [slug, router])

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)
            const url = await uploadPhoto(slug, file)
            setPhotoUrl(url)
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to upload photo')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.display_name.trim()) {
            alert('Please enter your name')
            return
        }

        try {
            setIsLoading(true)
            await upsertProfile(slug, {
                ...formData,
                photo_url: photoUrl || undefined
            })
            router.push(`/e/${slug}/discover`)
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save profile')
        } finally {
            setIsLoading(false)
        }
    }

    // Show loading until mounted and token verified
    if (!isMounted) {
        return (
            <main className="min-h-dvh flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-dvh p-6 safe-top safe-bottom">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Create Your Profile</h1>
                    <p className="text-gray-400">This info will be visible to other attendees</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Photo upload */}
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-gray-600 hover:border-primary transition-colors"
                        >
                            {photoUrl ? (
                                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    {isUploading ? (
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="text-3xl mb-1">📷</span>
                                            <span className="text-xs">Add Photo</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Public info section */}
                    <div className="glass rounded-2xl p-5 space-y-4">
                        <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Public Info</h2>

                        <div>
                            <label className="block text-sm font-medium mb-1">Name *</label>
                            <input
                                type="text"
                                value={formData.display_name}
                                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                placeholder="Your name"
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Headline</label>
                            <input
                                type="text"
                                value={formData.headline}
                                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                placeholder="e.g., CTO @ Startup"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell others about yourself..."
                                rows={3}
                                className="input resize-none"
                            />
                        </div>
                    </div>

                    {/* Private info section */}
                    <div className="glass rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Contact Info</h2>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Match Only</span>
                        </div>
                        <p className="text-xs text-gray-500 -mt-2 mb-4">Only visible after a mutual match</p>

                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your@email.com"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">LinkedIn</label>
                            <input
                                type="url"
                                value={formData.linkedin_url}
                                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                placeholder="https://linkedin.com/in/yourprofile"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Website</label>
                            <input
                                type="url"
                                value={formData.website_url}
                                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                placeholder="https://yourwebsite.com"
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading || !formData.display_name.trim()}
                        className="btn btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Start Networking'}
                    </button>
                </form>
            </div>
        </main>
    )
}
