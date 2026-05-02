# Delta Design System

## Overview

**Delta** is a mobile-first dating and live social discovery platform targeting users in the United States and worldwide. It combines profile-based discovery with interest-led live one-to-one video matching, safe messaging, media-rich profiles, and a closed-loop in-app token system named **delt**.

### Product Summary

| Area | Description |
|---|---|
| **Product** | Dating + social discovery app: profiles, likes, matches, chat, live video/audio, moderation |
| **Mobile** | Flutter for iOS and Android |
| **Backend** | Bun + ElysiaJS APIs, matching, wallet, media auth, admin |
| **Database** | MongoDB Atlas (source of truth) |
| **Real-Time** | Upstash Redis (queues, locks, presence) |
| **Media** | ImageKit (profile images, videos, verification, chat media) |
| **Live Video** | LiveKit (real-time video/audio rooms) |
| **Tokens** | delt — in-app consumable credit for live minutes, boosts, premium actions |

### Products / Surfaces
1. **Delta Mobile App** — iOS + Android (Flutter). Primary user-facing product.
2. **Moderation Dashboard** — Internal web dashboard for admins, moderators, support, analysts.

### Sources
- GitHub repo: `duroshegc/Delta` (https://github.com/duroshegc/Delta)
  - `docs/Delta_Developer_Documentation.docx` — Developer documentation (binary; not importable via tools)
- Executive Summary pasted text — Full product brief including architecture, roadmap, token economics, and safety model.

> **Note:** The DOCX binary was not importable via GitHub tooling. This design system is built from the detailed Executive Summary brief. If you have access to the repo, the full developer docs live at `docs/Delta_Developer_Documentation.docx`.

---

## Content Fundamentals

### Voice & Tone
Delta speaks with **confidence, warmth, and directness**. The product is built for real human connection — the copy should feel like a trusted friend, not a corporate app. Think magnetic and approachable, never cheesy.

- **Person:** 2nd person ("you", "your") in UI copy. 1st person ("I") for user-initiated actions and prompts.
- **Casing:** Sentence case for all UI labels, CTAs, and body copy. Title case only for product names (Delta, delt).
- **Tone:** Energetic but safe. Exciting but not hypey. Inclusive, never sleazy.
- **Emoji:** Not used in UI copy or labels. May appear in user-generated content only.
- **Punctuation:** No trailing periods in short UI labels or CTAs. Full sentences get periods.
- **Numbers:** Always use numerals in UI (e.g., "5 delt", "3 matches", not "five delt").

### Copy Examples
- Onboarding CTA: "Let's go" not "Get Started!"
- Empty state: "No matches yet — keep exploring" not "You have no matches at this time."
- Token prompt: "You need 10 delt to start a live session"
- Match notification: "You matched with Jordan"
- Live pool entry: "Finding your match…"
- Error: "Something went wrong. Try again."
- Report confirm: "Thanks for letting us know. We're on it."

### Feature Names (always use these)
- **delt** — token currency (lowercase, never "Delt" or "DELT" unless start of sentence)
- **live** — the live video/audio matching feature (lowercase in context)
- **Delta** — the app (always capitalized)
- **matches** — not "connections" or "links"

---

## Visual Foundations

### Color System

Delta is **dark-mode first**. The primary palette is built on deep near-black backgrounds with a vibrant electric accent system.

#### Brand Palette
| Token | Value | Usage |
|---|---|---|
| `--delta-black` | `#0A0A0F` | Primary background (deepest dark) |
| `--delta-surface` | `#13131A` | Card / sheet backgrounds |
| `--delta-surface-2` | `#1E1E2A` | Elevated surfaces, input fills |
| `--delta-surface-3` | `#28283A` | Borders, dividers |
| `--delta-accent` | `#EC4899` | Primary brand accent — hot pink |
| `--delta-accent-2` | `#F97316` | Secondary orange (gradients, live indicator) |
| `--delta-live` | `#00D4AA` | Live session teal — active/online states |
| `--delta-delt` | `#F59E0B` | delt token gold |
| `--delta-danger` | `#EF4444` | Errors, danger, ban |
| `--delta-success` | `#22C55E` | Success, verified, match |
| `--delta-fg` | `#F8F8FC` | Primary foreground / text |
| `--delta-fg-2` | `#A0A0B8` | Secondary foreground |
| `--delta-fg-3` | `#5C5C78` | Muted / placeholder text |

#### Gradient Treatments
- **Brand gradient:** `linear-gradient(135deg, #EC4899, #F97316)` — used on CTAs, profile cards
- **Live gradient:** `linear-gradient(135deg, #00D4AA, #EC4899)` — used on live session elements
- **delt gradient:** `linear-gradient(135deg, #F59E0B, #EF4444)` — used on token/wallet elements

### Typography

Delta uses two typefaces:
- **Display:** `Syne` (Google Fonts) — bold geometric sans, used for headlines, brand moments
- **Body:** `DM Sans` (Google Fonts) — clean, readable, modern; UI body, labels, copy

No serif. No mono (except internal dashboard).

#### Type Scale
| Token | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `--t-display` | 32px | 800 | Syne | Hero headlines, onboarding |
| `--t-h1` | 24px | 700 | Syne | Screen titles |
| `--t-h2` | 20px | 600 | Syne | Section headers |
| `--t-h3` | 17px | 600 | DM Sans | Card titles, names |
| `--t-body` | 15px | 400 | DM Sans | Body copy |
| `--t-label` | 13px | 500 | DM Sans | Labels, nav, tags |
| `--t-caption` | 11px | 400 | DM Sans | Captions, timestamps |

### Spacing System (4px base)
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

### Border Radius
- `--radius-sm`: 8px — buttons, chips
- `--radius-md`: 12px — cards, inputs
- `--radius-lg`: 20px — bottom sheets, modals
- `--radius-xl`: 28px — profile cards
- `--radius-full`: 9999px — avatars, pills, live indicator

### Shadows / Elevation
- `--shadow-sm`: `0 2px 8px rgba(0,0,0,0.4)` — subtle lift
- `--shadow-md`: `0 8px 24px rgba(0,0,0,0.5)` — cards
- `--shadow-lg`: `0 20px 48px rgba(0,0,0,0.6)` — modals, bottom sheets
- `--glow-accent`: `0 0 24px rgba(236,72,153,0.4)` — CTA hover/active glow
- `--glow-live`: `0 0 24px rgba(0,212,170,0.4)` — live session glow

### Backgrounds
Dark full-bleed. No patterns or textures. Profile cards use ImageKit-served photos as full-bleed backgrounds with a protection gradient overlay at the bottom (`linear-gradient(to top, rgba(10,10,15,0.95), transparent)`). No hand-drawn illustrations. Subtle noise grain on hero sections only.

### Animation
- **Easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out-quad) for most transitions
- **Spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)` for scale pops (match notification, like heart)
- **Duration:** 200ms micro, 300ms standard, 500ms page transitions
- **Approach:** Fades + subtle scale (1.0 → 1.04). No heavy slide-in animations. Live indicators pulse.

### Hover / Press States
- Hover: subtle opacity drop to 0.85 + glow on accent elements
- Press/tap: scale to 0.97 + brightness 0.9
- Disabled: opacity 0.35, no pointer events

### Cards
- Background: `--delta-surface`
- Border: `1px solid var(--delta-surface-3)`
- Radius: `--radius-xl` (28px) for profile cards; `--radius-md` (12px) for feed cards
- Shadow: `--shadow-md`
- Profile cards: full-bleed photo + bottom gradient overlay + name/age at bottom

### Imagery
- Photography: warm-toned, natural light, candid social moments
- Color grade: slightly warm with rich shadows. Never cold/blue-tinted.
- No stock imagery in UI; real user photos via ImageKit
- No grain filter on photos (grain only on hero backgrounds)

### Use of Blur/Transparency
- Blur: `backdrop-filter: blur(16px)` on bottom sheets and modals overlaying content
- Frosted glass feel for overlay panels: `rgba(19,19,26,0.85)` background + blur
- Navigation bar: frosted glass over content on scroll

### Layout Rules
- Mobile-first. Design at 390×844px (iPhone 14 Pro).
- Safe areas respected (status bar top, home indicator bottom).
- Bottom navigation: fixed, 64px tall, frosted glass.
- No hamburger menus on mobile.

---

## Iconography

Delta uses **Lucide Icons** (stroke-based, 1.5px stroke weight, 24px grid). This is the closest match to the intended icon style — consistent, modern, minimal.

- **Style:** Line icons, 1.5px stroke, rounded caps/joins
- **Sizes:** 20px (nav), 24px (standard UI), 28px (prominent actions)
- **CDN:** `https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`
- **No emoji as icons.** No unicode substitutes.
- **No filled icons** except: heart (liked state), star (match highlight), shield (verified).

### Key Icon Mappings
| Action | Lucide Icon |
|---|---|
| Home / Discover | `compass` |
| Matches | `heart` |
| Live | `video` |
| Chat / Messages | `message-circle` |
| Profile | `user` |
| Settings | `settings` |
| Camera | `camera` |
| Send | `send` |
| Like | `heart` |
| Block | `ban` |
| Report | `flag` |
| Verified | `shield-check` |
| delt / Wallet | `coins` |
| Filter | `sliders-horizontal` |
| Back | `chevron-left` |
| Close | `x` |
| Notification | `bell` |
| Location | `map-pin` |

---

## File Index

```
/
├── README.md                          ← This file
├── SKILL.md                           ← Agent skill definition
├── colors_and_type.css                ← All CSS variables (colors, type, spacing, radii, shadows)
├── assets/
│   ├── logo.svg                       ← Delta wordmark + icon
│   └── icons/                         ← Key icon references (Lucide)
├── preview/
│   ├── colors-brand.html              ← Brand color swatches
│   ├── colors-semantic.html           ← Semantic/state colors
│   ├── colors-gradients.html          ← Gradient treatments
│   ├── type-scale.html                ← Full type scale specimen
│   ├── type-display.html              ← Display + headline type
│   ├── spacing-tokens.html            ← Spacing scale
│   ├── spacing-radius-shadow.html     ← Radius + shadow/elevation
│   ├── components-buttons.html        ← Button system
│   ├── components-inputs.html         ← Form inputs + fields
│   ├── components-cards.html          ← Profile + feed cards
│   ├── components-badges.html         ← Chips, badges, pills
│   ├── components-nav.html            ← Bottom navigation
│   ├── components-tokens.html         ← delt token UI elements
│   └── brand-logo.html                ← Logo system
└── ui_kits/
    └── mobile/
        ├── README.md                  ← Mobile UI kit docs
        └── index.html                 ← Interactive mobile prototype
```
