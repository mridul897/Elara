/* ELARA mobile shell: adds the compact header, the menu drawer and the footer to the my-*.html pages.
   Load it with a plain <script src="assets/mobile.js"></script> right after <body>.
   It is always injected and shown only below 1280px (phones, tablets, small laptops) by assets/mobile.css, which is linked with a
   media query, so resizing a window across the breakpoint swaps layouts without a reload (nothing typed is lost). */
(function () {
  var b = document.body;
  var hide = document.createElement('style');
  hide.textContent = '@media (min-width: 1280px) { .mh, .mh-menu, .mf { display: none !important; } }';
  document.head.appendChild(hide);
  var noFooter = b.hasAttribute('data-m-nofooter');
  var back = b.getAttribute('data-m-back');   // e.g. "my-plp-screen.html": shows a back arrow instead of the logo
  var title = b.getAttribute('data-m-title'); // e.g. "Checkout"

  var logo = back
    ? '<a class="mh-back" href="' + back + '" aria-label="Back"><svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M15 5l-7 7 7 7" stroke="#4A4741" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>' +
      '<span class="mh-title">' + (title || '') + '</span>'
    : '<a href="index.html" class="mh-logo" aria-label="ELARA home"><img src="assets/home/logo.webp" alt="ELARA"></a>';

  var header =
    '<header class="mh">' + logo +
    '<div class="mh-tools">' +
    '<button type="button" class="mh-tap" aria-label="Search"><img src="assets/home/icon-search.svg" alt=""></button>' +
    '<a class="mh-tap" href="my-account.html" aria-label="Account"><img src="assets/home/icon-account.svg" alt=""></a>' +
    '<a class="mh-tap icon-btn" href="my-cart-screen.html" aria-label="Bag"><img src="assets/home/icon-cart.svg" alt=""></a>' +
    '<button type="button" class="mh-tap" id="mhMenuBtn" aria-label="Menu" aria-expanded="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M3 6.5h18M3 12h18M3 17.5h18" stroke="#4A4741" stroke-width="1.5" stroke-linecap="round"/></svg></button>' +
    '</div></header>' +
    '<div class="mh-menu" id="mhMenu" aria-hidden="true"><div class="mh-scrim" data-close></div>' +
    '<nav aria-label="Main menu"><button type="button" class="mh-close" data-close aria-label="Close menu">×</button>' +
    '<a href="my-plp-screen.html?collection=new">New Arrivals</a><a href="my-plp-screen.html">Bags</a>' +
    '<a href="#" data-soon="Collections">Collections</a><a href="#" data-soon="Best Sellers">Best Sellers</a>' +
    '<a href="my-order-tracking.html">Track my order</a><a href="my-contact-screen.html">Contact Us</a></nav></div>';

  var footer =
    '<footer class="mf">' +
    '<div class="mf-brand"><span class="mf-wm">ELARA</span><p>Premium leather bags for the routine you actually have: work, weekend, and everything between. Designed in Bangladesh.</p></div>' +
    '<div class="mf-help"><b>Need help deciding?</b><p>Message us on WhatsApp or email: we reply within 1 business day.</p><a href="my-contact-screen.html">WhatsApp: +880 1320575476</a><a href="my-contact-screen.html">hello@elara.com.bd</a></div>' +
    '<div class="mf-cols">' +
    '<div><h5>Shop</h5><a href="my-plp-screen.html?collection=new">New Arrivals</a><a href="#" data-soon="Best Sellers">Best Sellers</a><a href="#" data-soon="Collections">Collections</a><a href="my-plp-screen.html">All Bags</a></div>' +
    '<div><h5>Customer Service</h5><a href="#" data-soon="Shipping &amp; Delivery" data-soon-page>Shipping &amp; Delivery</a><a href="#" data-soon="Returns &amp; Exchange" data-soon-page>Returns &amp; Exchange</a><a href="my-order-tracking.html">Order Tracking</a><a href="my-contact-screen.html">Contact Us</a></div>' +
    '<div><h5>About</h5><a href="#" data-soon="Our Story" data-soon-page>Our Story</a><a href="my-contact-screen.html">Contact</a></div>' +
    '<div><h5>Legal</h5><a href="#" data-soon="Privacy Policy" data-soon-page>Privacy Policy</a><a href="#" data-soon="Terms of Service" data-soon-page>Terms of Service</a></div>' +
    '</div>' +
    '<div class="mf-legal"><span>© 2026 ELARA. All rights reserved.</span><span>Dhaka Tk. 60/- (1–3 days) · Outside Dhaka Tk. 120/- (3–5 days) · Free over Tk. 3,000/-</span></div>' +
    '</footer>';

  b.insertAdjacentHTML('afterbegin', header);

  function wire() {
    var menu = document.getElementById('mhMenu'), btn = document.getElementById('mhMenuBtn');
    if (!menu || !btn) return;
    var set = function (o) { menu.classList.toggle('open', o); menu.setAttribute('aria-hidden', String(!o)); btn.setAttribute('aria-expanded', String(o)); };
    btn.addEventListener('click', function () { set(true); });
    menu.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    if (!noFooter) b.insertAdjacentHTML('beforeend', footer);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
