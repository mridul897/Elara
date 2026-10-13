/* Welcome offer popup. Opens in the bottom-right corner (like the reference video): the page dims, the content panel rises
   from the bottom, then the photo panel slides out to its left. Build of the Figma frames "Welcome Popup / 1 - Offer" (277:1527) and "/ 2 - Check your inbox" (277:1963).
   It opens on every homepage visit until the visitor has an ELARA account (any account stored on this device, or signed in).
   "No thanks" only closes it for this page view. Someone who already claimed the code but has no account yet is shown
   a reminder that points to Create account instead of the email form.
   There is no mail server yet, so the "email" is simulated: the code WELCOME10 is stored on this device ("elara.welcome.v1")
   and the cart accepts it (once) only after it has been claimed here.
   Add ?welcome=1 to the page address to see the popup again, whatever is stored. */
(function () {
  'use strict';
  var KEY = 'elara.welcome.v1', EMAILS = 'elara.welcomeEmails.v1', SESSION = 'elara.session.v1', ACCOUNTS = 'elara.accounts.v1';
  var CODE = 'WELCOME10';
  var force = /[?&]welcome=1\b/.test(location.search);
  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var accs = read(ACCOUNTS);
  if (!force && ((accs && accs.length) || read(SESSION))) return;   // has an account (or is signed in): never show again

  var css = '' +
  '.wp{position:fixed;inset:0;z-index:9000;display:flex;align-items:flex-end;justify-content:flex-end;padding:24px;font-family:Inter,sans-serif;color:#4a4741;-webkit-font-smoothing:antialiased;visibility:hidden;transition:visibility 0s linear .6s}' +
  '.wp.open{visibility:visible;transition:none}' +
  '.wp *{box-sizing:border-box;margin:0;padding:0}.wp [hidden]{display:none!important}' +
  '.wp-dim{position:absolute;inset:0;background:rgba(28,27,26,.5);opacity:0;transition:opacity .5s cubic-bezier(.4,0,.2,1)}.wp.open .wp-dim{opacity:1}' +
  '.wp-card{position:relative;display:flex;max-width:calc(100vw - 48px);min-height:440px;background:#fffdf9;border-radius:16px;overflow:hidden;box-shadow:0 24px 60px -12px rgba(0,0,0,.35);transform:translateY(calc(100% + 48px));transition:transform .7s cubic-bezier(.22,.8,.3,1);outline:0}' +
  '.wp.open .wp-card{transform:none}' +
  '.wp-photo{width:0;flex-shrink:0;overflow:hidden;background:#f2ecde;transition:width .8s cubic-bezier(.65,0,.25,1) .55s}.wp.open .wp-photo{width:320px}.wp-photo img{display:block;width:320px;height:100%;object-fit:cover;opacity:0;transition:opacity .5s ease .9s}.wp.open .wp-photo img{opacity:1}' +
  '.wp-body{flex:0 0 480px;width:480px;display:flex;flex-direction:column;gap:20px;padding:48px 44px 36px}' +
  '.wp-x{position:absolute;top:14px;right:14px;width:32px;height:32px;display:grid;place-items:center;border:0;background:none;border-radius:50%;cursor:pointer;color:#4a4741;transition:background-color .15s}' +
  '.wp-x:hover{background:#f7f1e8}.wp-x svg{width:18px;height:18px}' +
  '.wp-eyebrow{font-size:12px;font-weight:500;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;color:#838280}' +
  '.wp-title{font-family:Fraunces,serif;font-variation-settings:"SOFT" 0,"WONK" 1;font-weight:300;font-size:36px;line-height:1.1;letter-spacing:-1.8px}.wp-title:focus{outline:0}' +
  '.wp-sub{font-size:14px;line-height:1.5;color:#838280}' +
  '.wp-form{display:flex;flex-direction:column;gap:8px}' +
  '.wp-field{display:flex;align-items:center;gap:12px;padding:6px 6px 6px 20px;border:1px solid #4a4741;border-radius:999px;background:#fffdf9;transition:box-shadow .15s}' +
  '.wp-field:focus-within{box-shadow:0 0 0 3px rgba(49,132,255,.2)}.wp-field.bad{border-color:#d22c15}.wp-field.bad:focus-within{box-shadow:0 0 0 3px rgba(210,44,21,.15)}' +
  '.wp-field input{flex:1;min-width:0;height:40px;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:#4a4741}.wp-field input::placeholder{color:#838280}' +
  '.wp-go{flex-shrink:0;width:40px;height:40px;display:grid;place-items:center;border:0;border-radius:50%;background:#2a72de;cursor:pointer;transition:background-color .15s,transform .15s}' +
  '.wp-go:hover{background:#1f5fc4}.wp-go:active{transform:scale(.94)}.wp-go:disabled{opacity:.6;cursor:default}.wp-go svg{width:20px;height:20px}' +
  '.wp-err{font-size:12px;line-height:1.5;color:#d22c15;padding-left:20px}' +
  '.wp-note{font-size:12px;line-height:1.5;color:#838280}' +
  '.wp-no{align-self:flex-start;margin-top:auto;border:0;background:none;font:inherit;font-size:14px;font-weight:500;color:#2a72de;cursor:pointer}.wp-no:hover{text-decoration:underline}' +
  '.wp-tick{width:48px;height:48px;flex-shrink:0}' +
  '.wp-hint{display:flex;flex-direction:column;gap:4px;padding:14px 20px;background:#f8f4ef;border:1px solid rgba(74,71,65,.25);border-radius:12px;font-size:14px;line-height:1.5}.wp-hint span{font-size:12px;color:#838280}' +
  '.wp-btn{display:flex;align-items:center;justify-content:center;height:50px;margin-top:auto;border-radius:999px;background:#2a72de;color:#fff;font-size:15px;font-weight:500;text-decoration:none;transition:background-color .15s}.wp-btn:hover{background:#1f5fc4}' +
  '.wp a:focus-visible,.wp button:focus-visible{outline:2px solid #3184ff;outline-offset:3px;border-radius:4px}' +
  '@media (max-width:760px){.wp{padding:12px}.wp-card{width:100%;max-width:100%;min-height:0}.wp-photo{display:none}.wp-body{flex:1;width:auto;padding:44px 24px 28px}.wp-title{font-size:30px}}' +
  '@media (prefers-reduced-motion:reduce){.wp-dim,.wp-card,.wp-photo,.wp-photo img{transition:none}}';

  var X = '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.5 3.5l11 11M14.5 3.5l-11 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var ARROW = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TICK = '<svg class="wp-tick" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#0CA817"/><path d="M14 25l7 7 13-15" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var root, card, closed = false, opener = null;

  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    root = document.createElement('div'); root.className = 'wp'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'false'); root.setAttribute('aria-labelledby', 'wpTitle');
    root.innerHTML = '<div class="wp-dim" data-wp-close></div><div class="wp-card" tabindex="-1">' +
      '<button type="button" class="wp-x" aria-label="Close" data-wp-close>' + X + '</button>' +
      '<div class="wp-photo"><img src="assets/home/na/best-feature.webp" alt=""></div>' +
      '<div class="wp-body" id="wpBody"></div></div>';
    document.body.appendChild(root);
    card = root.querySelector('.wp-card');
    root.addEventListener('click', function (e) { if (e.target.closest('[data-wp-close]')) dismiss(); });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('open')) return;
      if (e.key === 'Escape') { e.stopPropagation(); dismiss(); return; }
    }, true);
  }

  function offer() {
    var b = document.getElementById('wpBody');
    b.innerHTML = '<p class="wp-eyebrow">First timer?</p>' +
      '<h2 class="wp-title" id="wpTitle" tabindex="-1">Get 10% off your first order</h2>' +
      '<p class="wp-sub">Join ELARA and we will email you a one-time code for 10% off. It is yours to use on any bag.</p>' +
      '<form class="wp-form" novalidate><div class="wp-field" id="wpField"><input type="email" id="wpEmail" placeholder="Enter your email" autocomplete="email" inputmode="email" aria-label="Email address">' +
      '<button type="submit" class="wp-go" aria-label="Get my code">' + ARROW + '</button></div><p class="wp-err" id="wpErr" role="alert" hidden></p></form>' +
      '<p class="wp-note">One code per person. We will not spam you, and you can unsubscribe any time.</p>' +
      '<button type="button" class="wp-no" data-wp-close>No thanks</button>';
    var input = document.getElementById('wpEmail'), err = document.getElementById('wpErr'), field = document.getElementById('wpField');
    input.addEventListener('input', function () { err.hidden = true; field.classList.remove('bad'); });
    b.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim().toLowerCase();
      function bad(msg) { err.textContent = msg; err.hidden = false; field.classList.add('bad'); input.focus(); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { bad('Enter a valid email address, like you@example.com.'); return; }
      var list = read(EMAILS) || [];
      if (!force && list.indexOf(v) !== -1) { bad('This email has already received its code. Check your inbox.'); return; }
      list.push(v); write(EMAILS, list);
      if (window.ElaraDB) ElaraDB.subscribe(v, 'welcome-popup');
      write(KEY, { status: 'claimed', email: v, code: CODE, at: new Date().toISOString() });
      sent(v);
    });
    setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, 900);
  }

  function sent(email) {
    var b = document.getElementById('wpBody');
    b.innerHTML = '<p class="wp-eyebrow">First timer?</p>' + TICK +
      '<h2 class="wp-title" id="wpTitle" tabindex="-1">Here is your 10% code</h2>' +
      '<p class="wp-sub">Thank you, <b style="font-weight:500;color:#4a4741">' + esc(email) + '</b>. Your one-time code is <b style="font-weight:600;color:#4a4741;letter-spacing:.04em">' + CODE + '</b>.</p>' +
      '<div class="wp-hint"><span>Use it at checkout</span>Paste the code in your bag. It works once for your phone number.</div>' +
      '<a class="wp-btn" href="my-plp-screen.html">Start shopping</a>';
    document.getElementById('wpTitle').focus({ preventScroll: true });
  }

  // already claimed the code on this device, but no account yet: remind them and point to Create account
  function reminder(st) {
    var b = document.getElementById('wpBody');
    var used = !!st.used;                          // the code was spent on an order already
    b.innerHTML = '<p class="wp-eyebrow">' + (used ? 'Welcome back' : 'Your 10% is waiting') + '</p>' +
      '<h2 class="wp-title" id="wpTitle" tabindex="-1">Create your ELARA account</h2>' +
      '<p class="wp-sub">' + (used ? 'Keep your orders in one place, save bags you like and check out faster next time.'
        : 'We sent your one-time code' + (st.email ? ' to <b style="font-weight:500;color:#4a4741">' + esc(st.email) + '</b>' : '') + '. Create an account to keep it, save bags you like and track your orders.') + '</p>' +
      (used ? '' : '<div class="wp-hint"><span>Your code</span>' + CODE + '</div>') +
      '<a class="wp-btn" href="my-account.html#create">Create account</a>' +
      '<button type="button" class="wp-no" data-wp-close style="margin-top:0">Maybe later</button>';
  }

  function show() {
    if (closed || (root && root.classList.contains('open'))) return;
    if (!root) build();
    opener = document.activeElement;
    var st = read(KEY);
    if (!force && st && st.status === 'claimed') reminder(st); else offer();
    void root.offsetHeight;                       // paint the closed state once so the opening transitions run
    requestAnimationFrame(function () { root.classList.add('open'); });
  }
  function dismiss() {
    if (!root || !root.classList.contains('open')) return;
    closed = true;                                   // closed for this page view only; it comes back next visit until there is an account
    root.classList.remove('open');
    if (opener && opener.focus) try { opener.focus({ preventScroll: true }); } catch (e) {}
  }

  // wait for the homepage loader to clear, then give the visitor a few seconds before interrupting
  function start() {
    var wait = force ? 400 : 2600;
    setTimeout(show, wait);
  }
  start();
})();
