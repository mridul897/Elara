---
created: 2026-09-25
type: reference
status: New Arrivals / Bags / Collections implemented from Figma 2026-09-25; Best Sellers still the placeholder, by design
tags: [nav, dropdown, figma, elara]
---

# Nav dropdown redesign — tracking

The designer is redesigning the four nav dropdowns (New Arrivals, Bags, Collections,
Best Sellers) in Figma, one at a time. **Do not implement any of them into
`build-homepage.html` until all four are ready — implement them together, in one pass.**

Current state of `build-homepage.html`: still has the first-pass dropdowns built
2026-09-24 (New Arrivals mega menu the designer approved as-is; Bags/Collections/Best
Sellers as placeholder "light dropdown" components the designer is now replacing).

## Component sizes handed to the designer (2026-09-25)

For New Arrivals mega dropdown, as built:

| Element | Width | Height |
|---|---|---|
| Panel (whole dropdown) | 1440px | 361px |
| Panel padding | 64px sides | 48px top / 56px bottom |
| Big product card (×2) | 280px | 200px |
| Gap between the 2 big cards | 32px | — |
| Right-side list column | ~242px | 257px |
| Each list row | ~233px | ~60px |
| Row thumbnail (circular) | 40px | 40px |

Panel sits at `top: 99px` under the header, left-aligned to the nav's outer edge
(`left: -10px` to cancel the nav's own 10px padding).

## Figma links received

- **New Arrivals card redesign** (image + copy changed on the component card):
  https://www.figma.com/design/dNmCMOzCczBdcA3e5eyPfq/Elara-Women-s-bag-E-commerce-project?node-id=100-111
  — received 2026-09-25. New Arrivals itself was already approved as built; this
  link redesigns its card component specifically (new image, new copy). **Not yet
  implemented — holding until Bags/Collections/Best Sellers are also ready.**

## Still to come from the designer

- Best Sellers: designer is deliberately leaving this one as-is for now
  ("ইচ্ছামতো করি" — will design later). Keep the current placeholder list
  (All Best Sellers / Customer Favorites / Most Loved / Trending Now)
  untouched when implementing the other three.

## Ready to implement (2026-09-25)

Designer finished New Arrivals card redesign, Bags, and Collections dropdown
components in one Figma frame:
https://www.figma.com/design/dNmCMOzCczBdcA3e5eyPfq/Elara-Women-s-bag-E-commerce-project?node-id=1-16

**Done (2026-09-25).** Figma MCP reconnected; implemented from the real nodes:
- New Arrivals: node `100:111` — 2 big cards (Leather Tote Bag, Aveline Convertible
  Tote) + list (Vivienne Leather Bag, Sienna Structured Purse, Isla Bags, Shop All
  New Arrivals).
- Bags: node `105:171` — 2 big cards (Cross Body Bags, Work & Travel) + list (Tote,
  Shoulder, Mini, Shop All Category Bags). Crossbody and Travel/Work moved from list
  items to the two image cards in this redesign.
- Collections: node `105:253` — 2 big cards (Signature/Our Signature Pieces,
  Everyday/Everyday Essentials) + list with eyebrow+title rows (Evening/The Evening
  Edit, Workwear/Designed for Work) + See All Collections.

All three are now the same 1440×360 full-width mega panel (shared `.dd-panel` /
`.dd-card` / `.dd-row` CSS in `build-homepage.html`). Bags and Collections switched
from the old compact "light" dropdown to `mega` in the nav JS (`isMega = key !==
'best-sellers'`). Real assets downloaded to `assets/home/dd-*.png` and
`assets/home/icon-dd-*.svg`. Verified per-dropdown with puppeteer screenshots
against the Figma reference — no placeholders.

Best Sellers is untouched: still the simple list (All Best Sellers / Customer
Favorites / Most Loved / Trending Now), left as the compact "light" style, per the
designer's "ইচ্ছামতো করি" — they'll design it later.

## Implementation plan once all four are in hand

1. Load `figma-design-to-code` skill, `get_design_context` on each node, download
   real assets — no placeholders (see `memory/figma-builds-must-be-pixel-perfect.md`).
2. Replace the current placeholder markup/CSS for Bags, Collections, Best Sellers
   panels in `build-homepage.html`, and update the New Arrivals card markup per the
   node-id=100-111 redesign.
3. Re-verify each dropdown with a puppeteer screenshot pass (open state for all
   four, plus the closed state) before regenerating `build-homepage-standalone.html`.

**Note (2026-09-25):** the Figma MCP connection dropped mid-session (all
`mcp__c8a14cb8...` tools unavailable). Reconnect it before starting the
implementation pass.
