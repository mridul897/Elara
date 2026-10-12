# ELARA admin panel (CMS): design brief

Status: DRAFT v1.1 (backend decided: Supabase). Written from the client request and from what the storefront does today. Items marked **[OPEN]** need a decision before design or build starts. Nothing here is invented client data.

## 1. Project context

ELARA is a women's leather bag store in Bangladesh. The storefront is built and live (home, product listing, product detail, bag, checkout with cash on delivery / bKash / Nagad / card, order tracking, account, contact) as static HTML on Vercel. Today the business side is blind: product names, prices and photos live in `assets/products.js`, so every price change is a code edit and a deploy; carts and orders exist only in each shopper's own browser (`localStorage`), so the owner never receives an order; payments are simulated, so "sales" are not real money yet. The client now wants an admin panel so the owner can run the shop without a developer: see how the business is doing, change products and prices, run discounts, and handle orders.

## 2. Target user

**Primary: the shop owner/operator.** Runs ELARA day to day from a phone and sometimes a laptop in Dhaka. Not technical. Checks orders in the morning and evening, packs and ships, answers customers on WhatsApp. Cares about: what came in today, what needs packing or confirming, what is selling, which price or discount to change. Does not care about: charts with many dimensions, settings she did not ask for, developer terms.

**Secondary: staff who pack and ship [OPEN: does one exist, how many].** Needs the order queue and packing details only. Should not see revenue or be able to change prices.

## 3. Emotional tone and design direction

**Control, then calm.** The owner should know where the business stands within ten seconds of opening it, and never wonder "did that save?". Quiet, spacious, numbers first, one obvious next action per screen.

Reference: **Shopify admin (Home and Orders)**. It answers "what needs me now" before it shows history, and an order is one row with a clear status and one next step. We reuse that priority, not its density; ELARA's palette and type (Fraunces headings, Inter UI, warm neutrals) carry over from the storefront so it feels like the same brand.

## 4. Functional requirements

**Dashboard**
1. Show today's revenue, number of orders, average order value and orders waiting for action, with a date switch (today, 7 days, 30 days, custom).
2. Show a sales-over-time chart, top 5 products, payment-method split (COD / bKash / Nagad / card) and low-stock products.
3. Link every number to the list behind it (e.g. "6 orders to confirm" opens those orders).

**Products**
4. Create, edit, duplicate, archive and delete a product: name, category, description, materials, dimensions in cm, price, colours (each with its own photos), sizes, stock per colour and size, badge (New, Best seller), published or draft.
5. Upload and reorder product photos; resize and convert to web formats automatically.
6. Set a sale price per product or in bulk (percent or fixed), with an optional start and end date; show the original price struck through on the storefront.
7. Search, filter and sort the product list; bulk edit price and stock.

**Orders**
8. List orders with search (order number, phone, name) and filters (status, payment method, payment state, date).
9. Open an order: items, customer, address, payment, timeline; change status (placed, confirmed, packed, shipped, delivered, cancelled, returned) and payment state (pending, paid, failed, refunded).
10. Print a packing slip / invoice and export orders to CSV.
11. Add an internal note and see who changed what and when.

**Promotions and delivery**
12. Create promo codes: percent or fixed, minimum order, usage limit, expiry, on/off.
13. Edit delivery rules: Dhaka and outside-Dhaka charge, delivery days, free-delivery threshold (currently Tk. 60, Tk. 120, free over Tk. 3,000).

**Customers and reviews**
14. List customers with order count, total spent and phone; open one to see their orders.
15. Approve, hide or delete reviews; see rating summary per product.

**Content**
16. Edit the home hero, the New Arrivals and Spotlight selections, announcement bar text, contact details and policy pages without code.

**Access**
17. Require sign-in; support at least Owner (everything) and Staff (orders only); log every change.

**Storefront connection** (required for any of the above to matter)
18. Make the storefront read products, prices, discounts, promo codes, delivery rules and reviews from the same data the admin edits, and make checkout write each order there so tracking looks it up.

## 5. Constraints

- The storefront is static HTML with no build step on Vercel; there is **no backend today**. A "fully functional" panel needs a hosted database, authentication and file storage. **Decided: Supabase** (Postgres + Auth + Storage + row-level security; the static storefront and the admin talk to it directly, no server of our own).
- Payments are simulated. Real bKash, Nagad and card payments need merchant accounts and server-side confirmation; until then the admin must label payment state honestly and COD is the only fully real flow.
- Currency is BDT, whole numbers, shown as "Tk. 4,500/-".
- Owner uses a phone most of the time: the panel is **mobile-first**, then laptop.
- Security: admin keys never ship to the browser; customers' phone numbers and addresses are private; roles enforced on the server, not only hidden in the UI.
- Existing storefront must keep working during migration (no big-bang switch).
- Reuse ELARA tokens (colors, type, radii) and the Figma file; accessibility: keyboard reachable, 44px touch targets, contrast AA.
- Language: English UI first **[OPEN: Bangla labels needed?]**.

## 6. Success criteria

Behavioral
- The owner changes a product price or starts a discount and sees it on the live storefront within one minute, without asking a developer.
- The owner confirms and ships an order from her phone without help on the first try.

Metrics
- 100% of orders placed on the storefront appear in the admin (zero lost orders).
- Dashboard loads in under 2 seconds on a mid-range Android on 4G.
- A new product with three colours and photos can be published in under 5 minutes by someone who has never used the panel.

## Open questions (answer these before design starts)

1. ~~Backend choice~~ **Decided: Supabase** (hosted Postgres, login, image storage; no server to run).
2. **Real money or demo?** Do bKash / Nagad / card go live with this release, or does admin launch with COD plus manual payment confirmation?
3. **Who logs in?** One owner, or owner plus staff? Any role that must not see revenue?
4. **Stock:** is inventory tracked per colour and size, or just "in stock / out of stock"?
5. **Order fulfilment:** which courier, and does the owner need tracking numbers or courier booking later?
6. **Customer notifications:** SMS / WhatsApp / email on order confirmed and shipped, or manual for now?
7. **Existing data:** keep the 45 products and their photos from `assets/products.js` as the starting catalogue?
8. **Bangla:** admin labels in Bangla, English, or switchable?

## Proposed order of work

0. Decisions above; short grill session; admin information architecture.
1. Data model and backend; migrate products; storefront reads from it; orders written to it.
2. Admin: sign-in, products, orders (the money path).
3. Dashboard, discounts, promo codes, delivery rules.
4. Customers, reviews, content editing, roles and activity log.
5. Real payment gateways (separate project: needs merchant accounts and server callbacks).
