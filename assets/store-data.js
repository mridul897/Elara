/* ELARA live catalogue. Load it right AFTER assets/products.js.
   products.js stays as the built-in fallback; this script replaces window.ELARA_PRODUCTS with what the owner
   has set in the admin panel (Supabase), so prices, discounts, stock and publish/hide are live.
   - Fresh copy (< 60 s old) is read from localStorage, so most page loads cost nothing.
   - Otherwise one short synchronous request (2.5 s cap). If it fails, the last copy or products.js is used.
   Also exposes ElaraDB.rpc(name, args) for checkout / tracking / promo codes. */
(function () {
  var URL_ = 'https://sxwniigfrjzxryhuavev.supabase.co';
  var KEY = 'sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs'; // publishable key: read-only for the public thanks to row-level security
  var CACHE = 'elara.catalog.v2', TTL = 60000;

  function headers() { return { apikey: KEY, Authorization: 'Bearer ' + KEY }; }

  function fetchSync(path) {
    try {
      var x = new XMLHttpRequest();
      x.open('GET', URL_ + '/rest/v1/' + path, false);
      var h = headers(); for (var k in h) x.setRequestHeader(k, h[k]);
      x.send();
      if (x.status === 200) return JSON.parse(x.responseText);
    } catch (e) {}
    return null;
  }

  function build(rows) {
    var now = Date.now();
    return rows.map(function (p) {
      var cols = (p.product_colours || []).slice().sort(function (a, b) { return a.position - b.position; });
      var stock = {};
      cols.forEach(function (c) { (c.product_variants || []).forEach(function (v) { (stock[c.id] = stock[c.id] || {})[v.size] = v.stock; }); });
      var on = p.sale_price != null && (!p.sale_starts || new Date(p.sale_starts) <= now) && (!p.sale_ends || new Date(p.sale_ends) >= now);
      var out = {
        id: p.id, name: p.name, cat: p.cat, eyebrow: p.eyebrow, crumb: p.crumb,
        price: on ? p.sale_price : p.price, was: on ? p.price : null,
        badge: on ? 'off' : (p.badge === 'off' ? null : p.badge),
        rating: Number(p.rating) || 0, reviews: p.reviews_count || 0,
        desc: p.description || '', dims: p.dims || [], fits: p.fits || '', care: p.care || '', ship: p.ship || '', legacy: p.legacy || [],
        colours: cols.map(function (c) { return { id: c.id, label: c.label, hex: c.hex, card: c.card, tile: c.tile || c.card, guideBg: c.guide_bg, photos: c.photos || [], slides: (c.slides && c.slides.length) ? c.slides : [c.card] }; }),
        stock: stock
      };
      var ex = p.extra || {}; for (var k in ex) out[k] = ex[k];
      return out;
    }).filter(function (p) { return p.colours.length; });
  }

  var list = null, cached = null, settings = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE)); } catch (e) {}
  if (cached && Date.now() - cached.t < TTL && cached.v && cached.v.length) { list = cached.v; settings = cached.s || null; }
  if (!list) {
    var rows = fetchSync('products?select=*,product_colours(*,product_variants(size,stock))&status=eq.published&order=position.asc&limit=1000');
    if (rows && rows.length) {
      list = build(rows);
      var st = fetchSync('settings?select=key,value');
      if (st) { settings = {}; st.forEach(function (r) { settings[r.key] = r.value; }); }
      try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), v: list, s: settings })); } catch (e) {}
    } else if (cached && cached.v && cached.v.length) { list = cached.v; settings = cached.s || null; }
  }
  if (list && list.length) window.ELARA_PRODUCTS = list;
  window.ELARA_LIVE = !!(list && list.length);
  // Delivery rules the owner sets in Settings (falls back to today's numbers).
  var dv = (settings && settings.delivery) || {};
  window.ELARA_DELIVERY = { dhaka: +dv.dhaka || 60, outside: +dv.outside || 120, freeOver: +dv.free_over || 3000, dhakaDays: dv.dhaka_days || '1–3', outsideDays: dv.outside_days || '3–5' };

  window.ELARA_SETTINGS = settings || {};

  // Home hero copy and button, as edited in Admin > Content. Only fields the owner actually changed are touched,
  // so the designed line breaks stay when nothing was edited.
  (function () {
    var h = (settings && settings.hero) || null; if (!h) return;
    var DEF = { eyebrow: 'The Everyday Collection', headline: 'Bags built for every chapter.', text: 'Premium leather, considered detail, made for the routine you actually have: work, weekend, and everything between.', button_label: 'Shop New Collection' };
    function apply() {
      var q = function (s) { return document.querySelector(s); };
      var box = q('.hero-copy') || q('.hero');
      if (!box) return;
      var ey = box.querySelector('.hero-eyebrow, .t-eyebrow'), hd = box.querySelector('h1'), tx = box.querySelector('.hero-body, .t-large'), bt = box.querySelector('a.btn-pill, a.btn');
      if (ey && h.eyebrow && h.eyebrow !== DEF.eyebrow) ey.textContent = h.eyebrow;
      if (hd && h.headline && h.headline !== DEF.headline) hd.textContent = h.headline;
      if (tx && h.text && h.text !== DEF.text) tx.textContent = h.text;
      if (bt) {
        if (h.button_label && h.button_label !== DEF.button_label) { var img = bt.querySelector('img'); bt.textContent = h.button_label + ' '; if (img) bt.appendChild(img); }
        if (h.button_link) bt.setAttribute('href', h.button_link);
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  })();

  // Bag lines saved earlier hold the price of that day. Bring them in line with today's catalogue and drop anything
  // that is no longer sold, so the bag never shows a stale price.
  if (window.ELARA_LIVE) {
    ['elara.cart.v1', 'elara.buynow.v1'].forEach(function (key) {
      try {
        var raw = localStorage.getItem(key); if (!raw) return;
        var lines = JSON.parse(raw); if (!Array.isArray(lines)) return;
        var changed = false;
        var fixed = lines.filter(function (l) {
          var pid = String(l.id).split('|')[0];
          var p = window.ELARA_PRODUCTS.filter(function (x) { return x.id === pid; })[0];
          if (!p) { changed = true; return false; }
          if (l.price !== p.price) { l.price = p.price; changed = true; }
          return true;
        });
        if (changed) localStorage.setItem(key, JSON.stringify(fixed));
      } catch (e) {}
    });
  }

  window.ElaraDB = {
    url: URL_,
    // POST to a database function. Returns a Promise of the JSON result (never rejects: { ok:false, error } instead).
    rpc: function (name, args) {
      return fetch(URL_ + '/rest/v1/rpc/' + name, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers()), body: JSON.stringify(args || {}) })
        .then(function (r) { return r.json().then(function (j) { return r.ok ? j : { ok: false, error: (j && j.message) || 'Request failed' }; }); })
        .catch(function () { return { ok: false, error: 'network' }; });
    }
  };
})();
