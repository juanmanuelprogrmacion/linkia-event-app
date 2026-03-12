---
title: "feat: Linker Single-Event MVP"
type: feat
status: active
date: 2026-03-10
deadline: 2026-03-26
origin: docs/brainstorms/2026-03-10-linker-mvp-brainstorm.md
---

# feat: Linker Single-Event MVP

## Overview

Build a mobile-first PWA networking app for a single professional event (~1500 attendees, March 26 2026). Attendees scan a QR code at the venue, create a quick profile, swipe through other attendees to connect, and when both match they get each other's info with a direct WhatsApp link.

This is a rebuild of the existing `linkia-event-app` codebase. We reuse the Framer Motion swipe mechanics, API client pattern, and Supabase backend — but simplify the architecture from multi-event to single-event, kill in-app chat, and apply a new warm design system.

(see brainstorm: `docs/brainstorms/2026-03-10-linker-mvp-brainstorm.md`)

## Problem Statement / Motivation

The client has a specific event on March 26 and wants to test this networking concept. The existing codebase was over-engineered for a multi-event platform with features that aren't needed. We need to ship a focused, polished single-event app in 16 days.

## Proposed Solution

Strip the app to its essence: **QR → Profile → Swipe → Match → WhatsApp**. Single event hardcoded via env var. No event discovery, no access codes, no in-app chat. All UI in Spanish.

---

## Implementation Phases

### Phase 1: Foundation (Days 1-3)

Clean up the codebase, update design system, fix routing.

#### 1.1 Flatten routing structure

Remove the `e/[slug]/` dynamic routing. The app is single-event.

**Current:**
```
src/app/page.tsx                    → event listing (delete)
src/app/e/[slug]/page.tsx           → event landing
src/app/e/[slug]/discover/page.tsx  → swipe feed
src/app/e/[slug]/matches/page.tsx   → connections
src/app/e/[slug]/profile/page.tsx   → profile editor
src/app/e/[slug]/layout.tsx         → event layout
```

**Target:**
```
src/app/page.tsx                    → entry point (session check → profile or discover)
src/app/descubrir/page.tsx          → swipe feed
src/app/conexiones/page.tsx         → connections list
src/app/perfil/page.tsx             → profile creation/edit
src/app/layout.tsx                  → root layout (SessionProvider wraps everything)
```

**Files to delete:**
- `src/app/components/EventCard.tsx`
- `src/app/components/CodeModal.tsx`
- `src/app/e/` (entire directory, after extracting reusable code)

#### 1.2 Simplify API client (`src/lib/api.ts`)

- Add `EVENT_SLUG` env var: `NEXT_PUBLIC_EVENT_SLUG` — hardcoded for this event
- Remove `getEvents()`, `validateEventCode()`, `EventInfo` interface
- Remove `eventSlug` parameter from all functions — use the env var internally
- Add new fields to `ProfileData`: `company`, `whatsapp_number`, `looking_for: string[]`
- Add `whatsapp_number` to `ProfileWithContact` and `Match` types
- Simplify storage key to fixed `linker_session` (no slug suffix)

#### 1.3 Update session context (`src/lib/session-context.tsx`)

- Remove `eventSlug` prop from `SessionProvider` — read from env
- Wrap the root layout with `SessionProvider` so all pages have session access
- Add `profileId` to context (needed for identifying current user)

#### 1.4 Apply new design system to `globals.css`

Replace the cold blue-black tokens with warm charcoal palette from `.interface-design/system.md`:

```css
@theme {
  --color-background: #141516;
  --color-surface: #1e1f21;
  --color-surface-elevated: #272829;
  --color-ink: #f5f5f4;
  --color-ink-secondary: #a8a29e;
  --color-ink-muted: #6b6560;
  --color-accent: #1392ec;
  --color-accent-hover: #0d7ed4;
  --color-connect: #10b981;
  --color-skip: #a8a29e;
  --color-destructive: #ef4444;
  --color-border-subtle: rgba(255, 255, 255, 0.06);
}
```

- Update button border-radius from `9999px` to `12px` (tags stay pill-shaped)
- Switch from Google Fonts (Plus Jakarta Sans) to system font stack
- Keep Material Symbols Outlined icons
- Update all utility classes (`.btn-*`, `.input`, `.glass`, etc.) to use new tokens

#### 1.5 Environment setup

Add to `.env.local`:
```
NEXT_PUBLIC_EVENT_SLUG=<slug-for-the-event>
```

---

### Phase 2: Profile Creation (Days 3-5)

#### 2.1 Profile creation page (`src/app/perfil/page.tsx`)

Full-screen mobile form with the following fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Foto | Image upload | Yes | Client-side compress to max 500KB, 800px width, JPEG. Use `<input type="file" accept="image/*" capture="environment">` |
| Nombre | Text | Yes | 2-50 chars |
| Titular | Text | Yes | 2-100 chars (e.g. "CTO en Startup X") |
| Empresa | Text | No | Max 50 chars |
| Bio | Textarea | No | Max 280 chars, show char counter |
| LinkedIn | URL | No | Must start with `linkedin.com/` or be empty |
| WhatsApp | Phone | Yes | Country code picker (default +34 Spain) + number field. Store in E.164 format (e.g. `34612345678`). Strip spaces/dashes. |
| Busco | Tag picker | No | Multi-select from predefined list |

**Predefined "Busco" tags (Spanish):**
- Networking
- Contratar
- Busco empleo
- Invertir
- Co-founder
- Partners
- Mentoría
- Colaborar

**UX details:**
- Photo upload appears first — large circular area with camera icon, tap to capture/upload
- Client-side image compression before upload (use canvas resize)
- Show inline validation errors in Spanish
- "Guardar" button disabled until required fields valid
- Loading state on submit — disable button, show spinner
- On success → redirect to `/descubrir`
- On edit (returning user) → pre-fill all fields

#### 2.2 Photo upload with client-side compression

Create `src/lib/image-utils.ts`:
- `compressImage(file: File, maxWidth: number, maxSizeKB: number): Promise<File>`
- Resize using canvas, convert to JPEG, iterate quality until under size limit
- Handle HEIC from iPhones (convert to JPEG)

#### 2.3 WhatsApp number input component

Create a reusable phone input with country code picker:
- Default country: Spain (+34) — configurable via prop
- Common countries at top: Spain, Mexico, Colombia, Argentina, Chile, USA
- Strip formatting, store as digits only (e.g. `34612345678`)
- Generate `wa.me` link: `https://wa.me/${digits}`
- Show preview: "Tu enlace de WhatsApp: wa.me/34612345678"

---

### Phase 3: Discover Feed (Days 5-8)

#### 3.1 Swipe feed page (`src/app/descubrir/page.tsx`)

Reuse the existing `SwipeableCard` Framer Motion mechanics from `src/app/e/[slug]/discover/page.tsx` but with:

**New card design — "Badge Card":**
```
┌─────────────────────────────┐
│                             │
│  ┌────────┐  Nombre         │
│  │  FOTO  │  Titular        │
│  │        │  Empresa        │
│  └────────┘                 │
│                             │
│  Bio text...                │
│                             │
│  [Tag] [Tag] [Tag]          │
│                             │
│  🔗 LinkedIn                │
│                             │
└─────────────────────────────┘
```

- Photo is **square with 12px radius**, NOT full-bleed
- Identity info (name, headline, company) sits beside the photo — badge layout
- Bio below, truncated to 3 lines with "ver más" expand
- "Busco" tags as pills at bottom
- LinkedIn as a small tappable link (opens in new tab)
- **WhatsApp number NOT visible on card** — only shown post-match

**Feed behavior:**
- Fetch in batches of 20 via `get-feed?limit=20`
- Prefetch next batch when 5 cards remain
- Swipe right = Connect, swipe left = Skip
- Drag threshold: 100px (keep existing)
- Show directional indicators during drag ("CONECTAR" / "PASAR")
- Action buttons below card: Skip (neutral gray) and Connect (accent blue)
- Skipped profiles do NOT reappear (permanent for v1)

**States:**
- Loading: skeleton card shimmer
- Empty feed: friendly message "Has visto a todos por ahora. ¡Vuelve más tarde!" with a "Actualizar" button
- Error: inline retry message
- No profile: redirect to `/perfil`

#### 3.2 Match popup component

When `submitSwipe` returns `is_match: true`:
- Overlay with warm glow background (`.celebratory-gradient` updated to warm tones)
- "¡Conexión!" heading
- Both profile photos side by side
- Matched person's name and headline
- Two CTAs:
  - "Enviar WhatsApp" → opens `wa.me/<number>` with prefilled message: "¡Hola! Nos conectamos en [Event Name] 🤝"
  - "Seguir descubriendo" → dismisses, continues swiping
- Auto-dismiss after 8 seconds if no action

#### 3.3 Top navigation bar

Slim bar at top of discover page:
- Left: user's avatar (tap → `/perfil`)
- Center: "Linker" or event name
- Right: connections icon with badge count (tap → `/conexiones`)

---

### Phase 4: Connections (Days 8-10)

#### 4.1 Connections page (`src/app/conexiones/page.tsx`)

List of all matches, ordered by most recent first.

**Each connection card:**
```
┌──────────────────────────────────┐
│  [Avatar]  Name                  │
│            Headline · Company    │
│            Hace 2 horas          │
│                     [WhatsApp]   │
└──────────────────────────────────┘
```

- Avatar: small circle (48px)
- Name + headline + company
- Relative timestamp ("Hace 5 min", "Hace 2 horas")
- WhatsApp button: green, opens `wa.me/<number>` with prefilled message
- Tap on the card itself → expand to show full profile (bio, LinkedIn, tags)
- LinkedIn link visible in expanded view

**States:**
- Loading: skeleton list
- Empty: "Aún no tienes conexiones. ¡Empieza a descubrir!" with link to `/descubrir`
- Error: inline retry

#### 4.2 Match notification (in-app only)

Reuse and simplify `match-notifier.tsx`:
- Poll `getMatches` every 15 seconds (increased from 10 to reduce load)
- Show toast notification for new matches: "Nueva conexión con [Name]"
- Tap toast → go to `/conexiones`
- No push notifications for v1

---

### Phase 5: PWA Setup (Days 10-11)

#### 5.1 Update manifest (`public/manifest.json`)

```json
{
  "name": "Linker",
  "short_name": "Linker",
  "description": "Networking para eventos",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#141516",
  "theme_color": "#141516",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

#### 5.2 Create PWA icons

Generate Linker icon set (192px, 512px, maskable) — simple, recognizable mark.

#### 5.3 Basic service worker

Minimal service worker for app shell caching:
- Cache: HTML shell, CSS, JS bundles, fonts
- Network-first for API calls
- Stale-while-revalidate for profile photos
- No offline-first for data — the app needs connectivity for swipes

#### 5.4 Root layout metadata

Update `src/app/layout.tsx`:
- Title: "Linker"
- Description: "Networking para eventos"
- Apple web app capable
- Theme color: `#141516`
- Viewport: prevent zoom, safe area insets

---

### Phase 6: Backend Adjustments (Days 11-13)

These are Supabase Edge Function changes (outside this repo, but need to be planned).

#### 6.1 Update `profiles` table

Add columns:
- `company` (text, nullable)
- `whatsapp_number` (text, not null)
- `looking_for` (text[], nullable)

#### 6.2 Update `upsert-profile` Edge Function

Accept and store new fields.

#### 6.3 Update `get-feed` Edge Function

Return `company` and `looking_for` in profile response. Ensure pagination works with `LIMIT` and `OFFSET` or cursor-based. Exclude already-swiped profiles efficiently (index on `swipes(swiper_id, swiped_id)`).

#### 6.4 Update `get-matches` Edge Function

Return `whatsapp_number` in the match contact profile.

#### 6.5 Add basic rate limiting

`submit-swipe`: max 10 swipes per 30 seconds per session. Return 429 if exceeded.

#### 6.6 Event time gating

`create-session`: check `events.is_active` and `events.starts_at`/`ends_at`. Return appropriate error if event hasn't started or has ended.

#### 6.7 Photo storage

Use Supabase Storage with signed URLs (not public bucket). Generate short-lived signed URLs in `get-feed` and `get-matches` responses.

---

### Phase 7: Polish & Testing (Days 13-16)

#### 7.1 Entry flow logic (`src/app/page.tsx`)

The root page decides where to send the user:
1. Check for existing session token
2. If token → call `createSession` to validate
3. If valid + profile complete → redirect to `/descubrir`
4. If valid + profile incomplete → redirect to `/perfil`
5. If no token → create new session, redirect to `/perfil`
6. If event not active → show "El evento aún no ha comenzado" or "El evento ha finalizado"

#### 7.2 Error states

Add Spanish error messages for every API failure:
- Network error: "Sin conexión. Verifica tu internet."
- Session expired: "Tu sesión ha expirado. Recargando..." (auto-refresh)
- Upload failed: "No se pudo subir la foto. Intenta de nuevo."
- Swipe failed: "Error al enviar. Intenta de nuevo." (with retry)
- Feed failed: "No se pudieron cargar perfiles. Intenta de nuevo."

#### 7.3 Loading states

- Profile page: button disabled + spinner on submit
- Discover: skeleton card while loading
- Connections: skeleton list while loading
- Photo upload: progress indicator (or at least spinner)

#### 7.4 Mobile testing

Test at 375px width (iPhone SE) and 390px (iPhone 14):
- Swipe gesture feels natural
- Cards don't overflow
- Photo upload works from camera and gallery
- WhatsApp deep links open correctly
- PWA installs and works in standalone mode
- Safe area insets on notched phones

#### 7.5 Performance for 1500 users

- Profile photos: compressed client-side to max 500KB
- Feed: paginated in batches of 20
- Match polling: every 15 seconds (not 10)
- Images: lazy load with `loading="lazy"`
- Minimize JS bundle: no unnecessary dependencies

#### 7.6 Consent & privacy

Add to profile creation page:
- Checkbox: "Acepto compartir mi perfil y datos de contacto con otros asistentes del evento"
- Required to proceed
- Brief text linking to a simple privacy notice

#### 7.7 QR code generation

Generate a QR code pointing to the deployed app URL. Provide as printable asset for the venue.

---

## Technical Considerations

### Architecture
- Single-event, no dynamic routing complexity
- All pages are client components (`'use client'`) since they depend on session state and browser APIs
- `SessionProvider` at root layout — all pages access session via `useSession()`
- API client reads `NEXT_PUBLIC_EVENT_SLUG` from env — no slug passing needed

### Performance
- Feed query: `WHERE profile_id NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = $1)` — needs index on `swipes(swiper_id)`
- 1500 users × 1500 potential swipes = 2.25M swipes max — PostgreSQL handles this fine with proper indexing
- Photo CDN: Supabase Storage with image transformations (resize on-the-fly) if available, otherwise client-side compression is sufficient
- Venue WiFi: optimistic UI for swipes (show next card immediately, sync in background)

### Security
- WhatsApp numbers only visible to matches (never in feed response)
- Bearer token per session, no password
- Rate limit swipes to prevent spam-connecting
- Signed URLs for photos (not public bucket)
- Sanitize all profile text inputs (XSS prevention)
- HTTPS only (enforced by Vercel/hosting)

## System-Wide Impact

- **Database**: Add 3 columns to `profiles`, add index on `swipes(swiper_id)`. No new tables needed.
- **Edge Functions**: 4 functions need updates (`create-session`, `upsert-profile`, `get-feed`, `get-matches`). 2 functions can be deleted (`get-events`, `validate-code`).
- **Frontend**: Near-complete rewrite of pages, preserving swipe mechanics and API patterns.

## Acceptance Criteria

- [ ] User scans QR → app opens → creates profile in under 2 minutes
- [ ] Profile photo uploads and displays correctly on cards
- [ ] Swipe right = connect, swipe left = skip, both gesture and buttons work
- [ ] Mutual connect triggers match popup with "¡Conexión!"
- [ ] Match popup shows WhatsApp link that opens correctly
- [ ] Connections page lists all matches with working WhatsApp deep links
- [ ] All UI text is in Spanish
- [ ] App works as installable PWA (standalone mode)
- [ ] Works on iPhone Safari and Android Chrome at 375px width
- [ ] Handles 1500 profiles without performance issues (paginated feed)
- [ ] WhatsApp numbers stored in E.164 format, wa.me links work
- [ ] Photos compressed client-side before upload
- [ ] Privacy consent checkbox on profile creation

## Success Metrics

- App deployed and QR code printed before March 26
- 50%+ of attendees create a profile
- Average time from QR scan to first swipe < 3 minutes
- WhatsApp deep links work on both iOS and Android

## Dependencies & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Venue WiFi overload | App unusable | Optimistic UI, compressed photos, paginated feeds |
| WhatsApp number format errors | Broken connections | Country code picker + validation + preview |
| 16-day timeline | Incomplete features | Strict MVP scope, no scope creep |
| Supabase Edge Function cold starts | Slow first load | Pre-warm before event, keep functions lightweight |
| iOS PWA localStorage expiry | Lost sessions | Encourage PWA install; sessions survive if installed |
| Duplicate profiles (lost sessions) | Messy feed | Accept for v1; show "profile already exists" warning if device_hash matches |

## Sources & References

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-10-linker-mvp-brainstorm.md](docs/brainstorms/2026-03-10-linker-mvp-brainstorm.md) — Key decisions: single event, no chat (WhatsApp instead), device-based auth, predefined tags, warm venue dark design
- **Design system:** [.interface-design/system.md](.interface-design/system.md) — Color tokens, card anatomy, typography, spacing

### Internal References
- Swipe mechanics: `src/app/e/[slug]/discover/page.tsx` (SwipeableCard, MatchPopup components)
- API contract: `src/lib/api.ts` (all Edge Function endpoints)
- Session management: `src/lib/session-context.tsx`
- Design tokens: `src/app/globals.css`
- Database schema: `MANU INFO/ERD_DIAGRAM.md`

### Reusable from existing codebase
- Framer Motion swipe card with drag gestures and directional indicators
- API client pattern (fetch + bearer token + error handling)
- Session context (simplified for single event)
- CSS utility classes (`.glass`, `.skeleton`, `.safe-bottom`, swipe indicators)
- Match notifier polling pattern
