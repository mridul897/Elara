---
created: 2026-09-22
updated: 2026-09-22
type: reference
status: v2, corrected — replaces the black-theme v1
tags: [tokens, design-system, elara]
---

# Tokens: ELARA

Named by purpose, not by value. Base: `Ouraring Design System/DESIGN.md`, **corrected 2026-09-22 by live browser verification**, adopted in full per the designer's decision. Screens from `information-architecture.md`. Breakpoints (390 / 768 / 1440) stay ELARA's own, fixed in `engagement.md`.

**v1 of this file used `#000000` as the page background. That was wrong — it came from a static-analysis extraction error in the Oura source file, since corrected.** Oura's real primary theme is a warm cream surface with one deliberate dark inverse section. This version replaces v1 entirely; nothing from v1's colour table carries forward.

## Colour tokens

Source: Oura `DESIGN.md` §2, corrected version.

| Token | Value | Role | What uses it |
|---|---|---|---|
| `color-bg-primary` | `#FFFDF9` | Page background | Every screen's base background |
| `color-bg-secondary` | `#EFE6DB` | Secondary cream surface | Testimonial/review cards, quote blocks |
| `color-bg-inverse` | `#1C1B1A` | Deliberate dark section | One full-bleed band only (e.g. Brand Story), never the whole page |
| `color-text-primary` | `#4A4741` | Primary text on cream | Headings, body copy, prices — never pure black |
| `color-text-on-inverse` | `#F7F1E8` | Primary text on the dark band | Headings/body inside `color-bg-inverse` |
| `color-text-muted` | `#838280` | Secondary text | Captions, meta info |
| `color-text-faint` | `#A8A5A0` | Tertiary text | Footer legal, fine print |
| `color-border` | `#4A474140` (25% sandstone-500) | Hairline border on cream | Card edges, dividers → 100% opacity on hover |
| `color-border-inverse` | `#5A5958` | Border on the dark band | Dividers inside inverse sections |
| `color-rail` | `#D3D1CE` | 1px rails | Progress tracks, thin dividers |
| `color-accent` | `#2A72DE` | Accent / secondary CTA | "Explore" links, active nav underline |
| `color-accent-hover` | `#2056A6` | Accent hover | Hover state of the above |
| `color-focus-ring` | `#3184FF` | Focus outline | `:focus-visible` on every interactive element |
| `color-warning-bg` | `#EEE6DC` | Warning surface | COD-unavailable banner, low-stock note |
| `color-success-bg` | `#E2EDD5` | Success surface | Order confirmed banner, "in stock" |
| `color-white` | `#FFFFFF` | Inverse text / small chips | Text on solid accent, payment badges |

**Do not use:** `#000000` as a background (removed with v1), and any of the Adyen/OneTrust leftover colours the corrected Oura file flags (`#00112C`, `#5C687C`, `#3860BE`, `#27455C`, `#656565`) — they never belonged to Oura's own system.

## Typography tokens

Source: Oura `DESIGN.md` §3, corrected version.

| Token | Font | Weight | Tracking | What uses it |
|---|---|---|---|---|
| `type-hero` | Editorial New (serif) | 300 (light) | −0.05em | Homepage hero `h1` only |
| `type-h2` | Editorial New (serif) | 400 | −0.03em | Section titles (New Arrivals, Best Sellers) |
| `type-card-h3` | AkkuratLL (sans) | 300 | normal | Product name on card, PDP title |
| `type-inverse-h2` | AkkuratLL (sans) | 400 | −0.05em | Heading inside the one dark section |
| `type-subhead` | AkkuratLL | 400 | −0.025em | Section intros |
| `type-pull-quote` | Editorial New | 100–200 | normal | Brand story quote |
| `type-body` | AkkuratLL | 400 | normal | Descriptions, form labels, cart lines |
| `type-body-sm` | AkkuratLL | 400 | normal | Secondary body copy |
| `type-eyebrow` | AkkuratLL | 700, uppercase | normal | Small tag/label above a heading |
| `type-caption` | AkkuratLL | 400 | normal | Meta text, legal, delivery notes |

**Sizes (mobile 390px → desktop 1440px, from Oura's live-measured scale, ELARA's own breakpoints):**

| Token | Mobile | Desktop | Note |
|---|---|---|---|
| `type-hero` | 2.25rem | 6.5rem (max; Oura tops at 6.875rem, ELARA stays at 6.5) | Never above 6.5rem, never bold |
| `type-h2` | 1.5rem | 3rem | |
| `type-card-h3` | 1rem | 1.5rem | |
| `type-body` | 1rem | 1rem | 1.5 line height |
| `type-eyebrow` / `type-caption` | 0.75rem | 0.75rem | |

**Rule:** display type (`type-hero`, `type-h2`, `type-pull-quote`) is always light-to-regular weight (200–400) with negative tracking and tight (1.1) leading. Never bold, never above 6.5rem on this project. Body uses 1.5 line height. No more than 3–4 sizes per screen.

## Spacing tokens

Source: Oura §5, 4px base grid.

| Token | Value | What uses it |
|---|---|---|
| `space-tight` | 4–8px | Icon + label, chip gaps, grid column gap |
| `space-group` | 12–16px | Gap between sibling items inside a card |
| `space-card-pad` | 24–40px | Card padding (24px default, 40px at desktop) |
| `space-section` | 48–80px | Section block padding, major breaks |

## Currency format — decided

**Format: `Tk. 4,200/-`** (not `৳4,200`). Decided by the designer 2026-09-23, after the ৳ glyph was found missing in Inter within Figma (see "Known gap" note on the Design System page). Applies everywhere a price appears: product cards, PDP, cart, checkout, order confirmation, footer delivery lines. Rules:
- "Tk." with a period, a space, then the amount with comma thousands separator, then "/-" with no space before it.
- No exceptions per-screen — if the ৳ symbol issue is ever fixed for a specific surface, this file must be updated first and then every screen brought in line, not the other way round.

## Radius, elevation, motion

- `radius-control`: `rounded-full` (999px) — every interactive element: buttons, chips, nav pills, icon buttons.
- `radius-card`: 8px (`rounded-lg`) for testimonial/quote cards; 12px (`rounded-xl`) for media/product cards.
- **This system is effectively shadowless.** Depth comes from imagery, hairline borders (`color-border`), and `backdrop-blur-xl` (24px) glass panels over media — not box-shadow. The one exception: a modal/drawer gets `0 25px 50px -12px rgba(0,0,0,.25)`.
- Motion is **restrained**, not expressive: `0.15s cubic-bezier(.4,0,.2,1)` default for buttons/links, `0.3s` for nav colour/card expand, `0.5s` for sticky header. No spring physics, no bounce. Respect `prefers-reduced-motion`.

## Proof it is wired

Tested token: `color-accent` (`#2A72DE`). Changing it should repaint together: secondary CTA buttons ("Explore" links), the active nav underline, and input focus-adjacent accents. If any of these stay the old colour, it is hardcoded, not wired.

Tested token: `color-bg-primary` (`#FFFDF9`). Changing it should repaint every screen's base background except the one deliberate `color-bg-inverse` section, which must stay independent.

## Still open

- ELARA's own colour/typography files were requested from the client but not sent; this file uses Oura's corrected palette and type wholesale per the designer's decision. If ELARA-specific tokens arrive later, this file needs a full pass.
- Icon set: client said 5 icons were provided; only the icon-mark logo and wordmark received so far.
- Logo vector file (SVG/AI) not yet received; only PNG.
