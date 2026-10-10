/* Search overlay — build of the Figma frames "Search Overlay / Discover" (256:1224) and "/ Results" (256:1375).
   Any element with aria-label="Search" (nav icon, mobile header icon) opens it. Needs assets/catalog.js.
   Matches on product name, category, badge (new / best seller / sale) and Nafisa Tote colours. */
(function () {
  'use strict';
  var POPULAR = ['tote', 'shoulder', 'crossbody', 'mini', 'travel', 'work bag', 'leather', 'black', 'camel', 'new arrivals'];
  var CAT_LABEL = { tote: 'Tote', shoulder: 'Shoulder', crossbody: 'Crossbody', mini: 'Mini', 'travel-work': 'Travel & Work' };
  var BADGE = { best: 'Best Seller', 'new': 'New', off: '20% OFF' };
  var PAGE_SIZE = 8;
  var PDP = 'my-product-detail-screen.html';

  var css = '' +
  '.sx{position:fixed;inset:0;z-index:200;overflow-y:auto;background:#fffdf9;color:#4a4741;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .25s cubic-bezier(.4,0,.2,1),transform .3s cubic-bezier(.22,.8,.3,1),visibility 0s linear .3s}' +
  '.sx.open{opacity:1;visibility:visible;transform:none;transition:opacity .25s cubic-bezier(.4,0,.2,1),transform .3s cubic-bezier(.22,.8,.3,1)}' +
  '.sx *{box-sizing:border-box}.sx [hidden]{display:none!important}' +
  ':where(.sx) a{color:inherit;text-decoration:none}:where(.sx) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}' +
  '.sx a:focus-visible,.sx button:focus-visible{outline:2px solid #3184ff;outline-offset:3px;border-radius:4px}.sx-form input:focus-visible{outline:none}' +
  '.sx-top{position:relative;display:flex;justify-content:center;align-items:center;height:100px}' +
  '.sx-logo{display:block;width:150px;height:68px}.sx-logo img{width:100%;height:100%;object-fit:contain}' +
  '.sx-close{position:absolute;right:64px;top:28px;width:44px;height:44px;display:grid;place-items:center;border-radius:50%;transition:background-color .15s}' +
  '.sx-close:hover{background:#f7f1e8}.sx-close svg{width:22px;height:22px}' +
  '.sx-body{display:flex;flex-direction:column;align-items:center;gap:40px;padding:8px 20px 64px}' +
  '.sx-form{position:relative;display:flex;align-items:center;gap:12px;width:min(640px,100%);height:52px;padding:0 20px 0 24px;border:1px solid #4a4741;border-radius:999px;background:#fffdf9;transition:box-shadow .15s}' +
  '.sx-form:focus-within{box-shadow:0 0 0 3px rgba(49,132,255,.2)}' +
  '.sx-form input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:#4a4741}' +
  '.sx-form input::placeholder{color:#838280}.sx-form input::-webkit-search-cancel-button{display:none}' +
  '.sx-clear,.sx-go{display:grid;place-items:center;width:24px;height:24px;flex-shrink:0}.sx-clear svg{width:20px;height:20px}.sx-go img{width:20px;height:20px}' +
  '.sx-label{font-size:12px;font-weight:500;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;text-align:center}' +
  '.sx-pop{display:flex;flex-direction:column;align-items:center;gap:16px}' +
  '.sx-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}' +
  '.sx-chip{padding:8px 16px;border:1px solid rgba(74,71,65,.25);border-radius:999px;font-size:14px;line-height:1.5;transition:background-color .15s,color .15s,border-color .15s}' +
  '.sx-chip:hover{background:#4a4741;color:#fffdf9;border-color:#4a4741}' +
  '.sx-sec{display:flex;flex-direction:column;align-items:center;gap:20px;width:100%}' +
  '.sx-wrap{position:relative;width:100%;max-width:1048px}' +
  '.sx-track{display:flex;gap:24px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain}' +
  '.sx-track::-webkit-scrollbar{display:none}' +
  '.sx-track .sx-card{flex:0 0 calc((100% - 72px)/4);scroll-snap-align:start}' +
  '.sx-arrow{position:absolute;top:150px;z-index:1;width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(74,71,65,.25);border-radius:50%;background:rgba(255,253,249,.94);transition:background-color .15s,border-color .15s,opacity .15s,transform .15s}' +
  '.sx-arrow:hover{background:#fffdf9;border-color:#4a4741}.sx-arrow:active{transform:scale(.94)}' +
  '.sx-arrow svg{width:18px;height:18px}.sx-arrow.next{right:-60px}.sx-arrow.prev{left:-60px}' +
  '.sx-wrap[data-start="1"] .sx-arrow.prev,.sx-wrap[data-end="1"] .sx-arrow.next{opacity:0;visibility:hidden;pointer-events:none}' +
  '.sx-card{display:block;min-width:0}' +
  '.sx-media{position:relative;aspect-ratio:244/305;border-radius:12px;overflow:hidden;background:#f2ecde}' +
  '.sx-media img{width:100%;height:100%;object-fit:cover;transition:transform .4s cubic-bezier(.4,0,.2,1)}.sx-card:hover .sx-media img{transform:scale(1.04)}' +
  '.sx-badge{position:absolute;left:12px;top:12px;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:500;line-height:normal}' +
  '.sx-badge.best{background:rgba(255,255,255,.92)}.sx-badge.new{background:#4a4741;color:#fffdf9}.sx-badge.off{background:rgba(255,255,255,.9);color:#2a72de;border:1px solid #2a72de}' +
  '.sx-name{font-family:Fraunces,serif;font-variation-settings:"SOFT" 0,"WONK" 1;font-weight:300;font-size:1.4rem;line-height:1.15;margin:10px 0 4px;color:#000}' +
  '.sx-price{display:flex;align-items:baseline;gap:8px;font-size:.95rem}.sx-price b{font-weight:500}.sx-price s{color:#a8a5a0;font-size:.85rem}' +
  '.sx-dots{display:flex;gap:6px;margin-top:10px}.sx-dots i{width:14px;height:14px;margin:3px;border-radius:50%;background:var(--c)}' +
  '.sx-trk{position:absolute;inset:0;display:flex;transition:transform .5s cubic-bezier(.22,.8,.3,1)}' +
  '.sx-media .sx-trk img{flex:0 0 100%;width:100%;height:100%;object-fit:cover}.sx-card:hover .sx-media .sx-trk img{transform:none}' +
  '.sx-ar{position:absolute;top:50%;z-index:2;width:32px;height:32px;margin-top:-16px;display:grid;place-items:center;border:1px solid rgba(74,71,65,.25);border-radius:50%;background:rgba(255,253,249,.92);opacity:0;transition:opacity .2s,background-color .15s}' +
  '.sx-ar:hover{background:#fffdf9}.sx-ar svg{width:16px;height:16px}.sx-ar.prev{left:8px}.sx-ar.next{right:8px}' +
  '.sx-media:hover .sx-ar,.sx-media:focus-within .sx-ar{opacity:1}' +
  '.sx-media[data-at="start"] .sx-ar.prev,.sx-media[data-at="end"] .sx-ar.next,.sx-media[data-one="1"] .sx-ar{opacity:0!important;visibility:hidden;pointer-events:none}' +
  '.sx-dots button{width:14px;height:14px;margin:3px;border-radius:50%;background:var(--c);box-shadow:inset 0 0 0 1px rgba(74,71,65,.2);transition:transform .15s}' +
  '.sx-dots button:hover{transform:scale(1.15)}.sx-dots button[aria-checked="true"]{box-shadow:0 0 0 2px #fffdf9,0 0 0 3.5px #4a4741}' +
  '@media (hover:none){.sx-media:not([data-at="start"]):not([data-at="end"]) .sx-ar,.sx-media[data-at="start"] .sx-ar.next,.sx-media[data-at="end"] .sx-ar.prev{opacity:1}}' +
  '.sx-edit{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:1048px}' +
  '.sx-edit img{width:100%;aspect-ratio:1048/420;object-fit:cover;border-radius:12px}' +
  '.sx-edit h2{font-family:Fraunces,serif;font-variation-settings:"SOFT" 0,"WONK" 1;font-weight:400;font-size:24px;line-height:1.1;letter-spacing:-.72px;text-align:center}' +
  '.sx-edit p{font-size:14px;line-height:1.5;color:#838280;text-align:center}' +
  '.sx-edit .lnk{font-size:14px;font-weight:500;color:#2a72de}.sx-edit .lnk:hover{text-decoration:underline}' +
  '.sx-edit .blk{display:flex;flex-direction:column;align-items:center;gap:6px}.sx-edit .blk+.blk{margin-top:32px}' +
  '.sx-sum{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}.sx-sum b{font-size:16px;font-weight:500}' +
  '.sx-rel{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px}.sx-rel>span{font-size:14px;color:#838280}' +
  '.sx-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:32px 24px;width:100%;max-width:1048px}' +
  '.sx-more{display:flex;align-items:center;justify-content:center;width:280px;max-width:100%;height:50px;border:1px solid #4a4741!important;border-radius:999px;font-size:15px;font-weight:500;transition:background-color .15s}.sx-more:hover{background:#f7f1e8}' +
  '.sx-empty{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}.sx-empty h2{font-family:Fraunces,serif;font-weight:400;font-size:24px}.sx-empty p{font-size:14px;color:#838280}' +
  '@media (max-width:1260px){.sx-arrow.next{right:8px}.sx-arrow.prev{left:8px}}' +
  '@media (max-width:900px){.sx-close{right:12px}.sx-track .sx-card{flex-basis:calc((100% - 24px)/2.3)}.sx-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 12px}.sx-name{font-size:1.1rem}.sx-arrow{top:100px}}' +
  '@media (prefers-reduced-motion:reduce){.sx,.sx.open{transition:none}.sx-media img,.sx-trk,.sx-ar{transition:none}}';

  var CLOSE = '<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M4 4l14 14M18 4 4 18" stroke="#4a4741" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M7 3l6 6-6 6" stroke="#4a4741" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHEV_L = '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M11 3 5 9l6 6" stroke="#4a4741" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var root, input, clearBtn, opener, built = false, open = false, showAll = false, timer;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(v) { return 'Tk. ' + Number(v).toLocaleString('en-US') + '/-'; }
  function catalog() { return window.ELARA_CATALOG || []; }

  function prod(id) {
    var a = window.ELARA_PRODUCTS || [];
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function slidesHTML(c, name) {
    return c.slides.map(function (u, k) { return '<img ' + (k === 0 ? 'src="' + u + '"' : 'data-src="' + u + '"') + ' alt="' + esc(name) + '" draggable="false">'; }).join('');
  }
  function card(p) {
    var badge = p.badge ? '<span class="sx-badge ' + p.badge + '">' + BADGE[p.badge] + '</span>' : '';
    var price = p.was ? '<s>' + money(p.was) + '</s><b>' + money(p.price) + '</b>' : '<b>' + money(p.price) + '</b>';
    var d = p.id ? prod(p.id) : null;
    if (d && d.colours && d.colours.length) {
      var c = d.colours[0], one = c.slides.length < 2;
      var dots = d.colours.map(function (cc, k) {
        return '<button type="button" class="sx-dot" role="radio" aria-checked="' + (k === 0) + '" aria-label="' + esc(cc.label) + '" data-c="' + k + '" style="--c:' + cc.hex + '"></button>';
      }).join('');
      return '<a class="sx-card" data-id="' + esc(p.id) + '" data-i="0" data-c="0" href="' + PDP + '?p=' + p.id + '&colour=' + c.id + '">' +
        '<div class="sx-media" data-at="start"' + (one ? ' data-one="1"' : '') + '><div class="sx-trk">' + slidesHTML(c, p.name) + '</div>' + badge +
        '<button type="button" class="sx-ar prev" aria-label="Previous photo">' + CHEV_L + '</button><button type="button" class="sx-ar next" aria-label="Next photo">' + CHEV_R + '</button></div>' +
        '<h3 class="sx-name">' + esc(p.name) + '</h3><p class="sx-price">' + price + '</p>' +
        '<div class="sx-dots" role="radiogroup" aria-label="Colour">' + dots + '</div></a>';
    }
    var dots2 = (p.dots || []).map(function (h) { return '<i style="--c:' + h + '"></i>'; }).join('');
    return '<a class="sx-card" href="' + PDP + (p.id ? '?p=' + p.id : '') + '"><div class="sx-media"><img src="' + p.img + '" alt="" loading="lazy" draggable="false">' + badge + '</div>' +
      '<h3 class="sx-name">' + esc(p.name) + '</h3><p class="sx-price">' + price + '</p>' + (dots2 ? '<div class="sx-dots" aria-hidden="true">' + dots2 + '</div>' : '') + '</a>';
  }

  // ---- per-card photo carousel + colour dots (same behaviour as the product listing) ----
  function loadSlides(cardEl) {
    cardEl.querySelectorAll('.sx-trk img[data-src]').forEach(function (im) { im.src = im.dataset.src; im.removeAttribute('data-src'); });
  }
  function slideCard(cardEl, delta) {
    var trk = cardEl.querySelector('.sx-trk'), n = trk.children.length;
    var i = Math.max(0, Math.min(n - 1, (+cardEl.dataset.i || 0) + delta));
    loadSlides(cardEl);
    cardEl.dataset.i = i;
    trk.style.transform = 'translateX(' + (-i * 100) + '%)';
    cardEl.querySelector('.sx-media').dataset.at = i === 0 ? 'start' : i === n - 1 ? 'end' : '';
  }
  function pickColour(cardEl, k) {
    var d = prod(cardEl.dataset.id); if (!d || !d.colours[k]) return;
    var c = d.colours[k], media = cardEl.querySelector('.sx-media'), trk = cardEl.querySelector('.sx-trk');
    trk.style.transition = 'none'; trk.style.transform = ''; trk.innerHTML = slidesHTML(c, d.name);
    void trk.offsetWidth; trk.style.transition = '';
    cardEl.dataset.i = 0; cardEl.dataset.c = k; media.dataset.at = 'start';
    if (c.slides.length < 2) media.setAttribute('data-one', '1'); else media.removeAttribute('data-one');
    cardEl.href = PDP + '?p=' + d.id + '&colour=' + c.id;
    cardEl.querySelectorAll('.sx-dot').forEach(function (bt) { bt.setAttribute('aria-checked', String(+bt.dataset.c === k)); });
  }

  function carousel(title, list) {
    return '<section class="sx-sec"><h2 class="sx-label">' + title + '</h2>' +
      '<div class="sx-wrap" data-start="1" data-end="0"><button type="button" class="sx-arrow prev" aria-label="Previous products">' + CHEV_L + '</button>' +
      '<div class="sx-track">' + list.map(card).join('') + '</div>' +
      '<button type="button" class="sx-arrow next" aria-label="More products">' + CHEV_R + '</button></div></section>';
  }

  function wireCarousels(scope) {
    scope.querySelectorAll('.sx-wrap').forEach(function (wrap) {
      var track = wrap.querySelector('.sx-track');
      function update() {
        var max = track.scrollWidth - track.clientWidth;
        wrap.dataset.start = track.scrollLeft <= 2 || max <= 2 ? '1' : '0';
        wrap.dataset.end = track.scrollLeft >= max - 2 || max <= 2 ? '1' : '0';
      }
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      wrap.querySelector('.next').addEventListener('click', function () { track.scrollBy({ left: track.clientWidth + 24, behavior: reduce ? 'auto' : 'smooth' }); });
      wrap.querySelector('.prev').addEventListener('click', function () { track.scrollBy({ left: -(track.clientWidth + 24), behavior: reduce ? 'auto' : 'smooth' }); });
      track.addEventListener('scroll', update, { passive: true });
      update(); setTimeout(update, 120);
    });
  }

  // ---- matching ----
  function haystack(p) {
    var h = [p.name, CAT_LABEL[p.cat] || p.cat, (CAT_LABEL[p.cat] || '') + ' bags'];
    if (p.cat === 'travel-work') h.push('travel work');
    if (p.badge === 'new') h.push('new arrivals new');
    if (p.badge === 'best') h.push('best seller bestseller');
    if (p.badge === 'off') h.push('sale offer off');
    if (p.colours) h.push(p.colours.join(' '));
    return h.join(' ').toLowerCase();
  }
  function search(q) {
    var tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      .map(function (t) { return t.length > 3 && t.slice(-1) === 's' ? t.slice(0, -1) : t; })
      .filter(function (t) { return t !== 'bag'; });          // every product is a bag
    if (!tokens.length) return catalog().slice();
    var out = catalog().filter(function (p) { var h = haystack(p); return tokens.every(function (t) { return h.indexOf(t) !== -1; }); });
    var first = q.toLowerCase().trim();
    out.sort(function (a, b) { return (b.name.toLowerCase().indexOf(first) === 0) - (a.name.toLowerCase().indexOf(first) === 0); });
    return out;
  }

  // ---- views ----
  function chipsHTML(list) { return list.map(function (t) { return '<button type="button" class="sx-chip" data-term="' + esc(t) + '">' + esc(t) + '</button>'; }).join(''); }

  function discoverHTML() {
    var cat = catalog();
    var fresh = cat.filter(function (p) { return p.badge === 'new'; });
    var love = cat.filter(function (p) { return p.badge === 'best'; });
    return '<div class="sx-pop"><h2 class="sx-label">Popular searches</h2><div class="sx-chips">' + chipsHTML(POPULAR) + '</div></div>' +
      carousel('Discover new arrivals', fresh) + carousel('We think you will love', love) +
      '<div class="sx-edit"><img src="assets/home/hero-bg.webp" alt="" loading="lazy">' +
      '<div class="blk"><h2>An icon, made for every day</h2><p>The Nafisa Tote in three new colours.</p><a class="lnk" href="my-plp-screen.html">Shop new arrivals →</a></div>' +
      '<div class="blk"><h2>Share your style</h2><p>Show us how you carry your ELARA. Tag @elara.bd for a chance to be featured here.</p><a class="lnk" href="my-plp-screen.html">Shop more looks →</a></div></div>';
  }

  function resultsHTML(q) {
    var res = search(q);
    if (!res.length) {
      return '<div class="sx-empty"><h2>No results for “' + esc(q) + '”</h2><p>Check the spelling, try a shorter word, or start from one of these.</p><div class="sx-chips">' + chipsHTML(POPULAR) + '</div></div>';
    }
    var rel = POPULAR.filter(function (t) { return t !== q.toLowerCase().trim() && search(t).length; }).slice(0, 4);
    var shown = showAll ? res : res.slice(0, PAGE_SIZE);
    return '<div class="sx-sum"><b>' + res.length + (res.length === 1 ? ' result' : ' results') + ' for “' + esc(q) + '”</b>' +
      (rel.length ? '<div class="sx-rel"><span>Related:</span>' + chipsHTML(rel) + '</div>' : '') + '</div>' +
      '<div class="sx-grid">' + shown.map(card).join('') + '</div>' +
      (res.length > PAGE_SIZE && !showAll ? '<button type="button" class="sx-more" data-more>View all ' + res.length + ' results</button>' : '');
  }

  function render() {
    var q = input.value.trim();
    clearBtn.hidden = !input.value;
    var host = root.querySelector('.sx-main');
    host.innerHTML = q ? resultsHTML(q) : discoverHTML();
    host.className = 'sx-main sx-body-inner';
    if (!q) wireCarousels(host);
  }

  // ---- build / open / close ----
  function build() {
    var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    root = document.createElement('div');
    root.className = 'sx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Search'); root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '<div class="sx-top"><a class="sx-logo" href="index.html" aria-label="ELARA home"><img src="assets/home/logo.webp" alt="ELARA"></a>' +
      '<button type="button" class="sx-close" aria-label="Close search">' + CLOSE + '</button></div>' +
      '<div class="sx-body"><form class="sx-form" role="search"><input type="search" id="sxInput" placeholder="Search bags, collections…" autocomplete="off" spellcheck="false" aria-label="Search">' +
      '<button type="button" class="sx-clear" aria-label="Clear search" hidden>' + CLOSE.replace('22', '20') + '</button>' +
      '<button type="submit" class="sx-go" aria-label="Search"><img src="assets/home/icon-search.svg" alt=""></button></form>' +
      '<div class="sx-main" style="display:contents"></div></div>';
    document.body.appendChild(root);
    input = root.querySelector('#sxInput'); clearBtn = root.querySelector('.sx-clear');
    // the form's own search button also carries aria-label="Search": keep it from re-opening the overlay
    root.querySelector('.sx-go').setAttribute('data-sx-inner', '');

    input.addEventListener('input', function () { clearTimeout(timer); showAll = false; timer = setTimeout(render, 140); });
    root.querySelector('.sx-form').addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(timer); render(); });
    clearBtn.addEventListener('click', function () { input.value = ''; showAll = false; render(); input.focus(); });
    root.querySelector('.sx-close').addEventListener('click', close);
    root.addEventListener('click', function (e) {
      var ar = e.target.closest('.sx-ar');
      if (ar) { e.preventDefault(); e.stopPropagation(); slideCard(ar.closest('.sx-card'), ar.classList.contains('next') ? 1 : -1); return; }
      var dot = e.target.closest('.sx-dot');
      if (dot) { e.preventDefault(); e.stopPropagation(); pickColour(dot.closest('.sx-card'), +dot.dataset.c); return; }
      var chip = e.target.closest('[data-term]');
      if (chip) { input.value = chip.dataset.term; showAll = false; render(); root.scrollTop = 0; input.focus({ preventScroll: true }); return; }
      if (e.target.closest('[data-more]')) { showAll = true; render(); }
    });
    root.addEventListener('mouseover', function (e) { var c = e.target.closest && e.target.closest('.sx-card[data-id]'); if (c && c.querySelector('.sx-trk img[data-src]')) loadSlides(c); });
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(root.querySelectorAll('a[href],button:not([disabled]),input'), function (el) { return el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, true);
    built = true;
  }

  function show(from) {
    if (!built) build();
    opener = from || null; open = true; showAll = false;
    input.value = ''; render();
    var gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden'; if (gap > 0) document.body.style.paddingRight = gap + 'px';
    root.scrollTop = 0; root.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { root.classList.add('open'); });
    setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }
  function close() {
    if (!open) return;
    open = false; root.classList.remove('open'); root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; document.body.style.paddingRight = '';
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  function loadScript(src, cb) {
    var el = document.createElement('script'); el.src = src; el.onload = cb; el.onerror = cb; document.head.appendChild(el);
  }
  function ensureCatalog(cb) {
    function needProducts() { if (window.ELARA_PRODUCTS) return cb(); loadScript('assets/products.js', cb); }
    if (window.ELARA_CATALOG) return needProducts();
    loadScript('assets/catalog.js', needProducts);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[aria-label="Search"]');
    if (!t || t.hasAttribute('data-sx-inner') || (root && root.contains(t))) return;
    e.preventDefault();
    ensureCatalog(function () { show(t); });
  });
  window.ElaraSearch = { open: function () { ensureCatalog(function () { show(null); }); }, close: close };
})();
