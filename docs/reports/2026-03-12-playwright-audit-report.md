# Playwright Audit Report — 2026-03-12

**App**: Linker
**Viewport**: 375px (mobile)
**Tool**: Playwright MCP + manual verification
**Result**: All critical flows passing after fixes

---

## Flows Tested

### 1. Entry Flow (Landing Page)
- Session check + redirect to `/perfil` or `/descubrir`
- Test Login button hidden in production (`NODE_ENV === 'development'`)
- Font preconnect and icon stylesheet load correctly

### 2. Profile Creation Flow
- Photo upload with client-side compression
- Form validation with scroll-to-error on first invalid field
- WhatsApp digits-only validation (rejects letters/symbols)
- Country code selector + phone preview
- Looking-for tag selection
- Consent checkbox required
- Redirect to `/descubrir` on success

### 3. Profile Edit Flow
- Pre-fills all fields from existing profile
- Back button navigates to `/descubrir`
- Same validation rules as creation
- Logout button at bottom

### 4. Discover/Swipe Flow
- Swipe cards with Framer Motion drag
- Photo renders via `next/image` with `priority` (preload)
- CONECTAR/PASAR indicators on drag
- Match popup with auto-dismiss (10s) and Escape key
- WhatsApp deep link on match
- Empty state with refresh + connections buttons
- MatchNotifier polling active

### 5. Connections Flow
- Connection cards with thumbnails via `next/image`
- Profile detail modal (bottom sheet) with Escape key close
- Full photo + bio + tags in modal
- WhatsApp + LinkedIn action buttons
- Relative time formatting
- Error state with retry
- MatchNotifier polling active

### 6. Cross-cutting Concerns
- Auth guards on all protected routes (spinner, no content flash)
- Custom 404 at `/pagina-falsa` (styled, with home button)
- Global error boundary (`error.tsx`) catches runtime errors
- TopNav with avatar + connections badge
- Service worker caches static assets only

---

## Issues Found & Resolved

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | High | Profile validation errors not scrolled into view | Added `scrollIntoView` on first error field |
| 2 | High | WhatsApp field accepted letters/symbols | Added digits-only regex validation |
| 3 | High | Auth guard showed page content briefly before redirect | Show spinner during `sessionLoading` |
| 4 | Medium | API errors silently swallowed on profile submit | Added submit error display in form |
| 5 | Medium | Test Login visible in production | Gated behind `NODE_ENV === 'development'` |
| 6 | Medium | Font preconnect after stylesheet (browser warning) | Moved `<link rel="preconnect">` before stylesheet |
| 7 | Medium | MatchNotifier polling on all pages (including landing) | Scoped to `/descubrir` and `/conexiones` only |
| 8 | Medium | `next/image` remote patterns not configured | Added Supabase Storage hostname to `next.config.ts` |
| 9 | Medium | No custom 404 page | Created `src/app/not-found.tsx` |
| 10 | Low | `<img>` elements instead of `next/image` (5 locations) | Migrated all to `next/image` with `fill` + `sizes` |
| 11 | Low | No global error boundary | Created `src/app/error.tsx` |
| 12 | Low | Modals not closable with Escape key | Added `keydown` listener for Escape on both modals |

---

## Current State

- **Build**: 0 errors
- **Lint**: 0 errors, 1 warning (custom font — expected, not fixable in App Router)
- **All flows**: Passing

---

## Remaining Non-critical Items

These were identified during the audit but are not blockers for launch:

- **No test suite** — No Jest/Vitest/Playwright test files configured
- **No focus trapping** — Modals don't trap focus (tab can reach elements behind modal)
- **No offline support** — Service worker caches assets but app doesn't work offline
- **No analytics** — No event tracking or error reporting service
- **No image alt text customization** — All alt text is just the display name
