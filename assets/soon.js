/* "Coming soon" card, opens when someone clicks a navigation item that has data-soon="<name>".
   Collects an e-mail so the visitor can be told when the collection lands (kept on this device only). */
(function () {
  'use strict';
  var KEY = 'elara.notify.v1';
  var css = '' +
    '.soon{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(28,27,26,.46);backdrop-filter:blur(3px);opacity:0;visibility:hidden;transition:opacity .25s ease,visibility 0s linear .25s;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}' +
    '.soon.open{opacity:1;visibility:visible;transition:opacity .25s ease}' +
    '.soon *{box-sizing:border-box}' +
    '.soon-card{position:relative;width:440px;max-width:100%;padding:44px 40px 36px;border-radius:24px;background:linear-gradient(180deg,#fffdf9,#f8f1e4);box-shadow:0 40px 80px -20px rgba(28,27,26,.45);text-align:center;color:#4a4741;transform:translateY(18px) scale(.96);opacity:0;transition:transform .5s cubic-bezier(.22,.8,.3,1),opacity .35s ease}' +
    '.soon.open .soon-card{transform:none;opacity:1}' +
    '.soon-x{position:absolute;top:14px;right:14px;width:36px;height:36px;border:0;border-radius:50%;background:none;font-size:22px;line-height:1;color:#838280;cursor:pointer;transition:background-color .15s,color .15s}' +
    '.soon-x:hover{background:#f1e9dc;color:#4a4741}' +
    '.soon-eye{display:inline-block;padding:6px 14px;border-radius:999px;border:1px solid rgba(74,71,65,.25);font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#4a4741}' +
    '.soon h2{margin:18px 0 10px;font-family:Fraunces,serif;font-variation-settings:"SOFT" 0,"WONK" 1;font-weight:300;font-size:36px;line-height:1.08;letter-spacing:-1.4px}' +
    '.soon p{margin:0 auto;max-width:330px;font-size:14px;line-height:1.6;color:#838280}' +
    '.soon-form{display:flex;gap:8px;margin-top:24px}' +
    '.soon-form input{flex:1;min-width:0;height:48px;padding:0 16px;border:1px solid rgba(74,71,65,.25);border-radius:999px;background:#fffdf9;font:inherit;font-size:14px;color:#4a4741}' +
    '.soon-form input:focus{outline:none;border-color:#3184ff;box-shadow:0 0 0 3px rgba(49,132,255,.18)}' +
    '.soon-form button{height:48px;padding:0 22px;border:0;border-radius:999px;background:#4a4741;color:#fffdf9;font:inherit;font-size:14px;font-weight:500;cursor:pointer;transition:background-color .15s}' +
    '.soon-form button:hover{background:#2b2926}' +
    '.soon-err{min-height:18px;margin-top:8px;font-size:12px;color:#b4483f}' +
    '.soon-ok{display:none;margin-top:24px;font-size:14px;color:#2b8a4b;font-weight:500}' +
    '.soon.done .soon-form,.soon.done .soon-err{display:none}.soon.done .soon-ok{display:block}' +
    '.soon-help{display:none;margin-top:22px;height:48px;padding:0 26px;align-items:center;justify-content:center;border-radius:999px;background:#4a4741;color:#fffdf9;font-size:14px;font-weight:500;text-decoration:none}' +
    '.soon-help:hover{background:#2b2926}' +
    '.soon.page .soon-form,.soon.page .soon-err,.soon.page .soon-ok{display:none!important}.soon.page .soon-help{display:inline-flex}' +
    '@media (prefers-reduced-motion:reduce){.soon,.soon-card{transition:none}}';

  var root, titleEl, input, errEl, lastFocus, built = false;

  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    root = document.createElement('div');
    root.className = 'soon'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'soonTitle'); root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '<div class="soon-card"><button type="button" class="soon-x" aria-label="Close">×</button>' +
      '<span class="soon-eye">Coming soon</span><h2 id="soonTitle"></h2>' +
      '<p class="soon-msg">We are putting the finishing touches on this collection. It is not in the shop yet, but it will be here soon.</p>' +
      '<form class="soon-form" novalidate><input type="email" placeholder="Your e-mail, we will tell you first" aria-label="E-mail" autocomplete="email"><button type="submit">Notify me</button></form>' +
      '<div class="soon-err" role="alert"></div><div class="soon-ok" role="status">Thank you. We will e-mail you when it arrives.</div>' +
      '<a class="soon-help" href="my-contact-screen.html">Contact us</a></div>';
    document.body.appendChild(root);
    titleEl = root.querySelector('h2'); input = root.querySelector('input'); errEl = root.querySelector('.soon-err');
    root.querySelector('.soon-x').addEventListener('click', close);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) { e.stopPropagation(); close(); } }, true);
    root.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { errEl.textContent = 'Please enter a valid e-mail address.'; input.focus(); return; }
      try {
        fetch('https://sxwniigfrjzxryhuavev.supabase.co/rest/v1/rpc/subscribe', { method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: 'sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs', Authorization: 'Bearer sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs' },
          body: JSON.stringify({ p_email: v, p_source: 'notify:' + titleEl.textContent }) }).catch(function () {});
        var all = JSON.parse(localStorage.getItem(KEY) || '[]');
        all.push({ ts: Date.now(), email: v, collection: titleEl.textContent });
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch (err) {}
      root.classList.add('done');
    });
    input.addEventListener('input', function () { errEl.textContent = ''; });
    built = true;
  }
  function open(name, from, isPage) {
    if (!built) build();
    root.classList.toggle('page', !!isPage);
    root.querySelector('.soon-msg').textContent = isPage
      ? 'We are still writing this page, so it is not available yet. If you need something now, our team is happy to help.'
      : 'We are putting the finishing touches on this collection. It is not in the shop yet, but it will be here soon.';
    root.querySelector('.soon-eye').textContent = isPage ? 'Page coming soon' : 'Coming soon';
    titleEl.textContent = name; input.value = ''; errEl.textContent = ''; root.classList.remove('done');
    lastFocus = from || null;
    root.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { root.classList.add('open'); });
    setTimeout(function () { input.focus({ preventScroll: true }); }, 120);
  }
  function close() {
    if (!root) return;
    root.classList.remove('open'); root.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // Footer pages written in Admin > Content open as real pages; anything not written yet keeps the polite popup.
  var SLUGS = { 'shipping & delivery': 'shipping', 'returns & exchange': 'returns', 'our story': 'story', 'privacy policy': 'privacy', 'terms of service': 'terms' };
  var KEY_ = 'sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs', URL_ = 'https://sxwniigfrjzxryhuavev.supabase.co';
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-soon]');
    if (!a) return;
    e.preventDefault();
    var name = a.getAttribute('data-soon'), isPage = a.hasAttribute('data-soon-page'), slug = SLUGS[String(name).toLowerCase()];
    if (!isPage || !slug) { open(name, a, isPage); return; }
    var done = false, fallback = setTimeout(function () { if (!done) { done = true; open(name, a, true); } }, 1800);
    fetch(URL_ + '/rest/v1/settings?select=value&key=eq.page_' + slug, { headers: { apikey: KEY_ } })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (done) return; done = true; clearTimeout(fallback);
        var v = rows && rows[0] && rows[0].value;
        if (v && v.status === 'published' && String(v.body || '').trim()) location.href = 'page.html?p=' + slug; else open(name, a, true);
      })
      .catch(function () { if (done) return; done = true; clearTimeout(fallback); open(name, a, true); });
  });
})();
