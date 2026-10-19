#!/usr/bin/env node
/*
 * ELARA build. Runs on every Vercel deploy (see vercel.json) and by hand:  node scripts/build.js
 *
 * Source files in this folder stay exactly as they are. The build copies the public site into dist/ and there:
 *   1. gives every page its clean address (/shop, /contact, /bags/<id> ...) and rewrites every link to match;
 *   2. pre-renders the pages that search engines need to read without running JavaScript:
 *      one page per bag, one per listing (all bags, each category, new arrivals, best sellers) and the policy pages,
 *      each with its own title, description, canonical, share image, breadcrumbs and structured data;
 *   3. minifies JavaScript and CSS (never writes source maps);
 *   4. writes sitemap.xml and robots.txt;
 *   5. checks the result and fails the build if something is wrong, so a bad build never replaces the live site.
 *
 * Product and page text is read from the live shop database (public, read-only key). If it cannot be reached the
 * build falls back to assets/products.js, so a deploy never fails because of the network.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://elarabags.vercel.app';
const SB_URL = 'https://sxwniigfrjzxryhuavev.supabase.co';
const SB_KEY = 'sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs';
const OG_DEFAULT = SITE + '/assets/og/elara-og.jpg';
const OG_ALT = 'ELARA: a woman carrying a taupe leather tote bag';

const warnings = [];
const warn = (m) => { warnings.push(m); console.warn('  warning: ' + m); };

// ------------------------------------------------------------------------------------------------ addresses
const PAGES = {            // source file -> clean address
  'index.html': '/',
  'index-mobile.html': '/home-mobile',
  'my-plp-screen.html': '/shop',
  'my-contact-screen.html': '/contact',
  'my-cart-screen.html': '/cart',
  'my-checkout-review.html': '/checkout',
  'my-payment.html': '/payment',
  'my-card-payment.html': '/card-payment',
  'my-order-success.html': '/order-confirmed',
  'my-order-tracking.html': '/track-order',
  'my-account.html': '/account',
  'page.html': '/information',
};
const CATS_DEFAULT = {     // category id -> listing page (the five the store started with; more come from Admin > Categories)
  tote: { path: '/tote-bags', label: 'Tote', title: 'Leather tote bags for women', h: 'Tote bags', blurb: 'Roomy leather totes for work, study and every day' },
  shoulder: { path: '/shoulder-bags', label: 'Shoulder', title: 'Leather shoulder bags for women', h: 'Shoulder bags', blurb: 'Leather shoulder bags that sit comfortably all day' },
  crossbody: { path: '/crossbody-bags', label: 'Crossbody', title: 'Leather crossbody bags for women', h: 'Crossbody bags', blurb: 'Hands-free leather crossbody bags for the day ahead' },
  mini: { path: '/mini-bags', label: 'Mini', title: 'Mini leather bags for women', h: 'Mini bags', blurb: 'Small leather bags for the essentials' },
  'travel-work': { path: '/travel-work-bags', label: 'Travel & Work', title: 'Leather travel and work bags for women', h: 'Travel & Work', blurb: 'Leather bags that carry a laptop, a lunch and a long day' },
};
const CATS = Object.assign({}, CATS_DEFAULT);
const CAT_SINGULAR_DEFAULT = { tote: 'Tote Bag', shoulder: 'Shoulder Bag', crossbody: 'Crossbody Bag', mini: 'Mini Bag', 'travel-work': 'Travel and Work Bag' };
const catSingular = (id) => CAT_SINGULAR_DEFAULT[id] || (CATS[id] ? (/bag/i.test(CATS[id].label) ? CATS[id].label : CATS[id].label + ' Bag') : 'Bag');
const catHeading = (id) => (CATS_DEFAULT[id] ? CATS_DEFAULT[id].h : (/bag|&|work/i.test(CATS[id].label) ? CATS[id].label : CATS[id].label + ' Bags'));
// categories from the shop database replace the built-in list (names, order, which ones are shown)
function applyCategories(rows) {
  if (!rows || !rows.length) return;
  Object.keys(CATS).forEach((k) => delete CATS[k]);
  rows.forEach((c) => {
    const base = CATS_DEFAULT[c.id], nm = noDash(c.name);
    CATS[c.id] = base ? Object.assign({}, base, { label: nm }) : { path: '/' + c.id + '-bags', label: nm, title: 'Leather ' + nm.toLowerCase() + ' bags for women', h: nm, blurb: nm + ' leather bags for women, made in Bangladesh' };
  });
}
const POLICIES = {
  shipping: { path: '/shipping-and-delivery', name: 'Shipping and delivery' },
  returns: { path: '/returns-and-exchange', name: 'Returns and exchange' },
  story: { path: '/our-story', name: 'Our story' },
  privacy: { path: '/privacy-policy', name: 'Privacy policy' },
  terms: { path: '/terms-of-service', name: 'Terms of service' },
};
const POLICY_BY_LABEL = { 'Shipping & Delivery': 'shipping', 'Returns & Exchange': 'returns', 'Our Story': 'story', 'Privacy Policy': 'privacy', 'Terms of Service': 'terms', 'Terms & Conditions': 'terms' };

// Every route that is a folder with an index.html in dist (the clean address is the folder name).
const noindexPaths = new Set(['/home-mobile', '/cart', '/checkout', '/payment', '/card-payment', '/order-confirmed', '/track-order', '/account', '/information']);

// ------------------------------------------------------------------------------------------------ helpers
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => 'Tk. ' + Number(n).toLocaleString('en-US') + '/-';
const abs = (u) => (/^https?:/.test(u) ? u : SITE + '/' + String(u).replace(/^\//, ''));
const clip = (t, n) => { t = String(t).replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; const c = t.slice(0, n - 3); return c.slice(0, c.lastIndexOf(' ')) + '...'; };
const noDash = (t) => String(t == null ? '' : t).replace(/\s*—\s*/g, ', ').replace(/(\d)\s*–\s*(\d)/g, '$1 to $2').replace(/\s–\s/g, ' to ').replace(/–/g, '-');
const ld = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (rel, data) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
const pageFile = (p) => (p === '/' ? 'index.html' : p.replace(/^\//, '') + '/index.html');

// ------------------------------------------------------------------------------------------------ catalogue
async function sb(pathAndQuery) {
  const r = await fetch(SB_URL + '/rest/v1/' + pathAndQuery, { headers: { apikey: SB_KEY }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function normalise(rows) {
  const now = Date.now();
  return rows.map((p) => {
    const cols = (p.product_colours || []).slice().sort((a, b) => a.position - b.position);
    const on = p.sale_price != null && (!p.sale_starts || new Date(p.sale_starts) <= now) && (!p.sale_ends || new Date(p.sale_ends) >= now);
    let stock = 0;
    cols.forEach((c) => (c.product_variants || []).forEach((v) => { stock += v.stock || 0; }));
    return {
      id: p.id, name: noDash(p.name), cat: p.cat, badge: p.badge || null, eyebrow: noDash(p.eyebrow || ''), price: on ? p.sale_price : p.price, was: on ? p.price : null,
      desc: noDash(p.description || ''), dims: p.dims || [], fits: noDash(p.fits || ''), care: noDash(p.care || ''), updated: p.updated_at || null, stock,
      colours: cols.filter((c) => c.card || (c.photos && c.photos.length)).map((c) => {
        const ph = c.photos || [], card = c.card || (ph[0] && ph[0].src);
        return { id: c.id, label: noDash(c.label), card, photos: ph.length ? ph : [{ src: card, alt: 'front view', contain: false }] };
      }),
    };
  }).filter((p) => p.colours.length);
}
function fromStatic() {
  const vm = require('vm');
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(read('assets/products.js'), ctx);
  return (ctx.window.ELARA_PRODUCTS || []).map((p) => ({
    id: p.id, name: noDash(p.name), cat: p.cat, badge: p.badge || null, eyebrow: noDash(p.eyebrow || ''), price: p.price, was: p.was || null, desc: noDash(p.desc || ''), dims: p.dims || [], fits: noDash(p.fits || ''),
    care: noDash(p.care || ''), updated: null, stock: 1,
    colours: p.colours.map((c) => ({ id: c.id, label: noDash(c.label), card: c.card, photos: c.photos && c.photos.length ? c.photos : [{ src: c.card, alt: 'front view', contain: false }] })),
  }));
}
async function loadData() {
  let products, settings = {}, categories = null, source = 'live shop database';
  try {
    const rows = await sb('products?select=id,name,cat,eyebrow,badge,price,sale_price,sale_starts,sale_ends,description,dims,fits,care,updated_at,position,' +
      'product_colours(id,label,card,photos,position,product_variants(stock))&status=eq.published&order=position.asc&limit=1000');
    products = normalise(rows);
    if (!products.length) throw new Error('no products returned');
    (await sb('settings?select=key,value')).forEach((r) => { settings[r.key] = r.value; });
    try { categories = await sb('categories?select=id,name,position&order=position.asc'); } catch (e) { categories = null; }   // table missing: the built-in five stay
  } catch (e) {
    warn('could not read the live shop database (' + e.message + '); using assets/products.js');
    products = fromStatic(); source = 'assets/products.js';
  }
  return { products, settings, categories, source };
}

// ------------------------------------------------------------------------------------------------ link rewriting
const JS_RULES = [
  // [pattern, replacement, required?]   (exact snippets in the page scripts that build links from product ids)
  ["'my-product-detail-screen.html' + (hit ? '?p=' + hit.id : '')", "(hit ? '/bags/' + hit.id : '/shop')", true],
  [/OPEN = 'my-product-detail-screen\.html'/g, "OPEN = '/bags/'", true],
  [/OPEN \+ '\?p=([a-z0-9-]+)&colour=([a-z0-9-]+)'/g, "OPEN + '$1?colour=$2'", true],
  ["var PDP = 'my-product-detail-screen.html';", "var PDP = '/bags/';", true],
  ["PDP + '?p=' + p.id + '&colour=' + c.id", "PDP + p.id + '?colour=' + c.id", true],
  ["PDP + (p.id ? '?p=' + p.id : '')", "(p.id ? PDP + p.id : '/shop')", true],
  ["PDP + '?p=' + d.id + '&colour=' + c.id", "PDP + d.id + '?colour=' + c.id", true],
  ["'my-product-detail-screen.html' + (p[0] ? '?p=' + encodeURIComponent(p[0]) + (p[1] ? '&colour=' + encodeURIComponent(p[1]) : '') : '')",
    "(p[0] ? '/bags/' + encodeURIComponent(p[0]) + (p[1] ? '?colour=' + encodeURIComponent(p[1]) : '') : '/shop')", true],
  ["'my-product-detail-screen.html?p=' + p.key + (colour && p.colours && colour !== p.colours[0] ? '&colour=' + colour.id : '')",
    "'/bags/' + p.key + (colour && p.colours && colour !== p.colours[0] ? '?colour=' + colour.id : '')", true],
  ["'my-product-detail-screen.html?p=' + product.id + '&colour=' + c.id", "'/bags/' + product.id + '?colour=' + c.id", true],
  [/my-product-detail-screen\.html\?p=' \+ (encodeURIComponent\([\w.]+\)) \+ '&preview=1/g, "/bags/' + $1 + '?preview=1", true],
  [/my-product-detail-screen\.html\?p=' \+ /g, "/bags/' + ", true],
  ["'my-plp-screen.html?category=' + product.cat", "'/' + product.cat + '-bags'", true],
  ["'page.html?p=' + slug", "({ shipping: '/shipping-and-delivery', returns: '/returns-and-exchange', story: '/our-story', privacy: '/privacy-policy', terms: '/terms-of-service' })[slug]", true],
];

function mapUrls(text, { admin = false } = {}) {
  if (!admin) text = text.split(SITE + '/').join('§SITE§');   // full addresses are mapped like relative ones, then restored
  const used = new Map();
  JS_RULES.forEach(([from, to], i) => {
    const before = text;
    text = typeof from === 'string' ? text.split(from).join(to) : text.replace(from, to);
    if (text !== before) used.set(i, true);
  });
  const up = admin ? '\\.\\./' : '(?<![\\w/.:-])';       // admin pages reach the store with "../"
  const R = (s, flags) => new RegExp(up + s, flags || 'g');
  const out = (to) => (admin ? to : to);
  // product pages
  text = text.replace(R('my-product-detail-screen\\.html\\?p=([a-z0-9-]+)(?:&amp;|&)colour=([a-z0-9-]+)'), '/bags/$1?colour=$2');
  text = text.replace(R('my-product-detail-screen\\.html\\?p=([a-z0-9-]+)(?:&amp;|&)preview=1'), '/bags/$1?preview=1');
  text = text.replace(R('my-product-detail-screen\\.html\\?p=([a-z0-9-]+)'), '/bags/$1');
  // listings
  text = text.replace(R('my-plp-screen\\.html\\?category=(tote|shoulder|crossbody|mini|travel-work)(?![a-z,-])'), (m, c) => CATS[c].path);
  text = text.replace(R('my-plp-screen\\.html\\?collection=new\\b'), '/new-arrivals');
  text = text.replace(R('my-plp-screen\\.html\\?collection=best\\b'), '/best-sellers');
  // policy pages
  text = text.replace(R('page\\.html\\?p=(shipping|returns|story|privacy|terms)'), (m, s) => POLICIES[s].path);
  // footer links that used to open a "coming soon" note: they are real pages now
  text = text.replace(/<a href="#" data-soon="([^"]+)" data-soon-page>/g, (m, label) => { const k = POLICY_BY_LABEL[label.replace(/&amp;/g, '&')]; return k ? '<a href="' + POLICIES[k].path + '">' : m; });
  // the top menu words are real links too (the drop-down still opens on hover)
  text = text.replace(/(data-menu="new-arrivals"><a )href="#"/g, '$1href="/new-arrivals"').replace(/(data-menu="bags"><a )href="#"/g, '$1href="/shop"').replace(/(data-menu="best-sellers"><a )href="#"/g, '$1href="/best-sellers"');
  text = text.replace(/(<a )href="#"( class="nav-logo")/g, '$1href="/"$2');
  // plain page names (keeps any ?query or #hash that follows)
  Object.entries(PAGES).forEach(([file, to]) => {
    if (file === 'index.html') return;
    text = text.replace(R(file.replace(/\./g, '\\.')), to);
  });
  text = text.replace(R('my-product-detail-screen\\.html'), '/shop');
  text = text.replace(R('index\\.html'), '/');
  if (admin) text = text.replace(/\.\.\/\//g, '/');
  else text = text.replace(/§SITE§\//g, SITE + '/').replace(/§SITE§/g, SITE + '/');
  return text;
}

// ------------------------------------------------------------------------------------------------ <head> editing
function setTag(html, re, tag, where) {
  if (re.test(html)) return html.replace(re, () => tag);
  return html.replace(where || '</head>', () => tag + '\n' + (where || '</head>'));
}
function head(html, o) {
  const title = o.title, desc = o.desc, url = SITE + o.path;
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => '<title>' + esc(title) + '</title>');
  html = setTag(html, /<meta name="description"[^>]*>/, '<meta name="description" content="' + esc(desc) + '">');
  html = setTag(html, /<link rel="canonical"[^>]*>/, '<link rel="canonical" href="' + url + '">');
  const robots = o.noindex ? '<meta name="robots" content="noindex, nofollow">' : '';
  if (/<meta name="robots"[^>]*>/.test(html)) html = html.replace(/<meta name="robots"[^>]*>\s*/, () => (robots ? robots : ''));
  else if (robots) html = html.replace('</head>', () => robots + '\n</head>');
  const og = (p, v) => setTag(html, new RegExp('<meta property="' + p + '"[^>]*>'), '<meta property="' + p + '" content="' + esc(v) + '">');
  const tw = (n, v) => setTag(html, new RegExp('<meta name="' + n + '"[^>]*>'), '<meta name="' + n + '" content="' + esc(v) + '">');
  html = og('og:type', o.ogType || 'website'); html = og('og:site_name', 'ELARA'); html = og('og:locale', 'en_BD');
  html = og('og:url', url); html = og('og:title', title); html = og('og:description', desc);
  const img = o.image || OG_DEFAULT;
  html = og('og:image', img); html = og('og:image:alt', o.imageAlt || OG_ALT);
  if (o.image) html = html.replace(/<meta property="og:image:(width|height)"[^>]*>\s*/g, '');
  else { html = og('og:image:width', '1200'); html = og('og:image:height', '630'); }
  html = tw('twitter:card', 'summary_large_image'); html = tw('twitter:title', title); html = tw('twitter:description', desc);
  html = tw('twitter:image', img); html = tw('twitter:image:alt', o.imageAlt || OG_ALT);
  if (!/rel="icon"/.test(html)) html = html.replace('</head>', () => ICONS + '\n</head>');
  if (o.preload) html = html.replace('</head>', () => '<link rel="preload" as="image" href="' + esc(o.preload) + '" fetchpriority="high">\n</head>');
  if (o.jsonld && o.jsonld.length) html = html.replace('</head>', () => o.jsonld.map(ld).join('\n') + '\n</head>');
  return html;
}
const ICONS = [
  '<link rel="icon" href="/favicon.ico" sizes="any">', '<link rel="icon" type="image/svg+xml" href="/assets/home/favicon.svg">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png">', '<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">',
  '<link rel="manifest" href="/site.webmanifest">', '<meta name="theme-color" content="#FFFDF9">',
].join('\n');
// Deep pages (/bags/<id>) resolve relative links from the site root; in-page "#anchor" links are pointed back at the page.
const DEEP = '<base href="/">\n<script>document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest(\'a[href^="#"]\');if(a)a.setAttribute("href",location.pathname+location.search+a.getAttribute("href"))},true)</script>';

const breadcrumbLd = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: SITE + it[1] })) });
function businessLd(settings) {
  const c = settings.contact || {}, tel = String(c.whatsapp || '+880 1320575476').replace(/[^\d+]/g, '');
  return [{
    '@context': 'https://schema.org', '@type': 'OnlineStore', '@id': SITE + '/#store', name: 'ELARA', url: SITE + '/', logo: SITE + '/assets/icons/icon-512.png', image: OG_DEFAULT,
    description: 'Premium leather bags for women, designed in Bangladesh. Totes, shoulder, crossbody, mini and travel bags with cash on delivery across Bangladesh.',
    email: c.email || 'hello@elara.com.bd', telephone: tel, currenciesAccepted: 'BDT', paymentAccepted: 'Cash on delivery, bKash, Nagad, credit and debit card',
    areaServed: { '@type': 'Country', name: 'Bangladesh' }, address: { '@type': 'PostalAddress', addressCountry: 'BD' },
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: tel, email: c.email || 'hello@elara.com.bd', areaServed: 'BD', availableLanguage: ['English', 'Bengali'] }],
  }, {
    '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'ELARA', publisher: { '@id': SITE + '/#store' }, inLanguage: 'en-BD',
  }];
}

// ------------------------------------------------------------------------------------------------ page generators
function productCard(p) {
  const c = p.colours[0];
  return '<a class="ssr-card" href="/bags/' + esc(p.id) + '"><img src="' + esc(c.card) + '" alt="' + esc(p.name + ', ' + c.label) + '" width="400" height="500" loading="lazy">' +
    '<h2>' + esc(p.name) + '</h2><p>' + (p.was ? '<s>' + money(p.was) + '</s> ' : '') + money(p.price) + '</p></a>';
}
function deliveryOf(settings) {
  const d = settings.delivery || {};
  return { dhaka: d.dhaka != null ? d.dhaka : 60, outside: d.outside != null ? d.outside : 120, freeOver: d.free_over != null ? d.free_over : 3000, dd: noDash(d.dhaka_days || '1-3').replace(/-/, ' to '), od: noDash(d.outside_days || '3-5').replace(/-/, ' to ') };
}

function productPage(tpl, p, ctx) {
  const cat = CATS[p.cat] || { path: '/shop', label: 'Bags' };
  const col = p.colours[0], photo0 = col.photos[0] ? col.photos[0].src : col.card;
  const title = p.name + ' | Leather ' + catSingular(p.cat) + ' | ELARA';
  const desc = clip(p.name + ': ' + p.desc, 155);
  const url = SITE + '/bags/' + p.id;
  const dl = deliveryOf(ctx.settings);
  const instock = p.stock > 0;
  const product = {
    '@context': 'https://schema.org', '@type': 'Product', '@id': url + '#product', name: p.name, sku: p.id, description: noDash(p.desc), image: col.photos.map((x) => abs(x.src)).slice(0, 6),
    brand: { '@type': 'Brand', name: 'ELARA' }, category: catSingular(p.cat), color: p.colours.map((c) => c.label).join(', '), material: 'Leather',
    offers: {
      '@type': 'Offer', url, priceCurrency: 'BDT', price: String(p.price), availability: 'https://schema.org/' + (instock ? 'InStock' : 'OutOfStock'), itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'ELARA' },
      shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: dl.dhaka, currency: 'BDT' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BD' },
        deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' } } },
    },
  };
  let h = tpl;
  // server-rendered content (the page script fills the same elements again with identical text)
  const name = p.name + ', ' + col.label;
  h = h.replace('<h1 class="product-name"></h1>', () => '<h1 class="product-name">' + esc(name) + '</h1>');
  h = h.replace(/(<span aria-current="page" id="crumbName">)(<\/span>)/, (m, a, b) => a + esc(p.name) + b);
  h = h.replace(/<a href="my-plp-screen\.html\?category=tote" id="crumbCat">Tote<\/a>/, () => '<a href="' + cat.path + '" id="crumbCat">' + esc(cat.label) + '</a>');
  h = h.replace(/(<p class="eyebrow" id="eyebrow">)[^<]*(<\/p>)/, (m, a, b) => a + esc(p.eyebrow || (cat.label + ' Bags · Premium Leather')) + b);
  h = h.replace(/(<p class="price" id="price">)[^<]*(<\/p>)/, (m, a, b) => a + (p.was ? '<span class="was">' + money(p.was) + '</span>' : '') + money(p.price) + b);
  const [dw, dh, dd] = p.dims;
  if (dw) h = h.replace(/(<span class="value" id="sizeNote">)[^<]*(<\/span>)/, (m, a, b) => a + esc(dw + ' x ' + dh + ' x ' + dd + ' cm' + (p.fits ? ', ' + p.fits : '')) + b);
  h = h.replace(/(<span class="value" id="colourValue">)[^<]*(<\/span>)/, (m, a, b) => a + esc(col.label) + b);
  h = h.replace(/(<p class="acc-body" id="descBody">)[\s\S]*?(<\/p>)/, (m, a, b) => a + esc(p.desc) + b);
  if (dw) h = h.replace(/(<p class="acc-body" id="dimBody">)[\s\S]*?(<\/p>)/, (m, a, b) => a + 'Width ' + dw + ' cm, height ' + dh + ' cm, depth ' + dd + ' cm' + b);
  if (p.care) h = h.replace(/(<p class="acc-body" id="careBody">)[\s\S]*?(<\/p>)/, (m, a, b) => a + esc(p.care) + b);
  h = h.replace(/<img id="mainPhotoImg" src="data:image\/gif;base64,[^"]*" alt="" style="opacity:0">/, () =>
    '<img id="mainPhotoImg" src="' + esc(photo0) + '" alt="' + esc(p.name + ', ' + col.label + ', front view') + '" width="900" height="1125" fetchpriority="high">');
  const others = ctx.products.filter((x) => x.cat === p.cat && x.id !== p.id);
  const rel = others.slice(Math.max(0, ctx.products.indexOf(p)) % Math.max(1, others.length)).concat(others).concat(ctx.products.filter((x) => x.cat !== p.cat)).slice(0, 3);
  h = h.replace(/(<div class="related-cards" id="relatedCards">)\s*(<\/div>)/, (m, a, b) => a + rel.map((x) => '<a class="rcard" href="/bags/' + esc(x.id) + '"><div class="rcard-media"><img src="' + esc(x.colours[0].card) + '" alt="' + esc(x.name) + '" loading="lazy"></div><div class="rcard-meta"><span>' + esc(x.name) + '</span><b>' + money(x.price) + '</b></div></a>').join('') + b);
  h = h.replace('<script src="assets/products.js"></script>', () => '<script>window.__PID=' + JSON.stringify(p.id) + '</script>\n<script src="assets/products.js"></script>');
  h = h.replace('<meta charset="UTF-8">', () => '<meta charset="UTF-8">\n' + DEEP);
  return head(h, {
    title, desc, path: '/bags/' + p.id, ogType: 'product', image: abs(col.card), imageAlt: p.name + ', ' + col.label + ', leather bag by ELARA', preload: abs(photo0),
    jsonld: [product, breadcrumbLd([['Home', '/'], ['Bags', '/shop'], [cat.label, cat.path], [p.name, '/bags/' + p.id]])],
  });
}

function shellPage(tpl) {
  let h = tpl.replace('<meta charset="UTF-8">', () => '<meta charset="UTF-8">\n' + DEEP);
  h = head(h, { title: 'ELARA leather bag', desc: 'ELARA leather bag for women. See every photo, colour and size, with delivery and exchange details.', path: '/shop', noindex: true });
  return h.replace(/<link rel="canonical"[^>]*>\s*/, '');
}

function listingPage(tpl, o, ctx) {
  const list = ctx.products.filter(o.filter);
  const grid = '<style>.ssr-card{display:block;color:inherit;text-decoration:none}.ssr-card img{width:100%;height:auto;aspect-ratio:4/5;object-fit:cover;display:block;border-radius:8px}.ssr-card h2{font-size:14px;font-weight:500;margin:10px 0 2px}.ssr-card p{margin:0;font-size:13px;color:#838280}</style>' + list.map(productCard).join('');
  let h = tpl;
  h = h.replace(/(<div class="product-grid" id="productGrid">)(<\/div>)/, (m, a, b) => a + grid + b);
  h = h.replace(/<h1 id="pageTitle">[^<]*<\/h1>/, () => '<h1 id="pageTitle">' + esc(o.h1) + '</h1>');
  h = h.replace(/(<p class="result-count" id="resultCount">)[^<]*(<\/p>)/, (m, a, b) => a + list.length + ' products' + b);
  h = h.replace(/<nav class="breadcrumb" aria-label="Breadcrumb">[\s\S]*?<\/nav>/, () =>
    '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / ' + (o.crumb ? '<a href="/shop">Bags</a> / <span id="crumbCategory">' + esc(o.crumb) + '</span>' : '<span id="crumbCategory">All Products</span>') + '</nav>');
  h = h.replace('<script src="assets/products.js"></script>', () => '<script>window.__LISTING=' + JSON.stringify(o.listing) + '</script>\n<script src="assets/products.js"></script>');
  const crumbs = [['Home', '/']].concat(o.crumb ? [['Bags', '/shop'], [o.crumb, o.path]] : [['Bags', '/shop']]);
  return head(h, {
    title: o.title, desc: o.desc, path: o.path,
    jsonld: [breadcrumbLd(crumbs), {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: o.h1, url: SITE + o.path, description: o.desc, isPartOf: { '@id': SITE + '/#website' },
      mainEntity: { '@type': 'ItemList', numberOfItems: list.length, itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/bags/' + p.id, name: p.name })) },
    }],
  });
}

function policyPage(tpl, slug, ctx) {
  const pol = POLICIES[slug], v = (ctx.settings['page_' + slug]) || {};
  const published = v.status === 'published' && String(v.body || '').trim();
  const body = published ? noDash(v.body).trim().split(/\n\s*\n/).map((x) => '<p>' + esc(x).replace(/\r?\n/g, '<br>') + '</p>').join('') : '<p class="empty">We are still writing this page. If you need something now, <a href="/contact">our team is happy to help</a>.</p>';
  const desc = published ? clip(noDash(v.body).replace(/\s+/g, ' '), 155) : pol.name + ' at ELARA.';
  let h = tpl;
  h = h.replace(/<h1 id="title">[^<]*<\/h1>/, () => '<h1 id="title">' + esc(pol.name) + '</h1>');
  h = h.replace(/(<div class="body" id="body">)(<\/div>)/, (m, a, b) => a + body + b);
  h = h.replace(/(<span id="crumbHere" aria-current="page">)[^<]*(<\/span>)/, (m, a, b) => a + esc(pol.name) + b);
  h = h.replace('<script src="assets/store-data.js"></script>', () => '<script>window.__PAGE_SLUG=' + JSON.stringify(slug) + '</script>\n<script src="assets/store-data.js"></script>');
  return head(h, {
    title: pol.name + ' | ELARA', desc, path: pol.path, noindex: !published,
    jsonld: [breadcrumbLd([['Home', '/'], [pol.name, pol.path]]), { '@context': 'https://schema.org', '@type': 'WebPage', name: pol.name, url: SITE + pol.path, description: desc, isPartOf: { '@id': SITE + '/#website' } }],
  });
}

// ------------------------------------------------------------------------------------------------ minify
function minifyJs(code, where) {
  try { return esbuild.transformSync(code, { loader: 'js', minify: true, target: 'es2019', legalComments: 'none', sourcemap: false }).code.replace(/\n$/, ''); }
  catch (e) { warn('could not minify ' + where + ' (' + String(e.message).split('\n')[0] + '); left as it was'); return code; }
}
function minifyCss(code, where) {
  try { return esbuild.transformSync(code, { loader: 'css', minify: true, legalComments: 'none', sourcemap: false }).code.replace(/\n$/, ''); }
  catch (e) { warn('could not minify css in ' + where + ' (' + String(e.message).split('\n')[0] + '); left as it was'); return code; }
}
function minifyHtml(html, where) {
  html = html.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, code) => {
    if (/type\s*=\s*["']?(application\/ld\+json|application\/json|text\/template)/i.test(attrs) || !code.trim()) return m;
    if (/type\s*=\s*["']?module/i.test(attrs)) return m;
    return '<script' + attrs + '>' + minifyJs(code, where + ' (inline script)').replace(/<\/script/gi, '<\\/script') + '</script>';
  });
  html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, css) => '<style' + attrs + '>' + minifyCss(css, where) + '</style>');
  return html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
}

// ------------------------------------------------------------------------------------------------ build
(async function main() {
  const t0 = Date.now();
  console.log('ELARA build');
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const data = await loadData();
  console.log('  catalogue: ' + data.products.length + ' bags from ' + data.source);
  applyCategories(data.categories);
  const ctx = { products: data.products, settings: data.settings };

  // 1. copy the public site
  fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'admin'), path.join(DIST, 'admin'), { recursive: true });
  ['favicon.ico', 'site.webmanifest', '404.html'].forEach((f) => fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f)));

  // 2. static pages, each under its clean address
  const sources = {};
  Object.keys(PAGES).forEach((f) => { sources[f] = mapUrls(read(f)); });
  const business = businessLd(data.settings);
  const written = new Set();

  const staticMeta = {
    '/': { title: 'ELARA | Leather bags built for every chapter', desc: 'Premium leather totes, shoulder, crossbody and mini bags designed in Bangladesh. Cash on delivery, free delivery over Tk. 3,000, easy 7-day exchange.', jsonld: business },
    '/contact': { title: 'Contact ELARA | WhatsApp, email and delivery help', desc: 'Message ELARA on WhatsApp or email for help choosing a bag, delivery, payment or an exchange. We reply within 1 business day.', jsonld: [breadcrumbLd([['Home', '/'], ['Contact', '/contact']]), { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact ELARA', url: SITE + '/contact', about: { '@id': SITE + '/#store' } }] },
  };
  const NOINDEX_TITLES = {
    '/home-mobile': ['ELARA | Leather bags built for every chapter', 'Premium leather totes, shoulder, crossbody and mini bags designed in Bangladesh. Cash on delivery, free delivery over Tk. 3,000, easy 7-day exchange.'],
    '/cart': ['Your bag | ELARA', 'Review the bags in your ELARA shopping bag.'],
    '/checkout': ['Checkout | ELARA', 'Enter your delivery details and choose how to pay.'],
    '/payment': ['Payment | ELARA', 'Pay for your ELARA order.'],
    '/card-payment': ['Pay by card | ELARA', 'Pay for your ELARA order by card.'],
    '/order-confirmed': ['Order confirmed | ELARA', 'Your ELARA order is confirmed.'],
    '/track-order': ['Track your order | ELARA', 'Enter your order number and phone to see where your ELARA order is.'],
    '/account': ['Your account | ELARA', 'Sign in to see your ELARA orders and saved bags.'],
  };
  Object.entries(PAGES).forEach(([file, p]) => {
    if (file === 'page.html') return;       // policy template: used below
    let h = sources[file];
    const m = staticMeta[p];
    if (m) h = head(h, { title: m.title, desc: m.desc, path: p, jsonld: m.jsonld });
    else if (NOINDEX_TITLES[p]) {
      const [t, d] = NOINDEX_TITLES[p];
      h = head(h, { title: t, desc: d, path: p === '/home-mobile' ? '/' : p, noindex: p !== '/home-mobile', jsonld: [] });
      if (p === '/home-mobile') h = h.replace(/<meta name="robots"[^>]*>\s*/g, '');
    } else if (p === '/shop') return;
    write(pageFile(p), h); written.add(p);
  });

  // 3. listings: all bags, each category, new arrivals, best sellers
  const plp = sources['my-plp-screen.html'];
  const listings = [
    { path: '/shop', h1: 'All Products', crumb: null, listing: {}, filter: () => true, title: 'Shop all leather bags for women | ELARA',
      desc: clip('Shop all ' + ctx.products.length + ' ELARA leather bags: totes, shoulder, crossbody, mini and travel bags. Cash on delivery across Bangladesh, free delivery over Tk. 3,000.', 158) },
    ...Object.entries(CATS).map(([id, c]) => ({ path: c.path, h1: catHeading(id), crumb: c.label, listing: { category: id }, filter: (p) => p.cat === id, title: c.title + ' | ELARA',
      desc: clip(c.blurb + '. Full-grain leather, cash on delivery across Bangladesh and free delivery over Tk. 3,000.', 158) })),
    { path: '/new-arrivals', h1: 'New Arrivals', crumb: 'New Arrivals', listing: { collection: 'new' }, filter: (p) => p.badge === 'new', title: 'New arrivals: the latest leather bags | ELARA',
      desc: 'See the newest leather bags from ELARA: fresh totes, shoulder and crossbody styles designed in Bangladesh, with cash on delivery.' },
    { path: '/best-sellers', h1: 'Best Sellers', crumb: 'Best Sellers', listing: { collection: 'best' }, filter: (p) => p.badge === 'best', title: 'Best-selling leather bags | ELARA',
      desc: 'The leather bags ELARA customers choose most: everyday totes, shoulder and crossbody bags with cash on delivery across Bangladesh.' },
  ];
  listings.forEach((o) => { write(pageFile(o.path), listingPage(plp, o, ctx)); written.add(o.path); });

  // 4. one page per bag + the fallback shell for bags added after this deploy
  const pdp = mapUrls(read('my-product-detail-screen.html'));
  ctx.products.forEach((p) => write('bags/' + p.id + '/index.html', productPage(pdp, p, ctx)));
  write('pdp-shell.html', shellPage(pdp));

  // 5. policy pages
  const pol = sources['page.html'];
  Object.keys(POLICIES).forEach((slug) => { write(pageFile(POLICIES[slug].path), policyPage(pol, slug, ctx)); written.add(POLICIES[slug].path); });
  write('information/index.html', head(pol, { title: 'Information | ELARA', desc: 'Shipping, returns, privacy and more from ELARA.', path: '/information', noindex: true }));

  // 6. admin: only the store links change
  fs.readdirSync(path.join(DIST, 'admin')).forEach((f) => {
    const fp = path.join(DIST, 'admin', f);
    if (/\.(html|js)$/.test(f)) fs.writeFileSync(fp, mapUrls(fs.readFileSync(fp, 'utf8'), { admin: true }));
  });

  // 7. the other scripts: addresses first, then minify (no source maps)
  let jsBefore = 0, jsAfter = 0;
  fs.readdirSync(path.join(DIST, 'assets')).filter((f) => /\.(js|css)$/.test(f)).forEach((f) => {
    const fp = path.join(DIST, 'assets', f);
    let code = fs.readFileSync(fp, 'utf8'); jsBefore += code.length;
    code = code.replace(/\n?\/\/# sourceMappingURL=.*$/gm, '').replace(/\/\*# sourceMappingURL=.*?\*\//g, '');
    if (f.endsWith('.js')) code = minifyJs(mapUrls(code), 'assets/' + f); else code = minifyCss(code, 'assets/' + f);
    jsAfter += code.length; fs.writeFileSync(fp, code);
  });
  ['assets/fonts/fonts.css', 'assets/fonts/fonts-italic.css'].forEach((f) => { const fp = path.join(DIST, f); if (fs.existsSync(fp)) fs.writeFileSync(fp, minifyCss(fs.readFileSync(fp, 'utf8'), f)); });
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) { if (!fp.includes(path.join('dist', 'assets')) && !fp.includes(path.join('dist', 'admin'))) walk(fp); return; }
      if (e.name.endsWith('.html')) fs.writeFileSync(fp, minifyHtml(fs.readFileSync(fp, 'utf8'), path.relative(DIST, fp)));
    });
  })(DIST);
  const f404 = path.join(DIST, '404.html'); fs.writeFileSync(f404, minifyHtml(mapUrls(fs.readFileSync(f404, 'utf8')), '404.html'));
  console.log('  scripts and styles in assets/: ' + Math.round(jsBefore / 1024) + ' KB -> ' + Math.round(jsAfter / 1024) + ' KB');

  // 8. sitemap and robots
  const urls = [{ loc: '/', priority: '1.0' }, { loc: '/shop', priority: '0.9' }]
    .concat(Object.values(CATS).map((c) => ({ loc: c.path, priority: '0.8' })), [{ loc: '/new-arrivals', priority: '0.7' }, { loc: '/best-sellers', priority: '0.7' }, { loc: '/contact', priority: '0.5' }],
      Object.keys(POLICIES).filter((s) => (data.settings['page_' + s] || {}).status === 'published').map((s) => ({ loc: POLICIES[s].path, priority: '0.3' })),
      ctx.products.map((p) => ({ loc: '/bags/' + p.id, lastmod: (p.updated || '').slice(0, 10), image: abs(p.colours[0].card), imageTitle: p.name, priority: '0.8' })));
  write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    urls.map((u) => '  <url><loc>' + esc(SITE + u.loc) + '</loc>' + (u.lastmod ? '<lastmod>' + u.lastmod + '</lastmod>' : '') + '<priority>' + u.priority + '</priority>' +
      (u.image ? '<image:image><image:loc>' + esc(u.image) + '</image:loc><image:title>' + esc(u.imageTitle) + '</image:title></image:image>' : '') + '</url>').join('\n') + '\n</urlset>\n');
  write('robots.txt', ['User-agent: *', 'Allow: /', 'Disallow: /admin/', 'Disallow: /cart', 'Disallow: /checkout', 'Disallow: /payment', 'Disallow: /card-payment', 'Disallow: /order-confirmed',
    'Disallow: /track-order', 'Disallow: /account', 'Disallow: /information', 'Disallow: /*?preview=', '', 'Sitemap: ' + SITE + '/sitemap.xml', ''].join('\n'));

  console.log('  pages: ' + written.size + ' static + ' + ctx.products.length + ' bags | sitemap: ' + urls.length + ' urls');
  require('./check.js').run({ DIST, SITE, products: ctx.products, warn }).then((problems) => {
    if (problems.length) { console.error('\nBUILD FAILED, ' + problems.length + ' problem(s):'); problems.slice(0, 40).forEach((p) => console.error('  - ' + p)); process.exit(1); }
    console.log('  checks passed' + (warnings.length ? ' (' + warnings.length + ' warning' + (warnings.length > 1 ? 's' : '') + ')' : '') + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  });
})().catch((e) => { console.error(e); process.exit(1); });
