---
created: 2026-09-22
type: reference
status: for manual entry into Figma
tags: [figma, style-guide, tokens, elara]
---

# ELARA — Figma style guide (manual entry)

Source: `tokens.md` v2 (corrected Oura Ring system, cream theme). Names use Figma's `/` grouping convention, so styles nest into folders automatically in the Figma style picker.

## How to add these in Figma

**Colour (Paint) styles:** draw any shape → fill it with the hex → in the fill panel, click the style icon (four dots) → "+" → name it exactly as below.
**Text styles:** create a text layer with the right font/size/weight → in the text panel, click the style icon → "+" → name it exactly as below.

---

## 1. Colour styles

| Figma style name | Hex | Use it for |
|---|---|---|
| `Color/Background/Primary` | `#F7F1E8` | Page background (every screen) |
| `Color/Background/Secondary` | `#EFE6DB` | Card surfaces — testimonials, quote blocks |
| `Color/Background/Inverse` | `#1C1B1A` | The ONE deliberate dark section (Brand Story) — never the whole page |
| `Color/Text/Primary` | `#4A4741` | Headings, body copy, prices — on cream. Never pure black |
| `Color/Text/On-Inverse` | `#F7F1E8` | Text inside the dark section |
| `Color/Text/Muted` | `#838280` | Secondary text, captions |
| `Color/Text/Faint` | `#A8A5A0` | Footer legal, fine print |
| `Color/Border/Default` | `#4A4741` at 25% opacity | Card edges, dividers (hairline, not shadow) |
| `Color/Border/Inverse` | `#5A5958` | Dividers inside the dark section |
| `Color/Rail` | `#D3D1CE` | Thin rails, progress tracks |
| `Color/Accent/Default` | `#2A72DE` | "Explore" links, active nav, secondary CTA |
| `Color/Accent/Hover` | `#2056A6` | Hover state of the accent |
| `Color/Focus-Ring` | `#3184FF` | Keyboard focus outline — every interactive element |
| `Color/Status/Warning-BG` | `#EEE6DC` | COD-unavailable banner, low-stock note |
| `Color/Status/Success-BG` | `#E2EDD5` | Order confirmed, "in stock" |
| `Color/White` | `#FFFFFF` | Text on solid accent, small chips |

**Do not add:** pure black `#000000` as a background, or any of `#00112C` / `#5C687C` / `#3860BE` / `#27455C` / `#656565` — these were Adyen/OneTrust colours mistakenly attributed to Oura in the first extraction pass, not part of the real system.

---

## 2. Text styles

Font stand-ins until Editorial New / AkkuratLL licences are confirmed: **serif → Fraunces** (or Playfair Display if Fraunces isn't in your Figma fonts), **sans → Inter**. Swap the font family in one place later if the licensed faces become available — keep the style names and sizes the same so nothing downstream breaks.

Rule for all serif/display styles: weight stays light (200–400), **never bold**, negative letter-spacing, tight line-height (1.1).

| Figma style name | Font | Weight | Size (mobile) | Size (desktop) | Line height | Letter spacing | Use it for |
|---|---|---|---|---|---|---|---|
| `Text/Display/Hero` | Fraunces (serif) | Light (300) | 36px | 104px (cap 6.5rem) | 1.1 | −5% | Homepage hero `h1` only |
| `Text/Display/H2` | Fraunces (serif) | Regular (400) | 24px | 48px | 1.1 | −3% | Section titles (New Arrivals, Best Sellers) |
| `Text/Display/Pull-Quote` | Fraunces (serif) | Extralight/Italic (200) | 20px | 24px | 1.3 | 0 | Brand story quote |
| `Text/Card-Title` | Inter (sans) | Light (300) | 16px | 24px | 1.3 | 0 | Product name on card, PDP title |
| `Text/Inverse-H2` | Inter (sans) | Regular (400) | 20px | 40px | 1.25 | −5% | Heading inside the one dark section |
| `Text/Subhead` | Inter (sans) | Regular (400) | 16px | 24px | 1.4 | −2.5% | Section intros |
| `Text/Body` | Inter (sans) | Regular (400) | 16px | 16px | 1.5 | 0 | Descriptions, form labels, cart lines |
| `Text/Body-Small` | Inter (sans) | Regular (400) | 14px | 14px | 1.5 | 0 | Secondary body copy |
| `Text/Eyebrow` | Inter (sans) | Bold (700), uppercase | 12px | 12px | 1.5 | 0 | Small tag above a heading |
| `Text/Caption` | Inter (sans) | Regular (400) | 12px | 12px | 1.5 | 0 | Meta text, legal, delivery notes |
| `Text/Button-Label` | Inter (sans) | Medium (500) | 15px | 15px | 1 | 0 | All button labels |

**Rule:** no more than 3–4 sizes on one screen. Use colour and weight for hierarchy before adding a new size.

---

## 3. Other foundations (set up as Figma Variables, not styles)

| Category | Values | Note |
|---|---|---|
| Spacing (4px grid) | 4, 8, 12, 16, 24, 32, 40, 48, 64, 80 | Set as a number variable collection `Spacing/*` |
| Radius | `999` (full/pill — every button, chip, nav item), `8` (small card), `12` (media card) | Set as `Radius/*` |
| Elevation | This system is shadowless. Depth = imagery + hairline border + backdrop blur. The one exception: `0 25px 50px -12px rgba(0,0,0,0.25)` for a modal/drawer only | Don't build a shadow scale beyond this one value |
| Motion | `0.15s` default (buttons/links), `0.3s` (nav colour/card expand), `0.5s` (sticky header) — all `cubic-bezier(.4,0,.2,1)` | Prototype transition settings, not a style |

---

## 4. Sanity check before you start applying these

- If a frame looks like it needs `#000000` as its background, stop — that was the uncorrected v1 mistake. The real background is `#F7F1E8`.
- `#1C1B1A` appears in exactly one place on the homepage (Brand Story). If you find yourself reaching for it as a general dark surface elsewhere, that's a sign to re-check against `tokens.md`.
- Every button and pill-shaped control uses the full `999` radius — nothing in this system uses a small rounded-rectangle button.
