# ELARA: put the website live (Vercel + GitHub)

This folder is the whole website. On every deploy Vercel runs `node scripts/build.js`, which turns these source files into the finished site in `dist/`:

- clean addresses (`/shop`, `/tote-bags`, `/bags/<id>`, `/contact`, `/cart` ...) and every link rewritten to match;
- a ready-made HTML page for every bag, listing and policy page (what search engines read without running scripts), each with its own title, description, canonical address, share image, breadcrumbs and structured data;
- minified JavaScript and CSS, no source maps;
- `sitemap.xml` and `robots.txt`, written from the live product list;
- a self-check that stops the deploy if a link is broken, a title repeats, an image has no alt text, or a long dash or old address is left. A failed build never replaces the live site.

Where things are:

- Source pages (edit these): `index.html`, `my-plp-screen.html` (shop and listings), `my-product-detail-screen.html` (bag page), `my-cart-screen.html`, `my-checkout-review.html`, `my-payment.html`, `my-card-payment.html`, `my-order-success.html`, `my-order-tracking.html`, `my-account.html`, `my-contact-screen.html`, `page.html` (policy pages), `404.html`
- Images, videos, data: `assets/`
- Admin panel: `admin/`
- Build, checks, local server: `scripts/build.js`, `scripts/check.js`, `scripts/serve.js`
- Vercel settings (build command, redirects from the old addresses, headers): `vercel.json`

Try a build on your own computer:

```bash
npm install
node scripts/build.js      # writes dist/ and runs the checks
node scripts/serve.js      # opens dist/ at http://localhost:5830 the way Vercel serves it
```

## 1. Push to GitHub

Run these in this folder (the one that contains `index.html`):

```bash
git init
git add .
git commit -m "ELARA website"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Create the empty repository on github.com first (no README, no .gitignore), then paste its URL above.

## 2. Make it live on Vercel

1. Go to vercel.com, sign in with GitHub, press **Add New → Project**.
2. Pick the repository you just pushed.
3. **Framework Preset:** Other. Leave Build command and Output directory as they are: `vercel.json` sets them (`node scripts/build.js` and `dist`).
4. Press **Deploy**. In about a minute you get a `*.vercel.app` address.

Every later `git push` to `main` updates the live site by itself.

If you push the whole `claude-for-designers` course folder instead of only this one, set **Root Directory** in Vercel to `projects/elara-womens-bags`.

## 3. Live address

The site is live at https://elarabags.vercel.app (canonical address, sitemap and share-preview image all use it). If the address ever changes, update `SITE` at the top of `scripts/build.js` and the address in the meta tags of the source pages.

## 4. Things to know

- **Orders, accounts, reviews and messages are saved in the visitor's own browser** (localStorage). Nothing is sent to a server, so you will not receive orders. A real shop needs a backend.
- **Placeholders to replace before launch:** phone `+880 1XXX-XXXXXX`, e-mail `hello@elara.bd`, studio address, WhatsApp number, product ratings and review texts, the footer legal pages.
- **Change the promo codes or the free-delivery amount** in `my-cart-screen.html` (`PROMOS`, `FREE_DELIVERY_AT`) and `my-checkout-review.html` / `my-payment.html`.
- **Mobile:** the pages are designed at 1440 px and scale down as one piece. A true phone layout is not designed yet.
- The old working files are in `_archive/`; they are not part of the site.
