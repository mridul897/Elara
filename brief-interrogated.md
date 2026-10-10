---
created: 2026-09-21
type: reference
status: filled; Requirements Handshake from /grill-me is the base
tags: [brief, interrogation, elara]
---

# Interrogated brief: ELARA (women's fashion bags, Bangladesh)

The client's original PDF (`brief-v1-client.pdf`) stays as the record of what they asked for. This file is what I design from. Client answers to my questions are recorded in `engagement.md`; user assumptions are in `context.md` (synthetic research, not validated).

**Problem:** ELARA sells through Instagram and Facebook and has no website. A shopper who likes a bag doubts whether it matches the photo, the quality, the size and material, and whether delivery, returns and payment are safe. The website exists to remove that doubt so Discover, Evaluate, Trust and Purchase feel easy.

**Success:** before launch, at least 4 of 5 testers complete each core task on the prototype (find a bag and state its size and delivery charge, Buy Now checkout in 3 minutes, tell Buy Now from Add to Bag, retry after a failed payment). After launch, checkout completion is the metric this design moves most. Post-launch conversion (client target 2 to 3%) is not my responsibility.

## The three questions, and my answers

**1. Guest checkout or account required?**
My answer: Guest checkout for Buy Now and Add to Bag. Account is never required; after an order, offer to create one for order tracking and wishlist.
Confidence: confident (note: the evidence is synthetic research plus common practice, not real ELARA users).

**2. After a failed payment, show only Retry, or also offer switching to COD?**
My answer: show Retry, and where possible offer switching to COD.
Confidence: guess. COD is now nationwide with no order limit, which makes it the easiest fallback, but COD orders are returned to sender more often, which costs ELARA. Needs the client's decision.

**3. Delivery charge on the product page, before the address is known?**
My answer: always show "Dhaka ৳60, outside Dhaka ৳120, free over ৳3,000" on the PDP. No extra step; exact amount appears once the address is chosen at checkout.
Confidence: confident.

## The contradiction I am taking a side on

The brief ranks "Mobile usability" sixth of six UX priorities, yet the client's KPIs list mobile conversion separately, and our research assumes most shoppers buy on a phone. **I take mobile.** Design starts at 390px and desktop adapts from it.
What the other side loses: desktop gets less visual refinement and lower-priority detail, though it is not dropped. Long-spec evaluation (leather type, lining, interior) on a wide screen, which a few shoppers do, gets less first-pass attention.

## What the brief still does not tell me

- Whether real ELARA shoppers behave as the synthetic research says. Nobody has tested this; it is the biggest hole.
- Which payment gateway (client to confirm in Week 1) and whether it is hosted, since that decides the failed-payment messages.
- Whether the logo file is vector and whether any brand colour or font exists.
- What ELARA's Messenger customers ask most, and how orders are taken today. The client is not sharing the page, so this stays unknown.
- The client's view on offering COD after a failed payment (question 2).
