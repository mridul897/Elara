# ELARA: put the website live (Vercel + GitHub)

This folder is the whole website. There is no build step: it is plain HTML, CSS and JavaScript.

- Entry page: `index.html` (the homepage)
- Other pages: `my-plp-screen.html` (shop), `my-product-detail-screen.html` (product), `my-cart-screen.html`, `my-checkout-review.html`, `my-payment.html`, `my-order-success.html`, `my-order-tracking.html`, `my-account.html`, `my-contact-screen.html`
- Not-found page: `404.html`
- Images, videos, data: `assets/`
- Vercel settings: `vercel.json`; files kept out of the live site: `.vercelignore`

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
3. **Framework Preset:** Other. **Build command:** leave empty. **Output directory:** leave empty (or `.`).
4. Press **Deploy**. In about a minute you get a `*.vercel.app` address.

Every later `git push` to `main` updates the live site by itself.

If you push the whole `claude-for-designers` course folder instead of only this one, set **Root Directory** in Vercel to `projects/elara-womens-bags`.

## 3. Live address

The site is live at https://elarabags.vercel.app (canonical address, sitemap and share-preview image all use it). If the address ever changes, update `SITE` in the meta tags of each page, `sitemap.xml` and `robots.txt`.

## 4. Things to know

- **Orders, accounts, reviews and messages are saved in the visitor's own browser** (localStorage). Nothing is sent to a server, so you will not receive orders. A real shop needs a backend.
- **Placeholders to replace before launch:** phone `+880 1XXX-XXXXXX`, e-mail `hello@elara.bd`, studio address, WhatsApp number, product ratings and review texts, the footer legal pages.
- **Change the promo codes or the free-delivery amount** in `my-cart-screen.html` (`PROMOS`, `FREE_DELIVERY_AT`) and `my-checkout-review.html` / `my-payment.html`.
- **Mobile:** the pages are designed at 1440 px and scale down as one piece. A true phone layout is not designed yet.
- The old working files are in `_archive/`; they are not part of the site.
