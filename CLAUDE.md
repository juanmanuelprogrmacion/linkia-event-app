# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Linker** — Mobile-first PWA networking app for a single professional event. Attendees scan a QR code, create a profile, swipe through other attendees to connect, and when both match they exchange contact info via WhatsApp deep links. No in-app chat.

All UI is in **Spanish**.

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

No test framework is configured yet.

## Architecture

### Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 4** + **Framer Motion** for animations
- **Supabase** as backend: PostgreSQL, Edge Functions (Deno), Storage

### Routing — Single-event, flat structure
```
src/app/page.tsx              → Entry point (session check → redirect)
src/app/perfil/page.tsx       → Profile creation/edit
src/app/descubrir/page.tsx    → Swipe feed (discover)
src/app/conexiones/page.tsx   → Connections list (matches)
```

### Key Modules
- **`src/lib/api.ts`** — Centralized API client. All Edge Function calls. Event slug from `NEXT_PUBLIC_EVENT_SLUG` env var. Error messages in Spanish.
- **`src/lib/session-context.tsx`** — React context (`SessionProvider` at root) providing session state. All pages access via `useSession()`.
- **`src/lib/image-utils.ts`** — Client-side image compression before upload.
- **`src/lib/supabase.ts`** — Supabase client instance.

### Auth Model
Device fingerprint → bearer token in `localStorage` (key: `linker_session`). No email/password.

### Backend (Supabase Edge Functions)
Frontend-only repo. All data access goes through Edge Functions (no direct Supabase queries from the browser). Functions use `service_role` key server-side; auth is via `x-session-token` header (custom token, not Supabase JWT). All deployed with `verify_jwt: false`.

Endpoints:
- `create-session` (public) — Device-based session init + token resume
- `get-profile`, `upsert-profile`, `get-feed`, `submit-swipe`, `get-matches`, `upload-photo` — `x-session-token` required

### Database Tables
`events`, `sessions`, `profiles` (with `company`, `whatsapp_number`, `looking_for`), `swipes`, `matches`. No chat tables. **RLS enabled on all tables with no policies** (deny-all for anon role; Edge Functions bypass via `service_role`).

## Design System
- **Warm venue dark** — charcoal backgrounds (`#141516`), blue accent (`#1392ec`)
- System font stack (no Google Fonts for body)
- Color tokens in `src/app/globals.css` via Tailwind `@theme`
- Design spec: `.interface-design/system.md`
- Glass morphism, gradient utilities, custom buttons (`.btn-*`), swipe indicators
- Material Symbols Outlined icons
- Mobile-first — test at 375px width
- Buttons: `12px` border-radius. Tags/pills: `9999px` (full round)

## Components
- **`src/app/components/top-nav.tsx`** — Slim top bar (avatar, title, connections badge)
- **`src/app/components/match-notifier.tsx`** — Polls for new matches, shows toast

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://wzorqpwfqrwritypyrvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_EVENT_SLUG=<event slug>
```

## Documentation
- `docs/plans/` — Implementation plans
- `docs/brainstorms/` — Design brainstorms
- `.interface-design/system.md` — Design system spec
- `MANU INFO/` — Original developer docs (reference only)
