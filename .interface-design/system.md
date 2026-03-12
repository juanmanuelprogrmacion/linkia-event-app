# Linker — Design System

## Language
All UI text in **Spanish**.

## Direction & Feel
**Warm venue dark.** The app feels like the best-designed conference you've attended — professional but approachable, dark but not cold. Like a well-lit hotel event space at night: warm ambient lighting, clean surfaces, intentional accents.

NOT: neon/cyberpunk, dating app, corporate/LinkedIn, cold sci-fi.
YES: warm, confident, curated, fast, friendly.

## Signature Element
**The badge card.** Profile cards evoke premium event badges — identity-first (headline + company prominent), photo supports but doesn't dominate. Rounded corners, subtle elevation, warm surface colors. The card IS the person's event identity.

## Depth Strategy
**Subtle shadows** — soft lift on cards. No borders as primary separators. Cards float gently above the background. One level of elevation for cards, one for modals/overlays.

## Color Tokens

```css
/* Warm darks — not blue-black, slightly warm charcoal */
--background: #141516;
--surface: #1e1f21;
--surface-elevated: #272829;

/* Text hierarchy */
--ink: #f5f5f4;
--ink-secondary: #a8a29e;
--ink-muted: #6b6560;

/* Brand — confident blue, used sparingly */
--accent: #1392ec;
--accent-hover: #0d7ed4;
--accent-glow: rgba(19, 146, 236, 0.15);

/* Semantic */
--connect: #10b981;
--connect-glow: rgba(16, 185, 129, 0.15);
--skip: #a8a29e;
--destructive: #ef4444;
--warning: #f59e0b;

/* Surfaces */
--overlay: rgba(20, 21, 22, 0.85);
--border-subtle: rgba(255, 255, 255, 0.06);
```

## Spacing
Base unit: **4px**. Use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
Cards: 16px internal padding. 12px gaps between cards.

## Border Radius
- Cards/badges: 16px (friendly, approachable)
- Buttons: 12px (not full pill — grounded)
- Inputs: 12px
- Tags/pills: 9999px (full round)
- Modals: 20px

## Typography
- **Font**: System font stack — `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Headlines: 600 weight, tight tracking (-0.02em)
- Body: 400 weight, normal tracking
- Labels/tags: 500 weight, 0.01em tracking, uppercase for tags
- Card headline (role): 16px/600 — the most prominent text element
- Card company: 14px/500 — secondary but visible
- Card name: 20px/700 — large but headline leads identity

## Card Anatomy (Badge Card)
```
┌─────────────────────────┐
│  ┌──────┐               │
│  │ PHOTO│  Name          │
│  │      │  Headline      │
│  │      │  Company       │
│  └──────┘               │
│                         │
│  Bio text...            │
│                         │
│  [Tag] [Tag] [Tag]      │
│                         │
│  🔗 LinkedIn            │
└─────────────────────────┘
```
Photo is square with rounded corners, not full-bleed. Identity info sits beside it at the top — like a badge layout.

## Looking For Tags (Predefined, Spanish)
- Networking
- Contratar
- Busco empleo
- Invertir
- Co-founder
- Partners
- Mentoría
- Colaborar

## Swipe Actions
- **Connect** (right/button): accent blue with subtle glow
- **Skip** (left/button): muted, understated — not red/destructive, just neutral

## Animation
- Card transitions: 200ms ease-out
- Match celebration: scale + opacity, 400ms spring-like
- Page transitions: 150ms fade
- No bouncy/spring effects on micro-interactions

## Navigation
Minimal. Three states:
1. **Descubrir** (swipe feed) — the main experience
2. **Conexiones** (matches list) — accessible via top icon/tab
3. **Mi perfil** (profile view/edit) — accessible via avatar

No heavy bottom tab bar. A slim top bar with avatar + connections icon.

## States
- Loading: skeleton shimmer (warm tones, not cold gray)
- Empty feed: friendly illustration + "Has visto a todos por ahora"
- Error: inline message, not modal
- Match popup: celebratory but tasteful — not confetti, more like a warm glow + "¡Conexión!"

## PWA
- Theme color: #141516
- Background color: #141516
- Display: standalone
- Orientation: portrait
