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
    // Send a customer review. It waits for the owner's approval before anyone sees it.
    submitReview: function (r) {
      return fetch(URL_ + '/rest/v1/reviews', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, headers()),
        body: JSON.stringify({ product_id: r.product_id, author: r.author, rating: r.rating, title: r.title || null, body: r.body, status: 'pending' }) })
        .then(function (res) { return res.ok; }).catch(function () { return false; });
    },
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
