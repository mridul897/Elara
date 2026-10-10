---
created: 2026-09-22
type: deliverable
status: v1, in progress — Phase 1 partially done
tags: [tasks, execution, elara]
---

# Task breakdown: ELARA

Built from `brief-interrogated.md`, `information-architecture.md`, `tokens.md` (Oura-corrected, cream theme) and `engagement.md` (5–6 weeks, 2 consolidated revision rounds, ৳2,00,000 fixed). Each task is one focused session (roughly 2–4 hours) for one person, this student.

Two tasks are already done and listed here for the dependency chain, marked ✅.

## Phase 1: Foundation

- [x] ✅ **Define design tokens** — colour, type, spacing, radius, elevation, motion, named by purpose. Done when: `tokens.md` v2 exists and every value traces to the corrected Oura system. *(requires: none — done 2026-09-22)*
- [x] ✅ **Confirm the design system source** — resolve the Oura extraction error (black theme → corrected cream theme) before building on it. Done when: `tokens.md` matches live-verified Oura values, not the static-analysis draft. *(requires: none — done 2026-09-22)*
- [ ] **Set up the file structure** — one `my-<screen>-screen.html` file per screen in the inventory, shared token `<style>` block pattern confirmed reusable across files. Done when: a checklist of all screen filenames exists and matches `information-architecture.md`'s inventory exactly. *(requires: Define design tokens)*
- [ ] **Resolve the three open client answers that block Phase 3 builds:** payment gateway choice, product images/dimensions, logo vector file. Done when: gateway is known (from `engagement.md`, committed by client for end of Week 1) — this task is a checkpoint, not build work, and cannot be marked done until the client delivers. *(requires: none — runs in parallel, blocks specific Phase 3 tasks below, not all of Phase 3)*

**Parallel note:** the file-structure task and the client-answer checkpoint have no dependency on each other and can run the same day.

## Phase 2: Structure (low-fidelity wireframes)

One wireframe task per screen in the inventory (`information-architecture.md` Part 2). Low-fidelity: layout and hierarchy only, no colour/type polish. Each screen names the journey step it serves (from IA Part 1).

- [x] ✅ **Wireframe: Homepage** — retroactive structure check against the already-built high-fi version. Done when: every section from IA Part 4 content hierarchy is placed. Matches. *(requires: Set up file structure)*
- [x] ✅ **Wireframe: Product Listing + empty state** — filters, sort, product grid, no-results state. *(requires: Set up file structure)*
- [x] ✅ **Wireframe: Search overlay + results + no-results** — recent, popular, suggested products; results grid. *(requires: Set up file structure)*
- [x] ✅ **Wireframe: Quick view** — card-level product look without leaving the list. *(requires: Wireframe: Product Listing)*
- [x] ✅ **Wireframe: Product Detail + detail sections** — retroactive structure check. Matches; the mobile double-button bug (fixed 2026-09-22) is noted here too. *(requires: Set up file structure)*
- [x] ✅ **Wireframe: Size and dimensions sheet** — size in cm plus a comparison reference, opens over the PDP. *(requires: Wireframe: Product Detail)*
- [x] ✅ **Wireframe: Wishlist + empty state**. *(requires: Set up file structure)*
- [x] ✅ **Wireframe: Mini cart drawer + Cart + empty state**. *(requires: Wireframe: Product Detail)*
- [x] ✅ **Wireframe: Checkout, all 5 steps** (Contact, Shipping Address, Delivery, Payment, Review) as one connected flow, including the Bangladesh address fields and the "Buy Now Item" summary variant. Step indicator shown consistently across all 5. *(requires: Wireframe: Cart)*
- [x] ✅ **Wireframe: Payment states** — Processing, Success (Order Confirmation), Failed, Retry. Failed state's "Switch to COD" marked pending the client's decision (`brief-interrogated.md` Q2). *(requires: Wireframe: Checkout; blocked on: payment gateway choice for the exact error copy, not for layout)*
- [x] ✅ **Wireframe: Order Tracking (guest, by order number + phone)**. *(requires: Wireframe: Checkout)*
- [x] ✅ **Wireframe: Account** (login/signup, profile, orders, saved addresses, wishlist, saved payment method). Saved-card sub-state marked pending gateway. *(requires: none)*
- [x] ✅ **Wireframe: About, Contact, and policy pages** (Shipping & Delivery, Returns & Exchange with the "Message Us" exchange path, Privacy, Terms). *(requires: none)*
- [x] ✅ **Map the navigation pattern across all wireframes** — done in `wireframes-lofi.html`'s nav-check section. Mobile/desktop patterns confirmed consistent. **Gap found:** Quick View and the Size & Dimensions sheet had no shared close/back convention — flagged as a rule to set before high-fi. *(requires: all wireframe tasks above)*

**All of Phase 2 is in [wireframes-lofi.html](wireframes-lofi.html)**, one consolidated grayscale file grouped the same way as the screen inventory (Discover, Evaluate, Save, Buy, After). Low-fidelity by design: gray boxes and labels only, no tokens.md colours or type.

## Phase 3: Build (high-fidelity)

High-fidelity screens use `tokens.md` v2 (cream `#F7F1E8` primary, `#1C1B1A` inverse band, Editorial New/AkkuratLL pairing). One task per major screen; variant states listed separately.

- [x] ✅ **Build: Homepage (early preview)** — desktop 1440px + mobile 390px, tablet adapted. Done when: Nadia has seen it. *(requires: Wireframe: Homepage — built ahead of wireframe as an early preview per direct request; needs a retroactive wireframe check)*
- [x] ✅ **Build: Product Detail (early preview)** — gallery, trust strip, Add to Bag/Buy Now split, expandable spec, reviews, WhatsApp contact. Done when: Nadia has seen it. *(requires: Wireframe: Product Detail — same note as above)*
- [ ] **Build: Product Listing** — desktop + mobile + tablet, filter/sort interaction, empty state. *(requires: Wireframe: Product Listing)*
- [ ] **Build: Search** — overlay, results, no-results. *(requires: Wireframe: Search)*
- [ ] **Build: Wishlist** — populated + empty. *(requires: Wireframe: Wishlist)*
- [ ] **Build: Cart** — populated + empty + mini cart drawer. *(requires: Wireframe: Cart)*
- [ ] **Build: Checkout, Contact + Shipping Address** — Bangladesh address fields, guest by default. *(requires: Wireframe: Checkout)*
- [ ] **Build: Checkout, Delivery + Payment method** — charge shown by address, all 4 payment options visible, COD never buried. *(requires: Build: Checkout Contact+Address; blocked on: payment gateway choice)*
- [ ] **Build: Checkout, Review Order** — standard cart summary + the separate "Buy Now Item" single-product variant. *(requires: Build: Checkout Delivery+Payment)*
- [ ] **Build: Payment Processing / Success / Failed / Retry** — Failed state copy reflects the actual gateway's error format. *(requires: Build: Checkout Review Order; blocked on: payment gateway choice)*
- [ ] **Build: Order Confirmation + Order Tracking (guest + account)**. *(requires: Build: Payment states)*
- [ ] **Build: Account** — profile, orders, saved addresses, wishlist link, saved payment method. *(requires: Wireframe: Account; blocked on: gateway choice, for the saved-card sub-state only)*
- [ ] **Build: About, Contact, policy pages**. *(requires: Wireframe: About/Contact/policy)*
- [ ] **Responsive pass: tablet 768px** for Homepage, Listing, PDP, Cart, Checkout, Account only (per `engagement.md` scope — no pixel-perfect tablet elsewhere). Done when: all 6 named screens behave correctly at 768px; this is verification of the responsive CSS already written per-screen, not new screens. *(requires: the Build tasks for those 6 screens)*
- [ ] **Component pass: states** — every interactive element's default/hover/active/focus/disabled/error/empty states exist somewhere in the file set (buttons, size chips, quantity stepper, form fields, payment method cards). Done when: a checklist of states per component is filled and each has a visible example. *(requires: all Build tasks above)*

## Phase 4: Review

Not optional. Time-boxed.

- [ ] **Run `/design-review`** on the full build. ~2–3 hours. Done when: every finding has a decision (fix now, fix later, won't fix) written in `critique-notes.md`. *(requires: all Phase 3 Build tasks)*
- [ ] **Run `/heuristic-evaluation`** against Nielsen's 10 heuristics. ~2 hours. Done when: every finding is tied to a specific element with a specific fix. *(requires: Run /design-review)*
- [ ] **Accessibility pass** — focus-visible contrast (`color-focus-ring` #3184FF against both cream and inverse surfaces), touch target sizes (44px minimum, already a token rule), colour contrast of `color-text-primary` #4A4741 on `#F7F1E8` and `color-text-on-inverse` on `#1C1B1A`. ~1.5 hours. Done when: contrast ratios are checked and logged, not assumed. *(requires: Run /heuristic-evaluation)*
- [ ] **Edge case review** — what each screen shows for: out-of-stock size, zero reviews, empty wishlist/cart, COD unavailable (if the client sets an order-value limit later), payment failed with no reason from the gateway, delivery to an Upazila the address form does not recognise. ~2 hours. Done when: each edge case has a named screen state, not a gap. *(requires: Run /heuristic-evaluation)*
- [ ] **Run `/persona-acid-test`** on the checkout flow specifically (confused user, skeptical engineer, impatient PM lenses) — needs an actual build, so this is the last task, not a parallel one. ~1.5 hours. Done when: all three lenses have passed or have a logged fix. *(requires: Accessibility pass, Edge case review)*
- [ ] **Usability check with 5 users** per the pass mark agreed in `engagement.md` ("How success is measured"): find a bag + state size/delivery charge + Buy Now checkout in 3 minutes; correctly distinguish Buy Now from Add to Bag; retry a failed payment unaided. ~half a day including recruiting. Done when: at least 4 of 5 users pass each task, or the fix is scheduled before Nadia's sign-off. *(requires: Run /persona-acid-test)*
- [ ] **Prepare Nadia's final handoff** — Figma/file links, this task list marked complete, `engagement.md`'s "project complete" definition satisfied. Done when: Nadia has everything needed to trigger the final ৳1,00,000 payment. *(requires: Usability check with 5 users)*

## What blocks what, at a glance

| Blocker | Blocks |
|---|---|
| Payment gateway choice (client, committed end of Week 1) | Payment-state wireframes and builds, Checkout Delivery+Payment build, Account saved-payment sub-state |
| Logo vector file (client) | Nothing in this list directly — current builds use the PNG; swap when the vector arrives, no task blocked |
| Product images, sizes, dimensions (client, committed end of Week 1) | Nothing blocks on this for wireframes/build — placeholder imagery is explicitly in scope; swap-in is a later pass, not a new task |
