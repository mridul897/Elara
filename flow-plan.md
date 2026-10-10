---
created: 2026-09-25
type: reference
status: homepage pixel-perfect build done; sequencing the rest of the flow next
tags: [flow, plp, pdp, elara]
---

# ELARA flow plan — what's built, what's next

Workflow (standing, confirmed by the designer): **the designer designs every
screen in Figma; my job is a pixel-perfect HTML build from `get_design_context`,
real assets only, no placeholders.** Interactions/motion beyond the baseline
fade+rise come later, one section at a time, as the designer asks for them.

## Done

- **Homepage** (`build-homepage.html` / `build-homepage-standalone.html`):
  pixel-perfect from Figma node 90:1359, safe-area layout (1440 content, full-bleed
  backgrounds outside it), baseline scroll motion, split-reveal preloader, and the
  New Arrivals / Bags / Collections mega nav dropdowns (Best Sellers still the
  designer's placeholder). See `nav-dropdown-notes.md` for the dropdown build log.

## Decided order for the rest of the site (2026-09-25)

Per the journey in `information-architecture.md` (step 3 Browse → step 4 Decide)
and because the homepage's own nav dropdowns and category tiles all point to a
listing page, not straight to a product:

1. **Product Listing Page (PLP) — next.** Not designed in Figma yet. Needs, per
   the IA doc: filter by Category/Price/Color/Material/Size/Availability, sort by
   Featured/Newest/Price low-high/Price high-low/Best selling, and a no-results
   empty state. Waiting on the designer's Figma link.
2. **Product Detail Page (PDP) — after PLP.** An old pre-Figma-workflow mockup
   already exists at `my-product-detail-screen.html` (an early preview built for
   Nadia, before the pixel-perfect Figma pipeline existed — different token names,
   not built from `get_design_context`). **Decided: rebuild it later** from a fresh
   Figma design once the designer gets to it, rather than adapting the old mockup.
   Do not treat the old file as the source of truth for the real PDP build.

## Waiting on

Figma link for the PLP design.
