---
created: 2026-09-21
type: research
status: SYNTHETIC. AI-generated composites, not real people
tags: [persona, interviews, synthetic, elara]
---

# ELARA: eight synthetic user interviews (v1)

**Read this first.** These are fictional composites written by an AI, per the client's instruction to use AI-assisted research because there is no research budget. No real person said any of this. They are built from published studies on Bangladeshi online shopping (see `research-proto-persona.md`), and they were written to **disagree with each other**, because real users do.

**How to describe this honestly in the case study or to the client:** "AI-assisted synthetic research, grounded in published studies, not validated with real users."

**What it can be used for:** shaping wireframes, choosing what to test, deciding which trade-offs to raise with the client.
**What it cannot be used for:** claiming a percentage ("70% of users..."), or proving a design decision is right. Only real users can do that.

Same 13 core questions as `interview-guide` (last purchase, trigger, comparison, trust, payment, delivery, abandonment). Answers below are condensed by theme.

---

## D1. Nusrat, 27, marketing executive, Dhaka (Mirpur)
- **Device and time:** phone only, in bed 8 to 11pm. Saves screenshots, returns 2 days later.
- **Trigger:** Instagram sponsored post while looking at another brand.
- **Trust:** real customer photos, size in cm, delivery charge shown before checkout.
- **Payment:** COD unless the brand is proven. Then bKash.
- **Breaks trust:** colour arrived darker than the photo.

## D2. Farzana, 29, private school teacher, Dhaka (Mohammadpur)
- **Device and time:** phone at dining table around 10pm. Also checks lunchtime.
- **Trigger:** Facebook page she has watched for days. Decides on price and reviews.
- **Trust:** replies to her Messenger question within an hour. Reply speed matters more than the policy text.
- **Payment:** bKash for sellers she trusts; refuses advance payment to unfamiliar pages.
- **Breaks trust:** vague exchange rules; a seller who goes silent after payment.

## D3. Tasnia, 33, bank officer, Dhaka (Gulshan)
- **Device and time:** buys a leather work bag on **laptop** at her desk in lunch break, on a wide screen. Browses on phone.
- **Trigger:** friend's bag at a wedding, then searches the brand name on Google.
- **Trust:** wants leather type, lining, zip brand, interior compartments, care. Reads the full product detail.
- **Payment:** card. Will pay upfront for a known brand; hates COD calls from riders.
- **Breaks trust:** stock photos that look AI-made; no physical address or phone number.

## D4. Adiba, 19, university student, Dhaka (Dhanmondi)
- **Device and time:** phone, in the rickshaw or between classes. Small budget.
- **Trigger:** TikTok and Instagram Reels from influencers. Impulsive, often buys the same night.
- **Trust:** price and discount matter most; follows how many people commented.
- **Payment:** COD only, because she has no card and her bKash balance is small. Parents receive the parcel.
- **Breaks trust:** delivery charge that is nearly the price of a cheap bag.

## C1. Mim, 26, accounts assistant, Chattogram
- **Device and time:** phone in lunch break and at night.
- **Trigger:** Facebook post; checks comments for real customer replies.
- **Trust:** real photos, size, seller reply.
- **Payment:** COD as safer option. Will use bKash after two good orders.
- **Breaks trust:** courier delays with no update; colour mismatch.

## C2. Ruma, 38, mother and small home-based seller, Sylhet
- **Device and time:** phone at home, afternoon while the children nap. Poor 4G at times.
- **Trigger:** cousin's recommendation on WhatsApp.
- **Trust:** wants to hear from a person. Calls the number on the page before ordering.
- **Payment:** COD only. Wary of typing card or wallet details on a site she does not know.
- **Breaks trust:** address form that has no Upazila or asks for a Postcode she does not know; long loading pages on slow data.

## C3. Sadia, 24, freelance graphic designer, Khulna
- **Device and time:** laptop at home, evening. Comfortable with websites.
- **Trigger:** Pinterest and Instagram; follows brands, compares 3 to 5 sites before buying.
- **Trust:** consistent branding, good photography, return policy in plain words. Notices cheap templates.
- **Payment:** bKash and card. Would order COD only for a first purchase from a new brand.
- **Breaks trust:** a site that looks like every other shop; hidden costs at the last step.

## D5. Priya, 31, product manager at a startup, Dhaka (Banani)
- **Device and time:** phone during commute, buys on phone in Uber.
- **Trigger:** newsletter and Instagram from brands she already follows.
- **Trust:** wants fast checkout: saved address, one-tap payment. Will abandon a 5-step form.
- **Payment:** bKash. Already has it open on her phone.
- **Breaks trust:** forced account creation, and payment failure with no clear retry.

---

## Where they agree (pattern, not proof)

| Pattern | Who |
|---|---|
| Mobile is the main device for nearly everyone | 6 of 8 |
| Do not buy on first sight; save and return | D1, D2, C1, C3 |
| Trust comes from real photos, size, material, reply speed | 7 of 8 |
| Delivery charge shown late breaks trust | D1, D4, C1, C3 |
| COD is default for new brands | D1, D2, D4, C1, C2, C3 |

## Where they disagree (the design tension)

| Tension | One side | Other side | Design consequence |
|---|---|---|---|
| Speed vs reassurance | Priya wants a 1-tap checkout | Farzana and Ruma want to ask a human first | Guest checkout, saved address, **and** visible WhatsApp/Messenger contact |
| Device | Tasnia and Sadia buy on laptop | Others phone-only | Desktop PDP must carry the long spec detail; mobile needs accordion |
| Payment trust | Tasnia and Priya use card/bKash upfront | Adiba, Ruma COD only | Keep all four methods; do not hide COD |
| Image style | Tasnia, Sadia reject AI-looking imagery | Adiba responds to influencer-style photos | Clean product-first photography; avoid generic stock and AI placeholders in the final |
| Connectivity | Ruma has slow 4G | Others fine | Light images, lazy loading, no heavy hero video |

## Design implications to carry forward

1. Delivery charge and time appear on the PDP, not only at checkout.
2. Wishlist and "recently viewed" are core, not extras.
3. Address form: Division, District, Upazila/Thana, Area. Postcode optional and explained.
4. Reply-time promise and a visible human contact (WhatsApp/Messenger) on PDP and checkout.
5. Size shown in cm plus a comparison object or on-model reference, so it can be judged without touching it.
6. Guest checkout as the default path.
7. Weight of the page: performance is a design constraint here.

## Validate with real users later (five priority claims)

1. Do most shoppers really check delivery charge before adding to bag?
2. Is reply speed a stronger trust signal than return policy text?
3. How many buy on laptop for higher-priced bags?
4. Do they accept guest checkout without an account?
5. Does an AI-looking image reduce trust in this audience?
