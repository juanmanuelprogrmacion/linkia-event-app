---
module: Profile
date: 2026-03-12
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "WhatsApp phone input invisible/collapsed in flex container at 375px width"
  - "Country code select expanding to full container width instead of 90px"
root_cause: config_error
resolution_type: code_fix
severity: high
tags: [tailwind-v4, css-specificity, flex-layout, flex-basis]
---

# Troubleshooting: WhatsApp Phone Input Invisible in Flex Layout

## Problem
The WhatsApp phone number input on the profile page was invisible/collapsed to near-zero width. The country code `<select>` expanded to fill the entire flex container, leaving no space for the phone `<input>`.

## Environment
- Module: Profile (src/app/perfil/page.tsx)
- Framework: Next.js 16 + React 19 + Tailwind CSS v4
- Affected Component: WhatsApp phone input flex row (line ~375)
- Date: 2026-03-12

## Symptoms
- Phone number input appeared as a tiny sliver (few pixels wide) next to the country code select
- Country code select expanded to ~80% of the container width instead of staying at 90px
- Issue visible at 375px mobile viewport width
- Profile creation was blocked because users couldn't enter their WhatsApp number

## What Didn't Work

**Attempted Solution 1:** Remove `width: 100%` from the `.input` CSS class in globals.css
- **Why it failed:** While it removed the conflicting width, it broke all other standalone inputs in the form (name, headline, company, etc.) which need `width: 100%` to fill their parent containers. Also, the `<select>` element still expanded beyond 90px due to intrinsic content sizing from option text (emoji flags + country codes).

## Solution

Use `flex-basis` instead of `width` for sizing flex children. `flex-basis` takes precedence over `width` in flexbox layout calculations, bypassing the CSS specificity issue entirely.

**Code changes:**

```tsx
// Before (broken):
<select
  className="input w-[90px] shrink-0 text-center px-2"
>

// After (fixed):
<select
  className="input shrink-0 grow-0 basis-[90px] text-center px-2"
>
```

The phone input already had `flex-1` (which sets `flex: 1 1 0%` — basis of 0%), so it correctly fills remaining space regardless of `.input`'s `width: 100%`.

## Why This Works

1. **Root cause:** In Tailwind CSS v4, utility classes are generated inside `@layer utilities`, which has lower CSS specificity than unlayered classes. The `.input` class in `globals.css` is NOT in any `@layer`, so its `width: 100%` overrides Tailwind's `w-[90px]` (`width: 90px`) due to specificity.

2. **Why flex-basis wins:** In flexbox, when `flex-basis` is explicitly set (not `auto`), it determines the item's initial main size — `width` is ignored for main-axis sizing. So even though `.input` sets `width: 100%`, `basis-[90px]` (`flex-basis: 90px`) controls the actual size. Combined with `shrink-0 grow-0`, the select is locked at exactly 90px.

3. **Why the phone input was fine:** `flex-1` expands to `flex: 1 1 0%`, which sets `flex-basis: 0%`. Since flex-basis is explicit (not auto), the phone input's `width: 100%` from `.input` is irrelevant — it starts at 0 and grows to fill remaining space.

## Prevention

- **In Tailwind v4 projects with custom CSS classes:** Never rely on Tailwind width utilities (`w-[Xpx]`) to override custom class widths. Use `flex-basis` for flex children sizing instead.
- **General rule:** When custom CSS classes (outside `@layer`) set properties like `width`, Tailwind utilities in `@layer utilities` cannot override them. Use either:
  - `flex-basis` for flex children (preferred)
  - Tailwind's `!` important modifier (e.g., `!w-[90px]`)
  - Move custom classes into `@layer components` so utilities can override them
- **Quick check:** If a Tailwind utility isn't working on an element, check if a custom CSS class is setting the same property with higher specificity.

## Related Issues

No related issues documented yet.
