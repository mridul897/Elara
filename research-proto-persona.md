---
created: 2026-09-21
type: research
status: hypothesis, not validated by interviews
tags: [persona, research, elara]
---

# ELARA: proto-personas and interview plan

**Status: desk research only. No interviews have been done.** Everything below is a working hypothesis built from published studies and industry blogs. Nothing here is a quote from a real ELARA customer. Replace each hypothesis with what 5 to 6 real interviews show, then rename this file to `persona.md`.

## What the desk research says

| Finding | Source strength |
|---|---|
| Women are the majority of Facebook-based shoppers (about 59% in one survey) and own most F-commerce pages started since the pandemic. Social media drives the decision to buy. | Academic survey and press (medium) |
| Women perceive online shopping as riskier than men do: fraud, poor quality, information security. Many use COD as risk protection. | Academic (medium) |
| Top complaint: the product that arrives does not match the product shown; no touch-feel-try. Then delivery uncertainty, damage, delivery cost. | Multiple academic studies (medium-high) |
| COD is still the majority of e-commerce payments (figures range 78% to 81%). Digital payment is higher in Dhaka. | Blogs and one survey (**low, verify**) |
| Mobile drives roughly 70% to 85% of traffic and purchases. | Industry blogs (**low, verify**) |
| COD orders return to sender far more often (20% to 30% claimed) than mobile-money orders. | One vendor blog (**low, verify**) |

## Persona A: Dhaka, evaluates carefully

**Working name: Nusrat, 27, marketing executive, Dhaka.**

- **Trigger:** sees a bag on Instagram or a friend's shoulder. Arrives on the site already with one product in mind, so product pages must work as landing pages.
- **Device:** browses on her phone (commute, lunch, night). May move to a laptop to check size and material before paying. *Unvalidated.*
- **Payment:** comfortable with bKash or card for a known brand; falls back to COD when unsure. *Unvalidated.*
- **What she needs to say yes:** several angles including the inside, real dimensions, material, real customer photos, a clear return rule, and a delivery date.
- **What makes her leave:** photos that look edited or all model shots, hidden delivery cost, vague returns, no way to reach a human.
- **Design consequence:** PDP carries the weight. Trust content sits above the fold on mobile, not below the reviews.

## Persona B: Outside Dhaka, protects herself from risk

**Working name: Farzana, 24, university student, Chattogram or a district town.**

- **Trigger:** finds ELARA through Facebook or a friend's recommendation.
- **Device:** phone only. *Unvalidated.*
- **Payment:** strongly prefers COD because she has been burned by a product that did not match the photo. Uses bKash only after the brand feels proven.
- **What she needs to say yes:** COD clearly available, delivery time and charge shown before checkout, an address form that fits her area (Division, District, Upazila/Thana), an easy exchange path.
- **What makes her leave:** delivery charge revealed late, address form that does not recognise her area, unclear whether the parcel can be inspected.
- **Design consequence:** delivery and COD information appears on the PDP and again before payment, not only at checkout.

## Interview plan (5 to 6 people, not 8 to 12)

Why fewer: Discovery is budgeted at 3 to 4 days inside a fixed fee. Five or six interviews (3 Dhaka, 3 outside) find the main patterns. More than that is extra scope and belongs in `engagement.md` as paid research.

**Ground rules:** ask about the last real purchase, not what they would do. Never ask "do you trust reviews?".

1. Tell me about the last time you bought a bag or fashion accessory online. Where were you and what device were you on?
2. What made you look at it in the first place? What did you do in the ten minutes before?
3. Which other brands or pages did you check? What made you go back or leave?
4. What information made you think "yes, I can buy this"? What was missing that you had to ask about?
5. How did you pay? Was there a moment you almost did not?
6. Did the product match what you saw? What happened next?
7. Have you ever abandoned a purchase halfway? At which step and why?
8. (Outside Dhaka) What was different about ordering to your address?

**Also ask the client:** access to ELARA's Instagram or Facebook comments, DMs and past orders. It is the closest thing to existing data.

## Where the acid test fits

`/persona-acid-test` reviews a **design** through three lenses (confused user, skeptical engineer, impatient PM). It cannot run until there is an ELARA screen, a Figma link or a screenshot. Run it on the PDP or checkout after low-fi wireframes.
