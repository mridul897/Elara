/* ELARA live catalogue. Load it right AFTER assets/products.js.
   products.js stays as the built-in fallback; this script replaces window.ELARA_PRODUCTS with what the owner
   has set in the admin panel (Supabase), so prices, discounts, stock and publish/hide are live.
   - Fresh copy (< 60 s old) is read from localStorage, so most page loads cost nothing.
   - Otherwise one short synchronous request (2.5 s cap). If it fails, the last copy or products.js is used.
   Also exposes ElaraDB.rpc(name, args) for checkout / tracking / promo codes. */
(function () {
  var URL_ = 'https://sxwniigfrjzxryhuavev.supabase.co';
  var KEY = 'sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs'; // publishable key: read-only for the public thanks to row-level security
  var CACHE = 'elara.catalog.v2', TTL = 30000;

  // Preview mode: opened from Admin ("Preview on store"). It always asks the shop for fresh data, never uses or writes the
  // shared copy, and, when the owner is signed in to the admin in this browser, also shows products still saved as drafts.
  var PREVIEW = false;
  try {
    if (/[?&]preview=1\b/.test(location.search)) sessionStorage.setItem('elara.preview', '1');
    PREVIEW = sessionStorage.getItem('elara.preview') === '1';
  } catch (e) {}
  function adminToken() {
    try {
      var s = JSON.parse(localStorage.getItem('sb-sxwniigfrjzxryhuavev-auth-token'));
      return s && s.access_token && s.expires_at * 1000 > Date.now() ? s.access_token : null;
    } catch (e) { return null; }
  }
  var TOKEN = PREVIEW ? adminToken() : null;

  function headers() { return { apikey: KEY, Authorization: 'Bearer ' + (TOKEN || KEY) }; }

  // Text typed into the shop database may contain long dashes; the store shows commas and "to" instead.
  function clean(t) { return t.replace(/\s*\u2014\s*/g, ', ').replace(/(\d)\s*\u2013\s*(\d)/g, '$1 to $2').replace(/\s\u2013\s/g, ' to ').replace(/\u2013/g, '-'); }
  function deepClean(v) {
    if (typeof v === 'string') return clean(v);
    if (Array.isArray(v)) return v.map(deepClean);
    if (v && typeof v === 'object') { var o = {}; for (var k in v) o[k] = deepClean(v[k]); return o; }
    return v;
  }

  function fetchSync(path) {
    try {
      var x = new XMLHttpRequest();
      x.open('GET', URL_ + '/rest/v1/' + path, false);
      var h = headers(); for (var k in h) x.setRequestHeader(k, h[k]);
      x.send();
      if (x.status === 200) return deepClean(JSON.parse(x.responseText));
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
        colours: cols.filter(function (c) { return c.card || (c.photos && c.photos.length); }).map(function (c) {
          var ph = c.photos || [], card = c.card || (ph[0] && ph[0].src);
          return { id: c.id, label: c.label, hex: c.hex, card: card, tile: c.tile || card, guideBg: c.guide_bg, photos: ph.length ? ph : [{ src: card, alt: 'front view', contain: false }], slides: (c.slides && c.slides.length) ? c.slides : [card] };
        }),
        stock: stock
      };
      var ex = p.extra || {}; for (var k in ex) out[k] = ex[k];
      return out;
    }).filter(function (p) { return p.colours.length; });
  }

  var list = null, cached = null, settings = null, cats = null;
  try { if (!PREVIEW) cached = JSON.parse(localStorage.getItem(CACHE)); } catch (e) {}
  if (cached && Date.now() - cached.t < TTL && cached.v && cached.v.length) { list = cached.v; settings = cached.s || null; cats = cached.c || null; }
  if (!list) {
    var statusFilter = TOKEN ? 'status=in.(published,draft)' : 'status=eq.published';
    var rows = fetchSync('products?select=*,product_colours(*,product_variants(size,stock))&' + statusFilter + '&order=position.asc&limit=1000');
    if (rows && rows.length) {
      list = build(rows);
      var st = fetchSync('settings?select=key,value');
      if (st) { settings = {}; st.forEach(function (r) { settings[r.key] = r.value; }); }
      var cr = fetchSync('categories?select=id,name,eyebrow,position&order=position.asc');
      if (cr && cr.length) cats = cr;
      try { if (!PREVIEW) localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), v: list, s: settings, c: cats })); } catch (e) {}
    } else if (cached && cached.v && cached.v.length) { list = cached.v; settings = cached.s || null; cats = cached.c || null; }
  }
  if (list && list.length) window.ELARA_PRODUCTS = list;
  window.ELARA_LIVE = !!(list && list.length);
  // Delivery rules the owner sets in Settings (falls back to today's numbers).
  var dv = (settings && settings.delivery) || {};
  window.ELARA_DELIVERY = { dhaka: +dv.dhaka || 60, outside: +dv.outside || 120, freeOver: +dv.free_over || 3000, dhakaDays: dv.dhaka_days || '1 to 3', outsideDays: dv.outside_days || '3 to 5' };

  // Categories managed in Admin > Categories (only the ones switched on for the store). Pages fall back to their built-in five.
  window.ELARA_CATEGORIES = cats && cats.length ? cats : null;
  window.ELARA_SETTINGS = settings || {};
  window.ELARA_PREVIEW = PREVIEW;
  if (PREVIEW) {
    var pv = function () {
      if (document.querySelector('.elara-preview')) return;
      var d = document.createElement('div'); d.className = 'elara-preview';
      d.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483000;background:#1f2328;color:#fff;font:500 12px/1 Inter,sans-serif;padding:9px 12px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;gap:10px;align-items:center';
      d.innerHTML = '<span>Preview' + (TOKEN ? ' · drafts visible' : '') + '</span>';
      var x = document.createElement('button'); x.type = 'button'; x.textContent = 'Exit';
      x.style.cssText = 'border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:999px;padding:4px 10px;font:inherit;cursor:pointer';
      x.addEventListener('click', function () { try { sessionStorage.removeItem('elara.preview'); } catch (e) {} location.href = location.pathname; });
      d.appendChild(x); document.body.appendChild(d);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pv); else pv();
  }

  // Contact details from Admin > Content: phone / WhatsApp, e-mail and support hours replace the numbers and addresses
  // printed on the pages (text and links), so the owner never needs a developer for a new number.
  (function () {
    var c = (settings && settings.contact) || null; if (!c) return;
    var OLD_PH = ['+880 1320575476', '+880 1320 575476', '+880 1XXX-XXXXXX', '+8801320575476'];
    var OLD_EM = ['hello@elara.com.bd', 'hello@elara.bd'];
    var DEF_HOURS = 'Sat to Thu, 10 am to 7 pm';
    var digits = String(c.whatsapp || '').replace(/\D/g, '');
    if (digits && digits.indexOf('880') !== 0) digits = '880' + digits.replace(/^0/, '');
    var phoneText = String(c.whatsapp || '').trim(), email = String(c.email || '').trim(), hours = String(c.hours || '').trim();
    function swap(text) {
      var t = text, i;
      if (phoneText) for (i = 0; i < OLD_PH.length; i++) if (t.indexOf(OLD_PH[i]) >= 0 && OLD_PH[i] !== phoneText) t = t.split(OLD_PH[i]).join(phoneText);
      if (email) for (i = 0; i < OLD_EM.length; i++) if (t.indexOf(OLD_EM[i]) >= 0 && OLD_EM[i] !== email) t = t.split(OLD_EM[i]).join(email);
      return t;
    }
    function apply() {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, nodes = [];
      while ((n = w.nextNode())) { var p = n.parentNode && n.parentNode.nodeName; if (p !== 'SCRIPT' && p !== 'STYLE' && p !== 'TEXTAREA' && p !== 'INPUT') nodes.push(n); }
      nodes.forEach(function (t) { var s = swap(t.nodeValue); if (s !== t.nodeValue) t.nodeValue = s; });
      document.querySelectorAll('a[href]').forEach(function (a) {
        var h = a.getAttribute('href') || '';
        if (digits && /^https:\/\/wa\.me\//.test(h)) { var q = h.indexOf('?'); a.setAttribute('href', 'https://wa.me/' + digits + (q >= 0 ? h.slice(q) : '')); }
        else if (digits && /^tel:/.test(h)) a.setAttribute('href', 'tel:+' + digits);
        else if (email && /^mailto:/.test(h)) a.setAttribute('href', 'mailto:' + email);
      });
      if (hours && hours !== DEF_HOURS) document.querySelectorAll('.c-hours').forEach(function (el) { el.innerHTML = '<b>Support hours</b><br>'; el.appendChild(document.createTextNode(hours)); });
    }
    function run() { apply(); setTimeout(apply, 800); }
    if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
  })();

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

  // Announcement bar from Admin > Content. A slim strip above the page; the shopper can close it for the session.
  (function () {
    var a = (settings && settings.announcement) || null;
    if (!a || !a.active || !String(a.text || '').trim()) return;
    try { if (sessionStorage.getItem('elara.ann.closed') === '1') return; } catch (e) {}
    function add() {
      if (document.querySelector('.elara-ann')) return;
      var st = document.createElement('style');
      st.textContent = '.elara-ann{position:relative;z-index:50;display:flex;align-items:center;justify-content:center;min-height:36px;padding:8px 44px;background:var(--text,#4a4741);color:var(--bg-page,#f7f3ec);font:400 13px/1.4 Inter,-apple-system,"Segoe UI",sans-serif;text-align:center}' +
        '.elara-ann button{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:0;background:none;color:inherit;font-size:18px;line-height:1;cursor:pointer;opacity:.8}' +
        '.elara-ann button:hover{opacity:1}';
      document.head.appendChild(st);
      var bar = document.createElement('div'); bar.className = 'elara-ann'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Announcement');
      var t = document.createElement('span'); t.textContent = String(a.text).trim();
      var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Close announcement'); x.textContent = '\u00d7';
      x.addEventListener('click', function () { bar.remove(); try { sessionStorage.setItem('elara.ann.closed', '1'); } catch (e) {} });
      bar.appendChild(t); bar.appendChild(x);
      document.body.insertBefore(bar, document.body.firstChild);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
  })();

  // Studio address (Admin > Content > Contact details) replaces the placeholder on the contact page.
  (function () {
    var c = (settings && settings.contact) || null, addr = c && String(c.address || '').trim();
    if (!addr) return;
    function put() { document.querySelectorAll('p').forEach(function (p) { if (p.textContent.trim() === 'House 00, Road 00, Dhaka, Bangladesh') p.textContent = addr; }); }
    if (document.readyState === 'complete') put(); else window.addEventListener('load', put);
  })();

  // Analytics: paste the IDs in Admin > Settings > Analytics. Nothing loads until an ID is saved.
  (function () {
    var a = (settings && settings.analytics) || null; if (!a) return;
    var ga = String(a.ga_id || '').trim(), fb = String(a.fb_pixel || '').trim();
    if (/^G-[A-Z0-9]{4,}$/i.test(ga)) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga); document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', ga);
    }
    if (/^\d{8,20}$/.test(fb)) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', fb); window.fbq('track', 'PageView');
    }
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

  var __errs = 0;
  function reportError(msg) {
    if (__errs >= 3 || !window.ElaraDB) return;   // at most three per page view
    __errs++; window.ElaraDB.logError(msg);
  }
  window.addEventListener('error', function (e) { reportError((e.message || 'error') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); });
  window.addEventListener('unhandledrejection', function (e) { reportError('promise: ' + ((e.reason && e.reason.message) || e.reason || 'rejected')); });

  window.ElaraDB = {
    url: URL_,
    // POST to a database function. Returns a Promise of the JSON result (never rejects: { ok:false, error } instead).
    // Send a customer review. It waits for the owner's approval before anyone sees it.
    // Every public action goes through a server function that checks the input and limits how often it can be used.
    submitReview: function (r) {
      return window.ElaraDB.rpc('submit_review', { p: { product_id: r.product_id, author: r.author, rating: r.rating, title: r.title || null, body: r.body, website: '' } }).then(function (x) { return !!(x && x.ok); });
    },
    sendMessage: function (m) { return window.ElaraDB.rpc('send_message', { p: Object.assign({ website: '' }, m) }); },
    subscribe: function (email, source) { return window.ElaraDB.rpc('subscribe', { p_email: email, p_source: source || 'site' }); },
    logError: function (msg) { return window.ElaraDB.rpc('log_error', { p_message: String(msg), p_url: location.href, p_ua: navigator.userAgent }); },
    // Approved reviews for one product (newest first).
    reviews: function (productId) {
      return fetch(URL_ + '/rest/v1/reviews?select=id,author,rating,title,body,created_at&status=eq.approved&product_id=eq.' + encodeURIComponent(productId) + '&order=created_at.desc&limit=100', { headers: headers() })
        .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    },
    rpc: function (name, args) {
      return fetch(URL_ + '/rest/v1/rpc/' + name, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers()), body: JSON.stringify(args || {}) })
        .then(function (r) { return r.json().then(function (j) { return r.ok ? j : { ok: false, error: (j && j.message) || 'Request failed' }; }); })
        .catch(function () { return { ok: false, error: 'network' }; });
    }
  };
})();
