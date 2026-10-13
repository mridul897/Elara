# ELARA: handover guide

## Where things live

| What | Where |
|---|---|
| Store (live) | https://elarabags.vercel.app |
| Admin | https://elarabags.vercel.app/admin |
| Code | GitHub `mridul897/Elara`, branch `main` (every push deploys to Vercel in about 2 minutes) |
| Database, login, photos | Supabase project `sxwniigfrjzxryhuavev` (Tokyo) |
| Design | Figma file `dNmCMOzCczBdcA3e5eyPfq`, page "Admin Panel" |

Accounts to keep safe: GitHub, Vercel, Supabase, the owner login (email + password). The "publishable" key in the code is meant to be public; never share the Supabase `service_role` key or the database password.

## Everyday use (Admin)

- **Dashboard**: revenue, orders, top products, what needs you.
- **Orders**: open an order, move it along (Confirm, Packed, Shipped, Delivered), add courier + tracking number, print the packing slip, WhatsApp or call the customer. Tick several rows to move or print them together.
- **Create order**: for phone or WhatsApp orders.
- **Products**: add or edit a bag, upload photos per colour, set stock per colour and size, set a sale price (with dates), publish or hide. Tick several to publish, hide, archive or put on sale together. Import many products from a CSV (they arrive as drafts without photos).
- **Promotions**: promo codes, sale prices overview, delivery charges.
- **Reviews**: approve or hide customer reviews. Only approved ones show on the store.
- **Messages**: contact-form messages and the list of emails collected by the newsletter, welcome popup and "notify me".
- **Content**: announcement bar, home hero, new arrivals, policy pages, contact details. Press **Publish changes**.
- **Settings**: payment methods on/off, team, low-stock level, analytics IDs, password.
- **Preview on store** (product page) shows what is saved, including drafts, before customers see it.
- **Ctrl + K** searches orders, customers and products. The bell lists what needs attention.

## What is NOT real yet

- **bKash, Nagad and card payments are a simulation.** Orders paid this way stay "pending" until you check the payment and press "Mark as paid". Cash on delivery is the real path until merchant accounts are connected.
- No email or SMS is sent to customers or to you. Use WhatsApp from the order page.
- PDP "Verified buyer" reviews and the star counts that came with the design are sample content.
- Demo orders (note starting with `[DEMO]`) are sample data. Remove them with `supabase/10-demo-clear.sql` before launch.

## The SQL files (supabase/), run in this order, once each

`01-schema` → `02-seed-1..4` → `03-storage` → `04-first-owner` (put your email in) → `05-orders-admin` → `06-track-address` → `07-promo-start` → `08-team-reviews` → `11-launch-ready`.
Optional: `09-demo-data-1..3` (sample orders), `10-demo-clear` (removes them).
Run them in Supabase → SQL Editor. They are safe to run again.

## Publishing changes safely

Every push to `main` goes live. To try something first, push to another branch: Vercel gives that branch its own preview address. Merge into `main` when it looks right.
After adding products, refresh the search-engine list: `node scripts/gen-sitemap.js`, then commit and push.
Check the site's health any time: `node scripts/smoke.js`.

## Costs and limits to know

- Supabase **Free** plan pauses the database after 7 days without use and has no automatic backups. Move to **Pro** when real customers arrive.
- Spam protection: the public can place at most 5 orders, 5 messages and 5 reviews per hour from one connection. Signed-in staff are not limited.
- The welcome code (WELCOME10) works once per phone number.
- Central Icons (used in the admin) need a licence for a live product.
