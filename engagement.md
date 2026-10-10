---
created: 2026-09-21
type: reference
status: filled from client answers; items marked OPEN are not yet agreed
tags: [engagement, scope, stakeholders, elara]
---

# Engagement: ELARA (women's fashion bags, Bangladesh)

Fee: **৳2,00,000, fixed, agreed.** I quoted ৳2,50,000; the client agreed to ৳2,00,000 for the **same scope** listed below (no reduction, no additions). The client's earlier written answer said ৳60,000 to ৳80,000; the agreed fee replaces it.
Payment: **50% advance (৳1,00,000) received.** Balance ৳1,00,000 due after project completion. Timeline: **5 to 6 weeks**, starting next week (about 28 September 2026), so delivery lands around early November. The client first said 4 to 5 weeks; 5 to 6 is the latest figure. No launch date is set; launch depends on development and other work outside this engagement. Source of every line: client answers, not the PDF brief.

## 1. What is in scope?

- UX flow, sitemap, key user journeys, low-fi wireframes.
- 12 core screen types: Homepage, Product Listing, Product Detail, Search, Wishlist, Cart, Checkout (Cart, Customer Info, Shipping Address, Delivery, Payment, Review, Order Success), Order Confirmation, Account, Order Tracking, About, Contact.
- Primary design deliverables: **Mobile 390px and Desktop 1440px.**
- **Tablet 768px is a responsive adaptation layer, not a design deliverable.** Behaviour defined (grid columns, navigation, gallery, type and spacing, touch targets) for Homepage, Listing, Product Detail, Cart, Checkout and Account only. No pixel-perfect tablet screens.
- Add to Bag (mini cart drawer, then cart, then checkout) and Buy Now (direct checkout for one item; existing cart untouched, order summary labelled "Buy Now Item").
- Payment states: method selection, redirect/processing, success, failed, retry. COD shown as "Available". Failed state gives meaningful messages from the gateway's errors. No per-gateway multi-screen flows.
- Bangladesh address structure: Full Name, Phone, Division, District, Upazila/Thana, Area/Address, optional Postcode.
- Delivery charge shown by selected address: Dhaka ৳60, outside Dhaka ৳120, free nationwide at ৳3,000+. Shown separately in the order summary.
- Lightweight design system and lightweight ELARA visual identity **built around the client's existing logo**: basic colour palette, typography, basic visual direction (plus button style, radius, icon style, product card style). The client supplies the logo, so **no new wordmark is designed**.
- Clickable prototype.
- Client supplies: existing logo, all needed product images, product sizes, dimensions and other measurements. Placeholder imagery (stock or approved AI) only where an asset is still missing. The client is not sharing the Instagram/Facebook page link, so current brand colours and page content are not available to me unless the client sends them.
- **Discount / sale pricing: in scope, confirmed with the client 2026-09-23.** A "was / now" struck-through price and a discount badge (e.g. "20% OFF") on product cards and the Spotlight panel. **Still open — the discount rule itself (how much, which products, how long a sale runs, who sets it) is a business decision for Nadia, not designed yet.** The design supports showing a discount when one exists; it does not decide when one exists.

## 2. What is explicitly out?

- Development of any kind.
- Bangla or bilingual UI (possible future phase). UI is English only.
- Full branding, packaging, social media identity, multiple logo concepts or extensive logo exploration.
- Pixel-perfect tablet screens.
- Per-gateway custom screens beyond the five payment states above.
- Admin panel or dashboard (orders, stock, product upload).
- Writing content: product descriptions, materials, Brand Story and About copy come from the client. I use placeholder copy in the design.
- Exchange or return request screen or flow. The Returns page states the exchange policy and offers Contact Us / Message Us; the actual request process is handled in the development phase.
- Live courier tracking. Order Tracking is a UX screen showing order status only; status data and any integration come from the client or a future development team.
- International shipping.
- Product photography and lifestyle photography.
- Real-user research. User research for this project is AI-assisted synthetic research at the client's instruction (`interviews-synthetic-v1.md`); it is not validated with real users.

## 3. How many revision rounds, and what counts as one?

Two rounds. One round is one batch of **consolidated** feedback from the client's nominated person, answered by one revision pass by me. Individual comments inside a batch do not count as separate rounds. A new screen or a change to scope is not a revision.

## 4. Who signs off, by name?

**Nadia Rahman, Brand Manager, ELARA.** She gives the consolidated feedback and the final approval. Nobody else can approve.

## 5. What happens when they ask for something new?

OPEN: the client has not answered this. Proposed wording to agree in writing: "Anything outside sections 1 and 2 gets a written estimate and needs Nadia's yes before I start."

## How success is measured

The client's launch KPIs (conversion 2 to 3%, add to bag rate, checkout completion, cart abandonment, average order value, mobile conversion) depend on traffic, pricing, marketing, photography and delivery after launch. **I am not responsible for post-launch conversion.** Design success is measured before launch, on the clickable prototype, with 5 women aged 22 to 40 (not real-user research; a usability check):

1. A new user finds a bag, states its size and the delivery charge, and completes checkout with Buy Now within 3 minutes.
2. The user says correctly that Buy Now pays for one item only, not the whole cart, and does not confuse it with Add to Bag.
3. From a failed payment, the user retries without help.

Pass mark (agreed with client): at least 4 of 5 users complete each core task.

After launch, the metric the design most directly moves is **checkout completion** (checkout started to order placed), because payment, delivery charge and error handling are design decisions. Product view to Add to Bag is secondary.

## Open items to close

| Item | Status | Deadline |
|---|---|---|
| Payment gateway (SSLCOMMERZ, aamarPay or other) | Client will finalise within Week 1 (committed). I confirm the exact flow from it before high-fi checkout | End of Week 1 |
| Product images, sizes, dimensions and measurements from the client | Client will deliver within Week 1 (committed) | End of Week 1 |
| Logo file format (vector preferred) | Client supplies the existing logo; confirm it is SVG, AI or PDF | Week 1 |

## Decided with the client (closed)

- **COD:** available nationwide with **no maximum order limit**. No "COD unavailable" state is designed.
- **Free delivery:** orders of ৳3,000 or more get free delivery, and a Buy Now order qualifies on its own value.
- **Target age:** 22 to 40.
- **Brand colour and font:** none exist; I set them within the agreed visual direction. No new logo concept is needed.
- **Project complete** (for the ৳1,00,000 balance): all agreed screens, responsive design, interaction states, prototype and final Figma handoff delivered. Recommended addition, not yet agreed: balance is paid within 3 days of the final handoff.
| Client content and photography deadline. PROPOSED: if real content and images have not arrived by Week 3, sign-off happens on placeholder content, and later content-driven layout changes are new scope | OPEN, not yet agreed with client | Week 3 |
| Written confirmation (WhatsApp or email) of ৳2,00,000, same scope, 50% advance | OPEN, send a one-message summary to Nadia | This week |
