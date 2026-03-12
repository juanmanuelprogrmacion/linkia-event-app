---
date: 2026-03-10
topic: linker-mvp
---

# Linker — Single-Event MVP

## What We're Building

A mobile-first PWA networking app for a single professional event (~1000-2000 attendees). Attendees scan a QR code at the venue, create a quick profile, swipe through other attendees to connect, and when both match — they get each other's info with a direct WhatsApp link to continue the conversation outside the app.

**Event date: March 26, 2026** — 16 days to ship.

## Why This Approach

The original codebase was designed as a multi-event platform with complex routing, event discovery, access codes, and in-app real-time chat. For this launch, none of that is needed. We're building for ONE event with ONE goal: get people connected fast.

**Killed from original scope:**
- Multi-event routing (`/e/[slug]/`)
- Event discovery/listing page
- Access code validation flow
- In-app chat (conversations, messages tables)
- Supabase Realtime subscriptions
- Stands/sponsors system

## Core Flow

```
QR Scan → Profile Creation → Swipe Feed → Match → WhatsApp
```

1. **Entry**: QR code at venue opens the webapp directly (no event code needed)
2. **Profile**: Name, photo, headline, company, bio, LinkedIn, WhatsApp, "looking for" tags
3. **Discover**: Swipe cards — Connect or Skip
4. **Match**: Mutual connect triggers match notification
5. **Connections**: List of all matches with WhatsApp deep links

## Profile Fields

| Field | Required | Notes |
|-------|----------|-------|
| Photo | Yes | Camera/upload |
| Display name | Yes | |
| Headline | Yes | e.g. "CTO at Startup X" |
| Company | No | Shown on card |
| Bio | No | Short description |
| LinkedIn URL | No | Tappable link on profile |
| WhatsApp number | Yes | Not validated, used for `wa.me/` deep link |
| Looking for | No | Tags like "Hiring", "Investing", "Networking", "Co-founder", etc. |

## Key Decisions

- **Single event, no routing complexity**: App opens directly to the flow, no slug needed
- **No in-app chat**: WhatsApp deep links (`https://wa.me/<number>`) replace messaging
- **PWA**: Installable webapp, no app store needed — fast to deploy
- **Device-based sessions**: Keep the fingerprint approach, no login/password
- **Existing Supabase backend**: Reuse the project (`gzzaocucnhkaexnfgmyq`) and Edge Functions, adapted for simplified schema

## Simplified Database

Keep: `events`, `sessions`, `profiles`, `swipes`, `matches`
Kill: `conversations`, `messages`, `stands`, `stand_leads`

Add to `profiles`: `company`, `whatsapp_number`, `linkedin_url`, `looking_for` (text array)

## Tech Stack (unchanged)

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 + Framer Motion
- Supabase (PostgreSQL + Edge Functions)
- PWA via next-pwa or manual service worker

## Resolved Decisions

- **Visual direction**: Warm venue dark — see `.interface-design/system.md`
- **"Looking for"**: Predefined tags in Spanish (Networking, Contratar, Busco empleo, Invertir, Co-founder, Partners, Mentoría, Colaborar)
- **NFC/QR between users**: Deferred to v2 — PWA NFC support too limited, QR scanner too much scope for 16 days
- **Language**: All UI in Spanish
- **Chat**: No in-app chat — WhatsApp deep links on match

## Next Steps

→ `/workflows:plan` for implementation
