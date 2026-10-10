/*
  ELARA bag count + "add to bag" flight.
  Shared by every page that has a "My cart" button (home, PLP, PDP, cart).
  - Reads the same localStorage cart the cart page writes ("elara.cart.v1").
  - Shows the total quantity as a small badge on the My cart button.
  - ElaraCart.fly(fromEl, done): a bag icon lifts off fromEl, arcs up to the My cart button,
    the button gives one soft pulse and the badge pops in. Reduced motion: no flight, badge only.
*/
(function () {
  var KEY = 'elara.cart.v1';
  var BLACK = '#4a4741';   /* the site's dark: dark pills, filter counts, headings */
  var CREAM = '#fffdf9';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var style = document.createElement('style');
  style.textContent =
    '.has-cart-badge{position:relative}' +
    '.cart-badge{position:absolute;top:-8px;right:-8px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:' + BLACK + ';color:' + CREAM + ';font:500 12px/20px Inter,sans-serif;text-align:center;letter-spacing:0;text-transform:none;box-shadow:0 0 0 2px ' + CREAM + ';pointer-events:none;white-space:nowrap}' +
    'a.icon-btn.has-cart-badge .cart-badge{top:2px;right:0}' +
    '.cart-badge.is-empty{display:none}' +
    '.cart-fly{position:fixed;left:0;top:0;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:' + BLACK + ';color:' + CREAM + ';display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:9999;will-change:transform,opacity;box-shadow:0 6px 18px rgba(28,27,26,.22)}' +
    '.cart-fly svg{width:20px;height:20px}' +
    '.cart-badge-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}';
  document.head.appendChild(style);

  var live = document.createElement('span');
  live.className = 'cart-badge-live';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);

  function count() {
    try {
      var cart = JSON.parse(localStorage.getItem(KEY)) || [];
      return cart.reduce(function (n, l) { return n + (l.qty || 0); }, 0);
    } catch (e) { return 0; }
  }
  function hosts() { return document.querySelectorAll('.cart-btn, a.icon-btn[aria-label^="Bag"]'); }
  function badgeOf(host) {
    var b = host.querySelector(':scope > .cart-badge');
    if (!b) {
      b = document.createElement('span');
      b.className = 'cart-badge is-empty';
      b.setAttribute('aria-hidden', 'true');
      host.classList.add('has-cart-badge');
      host.appendChild(b);
    }
    return b;
  }
  function pulse(host) {
    if (reduce || !host.animate) return;
    host.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: .4 }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.22,.8,.3,1)' });
  }
  function pop(b) {
    if (reduce || !b.animate) return;
    b.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.22,.8,.3,1)' });
  }

  function refreshBadge(opts) {
    var n = count();
    var text = n > 99 ? '99+' : String(n);
    hosts().forEach(function (host) {
      var b = badgeOf(host);
      var changed = b.textContent !== text;
      b.textContent = text;
      b.classList.toggle('is-empty', n === 0);
      if (host.classList.contains('cart-btn')) {
        host.setAttribute('aria-label', n ? 'My cart, ' + n + (n === 1 ? ' item' : ' items') : 'My cart');
      }
      if (opts && opts.pop && n > 0) { pulse(host); if (changed || opts.force) pop(b); }
    });
    if (opts && opts.pop) live.textContent = n + (n === 1 ? ' item' : ' items') + ' in your bag';
    return n;
  }

  var BAG = '<svg viewBox="0 0 19 19" fill="none" aria-hidden="true"><path d="M5 6h9l-.7 9.2a1.5 1.5 0 0 1-1.5 1.4H7.2a1.5 1.5 0 0 1-1.5-1.4L5 6z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.3 6V4.8a2.2 2.2 0 1 1 4.4 0V6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  function targetHost() {
    var list = hosts();
    for (var i = 0; i < list.length; i++) if (list[i].getBoundingClientRect().width > 0) return list[i];
    return null;
  }

  function fly(fromEl, done) {
    var host = targetHost();
    if (reduce || !host || !fromEl || !fromEl.animate) { done && done(); return; }

    var a = fromEl.getBoundingClientRect();
    var t = host.getBoundingClientRect();
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    var x1 = t.left + t.width / 2;
    var y1 = t.bottom < 0 ? -24 : t.top + t.height / 2;   /* nav scrolled away: fly off the top edge */
    var dx = x1 - x0, dy = y1 - y0, len = Math.sqrt(dx * dx + dy * dy) || 1;
    /* a gentle arc: control point nudged sideways off the straight line */
    var cx = (x0 + x1) / 2 + (dy / len) * len * 0.22;
    var cy = (y0 + y1) / 2 - (dx / len) * len * 0.22;

    var el = document.createElement('span');
    el.className = 'cart-fly';
    el.innerHTML = BAG;
    document.body.appendChild(el);

    var duration = Math.max(750, Math.min(1000, 600 + len * 0.35));
    var start = null;
    function ease(p) { return -(Math.cos(Math.PI * p) - 1) / 2; }   /* easeInOutSine: slow out, slow in */
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var e = ease(p), u = 1 - e;
      var x = u * u * x0 + 2 * u * e * cx + e * e * x1;
      var y = u * u * y0 + 2 * u * e * cy + e * e * y1;
      var s = p < 0.14 ? 0.6 + 0.4 * (p / 0.14) : 1 - 0.55 * e;
      var o = p < 0.14 ? p / 0.14 : p > 0.82 ? (1 - p) / 0.18 : 1;
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
      el.style.opacity = o.toFixed(3);
      if (p < 1) requestAnimationFrame(step);
      else { el.remove(); done && done(); }
    }
    el.style.transform = 'translate(' + x0 + 'px,' + y0 + 'px) scale(.6)';
    el.style.opacity = '0';
    requestAnimationFrame(step);
  }

  window.ElaraCart = { count: count, refreshBadge: refreshBadge, fly: fly };
  refreshBadge();
  window.addEventListener('storage', function (e) { if (e.key === KEY) refreshBadge(); });
})();
