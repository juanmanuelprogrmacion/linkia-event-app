'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session-context'
import { upsertProfile, uploadPhoto, getOwnProfile } from '@/lib/api'
import { compressImage } from '@/lib/image-utils'

const LOOKING_FOR_OPTIONS = [
  'Networking',
  'Contratar',
  'Busco empleo',
  'Invertir',
  'Co-founder',
  'Partners',
  'Mentoría',
  'Colaborar',
] as const

const COUNTRY_CODES = [
  { code: '54', country: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  { code: '34', country: 'España', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: '52', country: 'México', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: '57', country: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}' },
  { code: '56', country: 'Chile', flag: '\u{1F1E8}\u{1F1F1}' },
  { code: '1', country: 'EEUU', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: '55', country: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: '51', country: 'Perú', flag: '\u{1F1F5}\u{1F1EA}' },
  { code: '44', country: 'Reino Unido', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: '49', country: 'Alemania', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: '33', country: 'Francia', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: '351', country: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { isLoading: sessionLoading, isAuthenticated, setProfileComplete, logout } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState('54')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [consent, setConsent] = useState(false)

  const [formData, setFormData] = useState({
    display_name: '',
    headline: '',
    company: '',
    bio: '',
    linkedin_url: '',
  })

  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [sessionLoading, isAuthenticated, router])

  // Pre-fill form if profile exists
  useEffect(() => {
    if (sessionLoading || !isAuthenticated) return

    async function loadProfile() {
      try {
        const profile = await getOwnProfile()
        if (!profile) {
          setProfileLoading(false)
          return
        }

        setIsEditMode(true)
        setConsent(true)
        setFormData({
          display_name: profile.display_name || '',
          headline: profile.headline || '',
          company: profile.company || '',
          bio: profile.bio || '',
          linkedin_url: profile.linkedin_url || '',
        })
        setPhotoUrl(profile.photo_url || null)
        setLookingFor(profile.looking_for || [])

        // Parse whatsapp_number back into country code + local number
        if (profile.whatsapp_number) {
          const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
          const matched = sortedCodes.find((c) => profile.whatsapp_number.startsWith(c.code))
          if (matched) {
            setCountryCode(matched.code)
            setPhoneNumber(profile.whatsapp_number.slice(matched.code.length))
          } else {
            setPhoneNumber(profile.whatsapp_number)
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [sessionLoading, isAuthenticated])

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function toggleLookingFor(tag: string) {
    setLookingFor((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const compressed = await compressImage(file)
      const url = await uploadPhoto(compressed)
      setPhotoUrl(url)
      if (errors.photo) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.photo
          return next
        })
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        photo: error instanceof Error ? error.message : 'No se pudo subir la foto',
      }))
    } finally {
      setIsUploading(false)
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!photoUrl) newErrors.photo = 'La foto es obligatoria'
    if (formData.display_name.trim().length < 2)
      newErrors.display_name = 'El nombre debe tener al menos 2 caracteres'
    if (formData.headline.trim().length < 2)
      newErrors.headline = 'El titular es obligatorio'
    if (!phoneNumber.trim()) {
      newErrors.whatsapp = 'El WhatsApp es obligatorio'
    } else {
      const digitsOnly = phoneNumber.replace(/[\s\-()]/g, '')
      if (!/^\d{6,15}$/.test(digitsOnly)) {
        newErrors.whatsapp = 'Ingresa un número válido (solo dígitos)'
      }
    }
    if (!consent)
      newErrors.consent = 'Debes aceptar para continuar'

    if (formData.linkedin_url && !formData.linkedin_url.includes('linkedin.com/')) {
      newErrors.linkedin_url = 'Ingresa una URL de LinkedIn válida'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0]
      const errorId = firstErrorKey === 'photo' ? 'photo-upload' : `field-${firstErrorKey}`
      requestAnimationFrame(() => {
        document.getElementById(errorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }

    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const whatsappNumber = `${countryCode}${phoneNumber.replace(/[\s\-()]/g, '')}`

    try {
      setIsSubmitting(true)
      await upsertProfile({
        display_name: formData.display_name.trim(),
        headline: formData.headline.trim(),
        company: formData.company.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        photo_url: photoUrl || undefined,
        linkedin_url: formData.linkedin_url.trim() || undefined,
        whatsapp_number: whatsappNumber,
        looking_for: lookingFor.length > 0 ? lookingFor : undefined,
      })
      setProfileComplete(true)
      router.push('/descubrir')
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'No se pudo guardar el perfil',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sessionLoading || profileLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-11 h-11 spinner" />
      </main>
    )
  }

  return (
    <main className="min-h-dvh safe-top safe-bottom">
      <div className="ambient-glow" />
      <div className="relative z-10 max-w-md mx-auto px-5 py-6 smooth-scroll">
        {/* Back button (edit mode only) */}
        {isEditMode && (
          <button
            onClick={() => router.push('/descubrir')}
            className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-5 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-[56px] h-[56px] rounded-[16px] bg-accent/10 mb-5">
            <span className="material-symbols-outlined text-accent text-[26px]">
              {isEditMode ? 'edit' : 'badge'}
            </span>
          </div>
          <h1 className="text-[1.625rem] font-bold tracking-[-0.02em] mb-1.5">
            {isEditMode ? 'Edita tu perfil' : 'Crea tu perfil'}
          </h1>
          <p className="text-ink-secondary text-[0.9375rem] font-light">
            Visible para otros asistentes del evento
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo upload */}
          <div id="photo-upload" className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="relative w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-dashed border-ink-muted/40 hover:border-accent/60 transition-all duration-300 hover:shadow-[0_0_28px_rgba(19,146,236,0.12)] group"
            >
              {photoUrl ? (
                <>
                  <Image src={photoUrl} alt="Perfil" fill className="object-cover" sizes="120px" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-ink-muted group-hover:text-accent transition-colors">
                  {isUploading ? (
                    <div className="w-7 h-7 spinner" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[32px] mb-1.5">photo_camera</span>
                      <span className="text-xs font-medium">Foto *</span>
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
            {errors.photo && (
              <p className="text-destructive text-sm mt-2.5 animate-fade-in">{errors.photo}</p>
            )}
          </div>

          {/* Public info */}
          <div className="glass rounded-2xl p-5 space-y-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="font-semibold text-xs text-ink-muted uppercase tracking-[0.1em]">
              Información pública
            </h2>

            <div id="field-display_name">
              <label className="block text-sm font-medium mb-1.5 tracking-[-0.01em]">Nombre *</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => updateField('display_name', e.target.value)}
                placeholder="Tu nombre"
                maxLength={50}
                className="input"
              />
              {errors.display_name && (
                <p className="text-destructive text-sm mt-1.5 animate-fade-in">{errors.display_name}</p>
              )}
            </div>

            <div id="field-headline">
              <label className="block text-sm font-medium mb-1.5 tracking-[-0.01em]">Titular *</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => updateField('headline', e.target.value)}
                placeholder="ej. CTO en Startup X"
                maxLength={100}
                className="input"
              />
              {errors.headline && (
                <p className="text-destructive text-sm mt-1.5 animate-fade-in">{errors.headline}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 tracking-[-0.01em]">Empresa</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="Nombre de tu empresa"
                maxLength={50}
                className="input"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium mb-1.5">
                <span className="tracking-[-0.01em]">Bio</span>
                <span className="text-ink-muted font-normal text-xs tabular-nums">
                  {formData.bio.length}/280
                </span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => {
                  if (e.target.value.length <= 280) updateField('bio', e.target.value)
                }}
                placeholder="Cuéntale a otros sobre ti..."
                rows={3}
                className="input resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 tracking-[-0.01em]">LinkedIn</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => updateField('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/tu-perfil"
                className="input"
              />
              {errors.linkedin_url && (
                <p className="text-destructive text-sm mt-1.5 animate-fade-in">{errors.linkedin_url}</p>
              )}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2.5">
              <h2 className="font-semibold text-xs text-ink-muted uppercase tracking-[0.1em]">
                WhatsApp
              </h2>
              <span className="text-[11px] font-medium bg-accent/15 text-accent px-2.5 py-0.5 rounded-full">
                Solo con match
              </span>
            </div>
            <p className="text-xs text-ink-muted font-light leading-relaxed">
              Tu número solo será visible cuando ambos conecten
            </p>

            <div id="field-whatsapp" className="flex gap-2.5 items-center">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="input shrink-0 grow-0 basis-[100px] text-center px-2"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} +{c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value)
                  if (errors.whatsapp) {
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.whatsapp
                      return next
                    })
                  }
                }}
                placeholder="11 5555 1234"
                className="input min-w-0 flex-1"
              />
            </div>
            {errors.whatsapp && (
              <p className="text-destructive text-sm animate-fade-in">{errors.whatsapp}</p>
            )}
            {phoneNumber && (
              <p className="text-xs text-ink-muted font-light">
                Tu enlace: wa.me/{countryCode}{phoneNumber.replace(/[\s\-()]/g, '')}
              </p>
            )}
          </div>

          {/* Looking for */}
          <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="font-semibold text-xs text-ink-muted uppercase tracking-[0.1em]">
              ¿Qué buscas?
            </h2>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleLookingFor(tag)}
                  className={`tag cursor-pointer ${
                    lookingFor.includes(tag) ? 'tag-selected' : 'hover:border-ink-muted/60 active:scale-95'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3.5 px-1 cursor-pointer animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                if (errors.consent) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.consent
                    return next
                  })
                }
              }}
              className="mt-0.5"
            />
            <span className="text-sm text-ink-secondary font-light leading-relaxed">
              Acepto compartir mi perfil y datos de contacto con otros asistentes del evento
            </span>
          </label>
          {errors.consent && (
            <p className="text-destructive text-sm px-1 animate-fade-in">{errors.consent}</p>
          )}

          {/* Submit error */}
          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 animate-scale-in">
              <p className="text-destructive text-sm text-center">{errors.submit}</p>
            </div>
          )}

          {/* Submit */}
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full h-[52px] text-[1.0625rem] tracking-[-0.01em] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2.5">
                  <span className="w-5 h-5 spinner" style={{ borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  Guardando...
                </span>
              ) : isEditMode ? (
                'Guardar cambios'
              ) : (
                'Empezar a conectar'
              )}
            </button>
          </div>
        </form>

        {/* Logout */}
        <button
          onClick={async () => {
            await logout()
            router.replace('/')
          }}
          className="w-full mt-10 py-3 text-sm text-ink-muted hover:text-destructive transition-colors active:scale-95 font-light"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  )
}
