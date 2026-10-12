/* ELARA Admin: shared shell, Supabase client, helpers. Pages call A.boot({...}). */
(function () {
  var SUPA_URL = 'https://sxwniigfrjzxryhuavev.supabase.co';
  var SUPA_KEY = 'sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs'; // publishable (anon) key: safe in the browser, RLS protects the data
  var A = (window.A = {});
  A.sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });

  /* ---------- helpers ---------- */
  A.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  A.ic = function (n, size) {
    var i = (window.ADMIN_ICONS || {})[n]; if (!i) return '';
    size = size || 18;
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="' + i.vb + '" fill="none" aria-hidden="true">' + i.p + '</svg>';
  };
  A.img = function (s) { return !s ? '' : /^(https?:|data:|\/)/.test(s) ? s : '../' + s; };
  A.money = function (n) { return 'Tk. ' + Number(n || 0).toLocaleString('en-US'); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  A.when = function (iso) {
    var d = new Date(iso), h = d.getHours(), m = d.getMinutes();
    return d.getDate() + ' ' + MON[d.getMonth()] + ', ' + (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'am' : 'pm');
  };
  A.toast = function (msg, err) {
    var t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2800);
  };
  var PAY = { cod: 'Cash on delivery', bkash: 'bKash', nagad: 'Nagad', card: 'Card' };
  A.payLabel = function (o) { return o.payment_method === 'cod' ? PAY.cod : PAY[o.payment_method] + ' · ' + o.payment_state; };
  A.payName = function (m) { return PAY[m] || m; };
  // DB status -> the label + colour the design uses
  A.statusBadge = function (o) {
    if (o.payment_state === 'failed' && o.status === 'placed') return { label: 'Payment failed', cls: 'b-bad' };
    var m = {
      placed: ['To confirm', 'b-bad'], confirmed: ['To pack', 'b-warn'], packed: ['Packed', 'b-warn'],
      shipped: ['Shipped', 'b-info'], delivered: ['Delivered', 'b-ok'], cancelled: ['Cancelled', 'b-mute'], returned: ['Returned', 'b-mute']
    }[o.status] || [o.status, 'b-mute'];
    return { label: m[0], cls: m[1] };
  };

  /* ---------- shell ---------- */
  var NAV = [
    ['Overview', [['dashboard', 'Dashboard', 'home']]],
    ['Sales', [['orders', 'Orders', 'shopping-bag1'], ['customers', 'Customers', 'user-group'], ['promotions', 'Promotions', 'percent']]],
    ['Catalog', [['products', 'Products', 'package'], ['reviews', 'Reviews', 'star']]],
    ['Store', [['content', 'Content', 'file-text'], ['settings', 'Settings', 'settings-gear1']]]
  ];
  var BUILT = { orders: 1, products: 1 };   // pages that exist so far

  A.brand = function (withCollapse) {
    return '<div class="brand"><img class="fav" src="favicon1.png" alt="">' +
      '<div class="t"><div class="logo"><img src="elara-logo1.png" alt="ELARA"></div><span class="adm">Admin</span></div>' +
      (withCollapse ? '<button class="collapse" id="collapseBtn" aria-label="Collapse sidebar" title="Collapse sidebar">' + A.ic('sidebar-simple-left-wide', 18) + '</button>' : '') + '</div>';
  };

  function navHtml(active, role, counts) {
    return NAV.map(function (g) {
      var items = g[1].filter(function (i) { return role === 'owner' || i[0] === 'orders'; });
      if (!items.length) return '';
      return '<div class="nav-group"><p class="nav-label">' + g[0] + '</p>' + items.map(function (i) {
        var n = counts[i[0]];
        return '<a class="nav-item' + (i[0] === active ? ' on' : '') + '" href="' + i[0] + '.html" data-nav="' + i[0] + '" title="' + i[1] + '">' + A.ic(i[2], 18) +
          '<span class="lbl">' + i[1] + '</span>' + (n ? '<span class="count">' + n + '</span>' : '') + '</a>';
      }).join('') + '</div>';
    }).join('');
  }

  A.session = async function () {
    var r = await A.sb.auth.getSession();
    return r.data && r.data.session;
  };

  A.signOut = async function () {
    try { sessionStorage.removeItem('elara.admin.alive'); } catch (e) {}
    await A.sb.auth.signOut();
    location.href = 'index.html';
  };

  /* opts: { active, crumbs:[{t,href?}], render(pageEl, ctx) } */
  A.boot = async function (opts) {
    var s = await A.session();
    try {
      if (s && localStorage.getItem('elara.admin.keep') === '0' && !sessionStorage.getItem('elara.admin.alive')) { await A.sb.auth.signOut(); s = null; }
    } catch (e) {}
    if (!s) { location.replace('index.html'); return; }
    var pr = await A.sb.from('profiles').select('full_name, role').eq('id', s.user.id).maybeSingle();
    var role = pr.data && pr.data.role;
    var who = (pr.data && pr.data.full_name) || s.user.email;
    if (role !== 'owner' && role !== 'staff') { await A.sb.auth.signOut(); location.replace('index.html?denied=1'); return; }
    if (role === 'staff' && opts.active !== 'orders') { location.replace('orders.html'); return; }

    var counts = {};
    var collapsed = false; try { collapsed = localStorage.getItem('elara.admin.collapsed') === '1'; } catch (e) {}
    var parts = who.trim().split(/\s+/), initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : who.slice(0, 2)).toUpperCase() || 'A';
    var root = document.getElementById('root');
    root.innerHTML =
      '<div class="app' + (collapsed ? ' collapsed' : '') + '" id="app">' +
      '<aside class="sidebar">' + A.brand(true) +
      '<button class="search" type="button" id="gsearch">' + A.ic('magnifying-glass', 16) + '<span class="ph">Search…</span><span class="kbd">⌘K</span></button>' +
      '<div id="navs" class="nav-wrap">' + navHtml(opts.active, role, counts) + '</div>' +
      '<div class="spacer"></div>' +
      '<a class="nav-item" href="../my-contact-screen.html" title="Get help">' + A.ic('questionmark-circle', 18) + '<span class="lbl">Get help</span></a>' +
      '<div class="user pop-wrap"><div class="avatar">' + A.esc(initials) + '</div><div class="t"><p class="n">' + A.esc(who) + '</p><p class="e">' + A.esc(s.user.email) + '</p></div>' +
      '<button class="more" id="userMore" aria-label="Account menu">' + A.ic('dot-grid1x3-horizontal', 18) + '</button>' +
      '<div class="pop" id="userPop" hidden style="top:auto;bottom:calc(100% + 6px);left:0;min-width:200px"><button id="signOut">Sign out</button></div></div>' +
      '</aside>' +
      '<div class="main"><header class="topbar"><div class="crumbs">' +
      (opts.crumbs || []).map(function (c, i, a) { return (c.href ? '<a href="' + c.href + '">' + A.esc(c.t) + '</a>' : '<span>' + A.esc(c.t) + '</span>') + (i < a.length - 1 ? '<span class="sep">' + A.ic('chevron-right-small', 16) + '</span>' : ''); }).join('') +
      '</div><button class="btn icon" aria-label="Notifications" id="bell">' + A.ic('bell', 18) + '</button>' +
      '<a class="btn" href="../index.html" target="_blank" rel="noopener">View store</a></header>' +
      '<main class="page" id="page"></main></div></div>';

    var app = document.getElementById('app');
    function toggle() { app.classList.toggle('collapsed'); try { localStorage.setItem('elara.admin.collapsed', app.classList.contains('collapsed') ? '1' : '0'); } catch (e) {} }
    document.getElementById('collapseBtn').addEventListener('click', toggle);
    app.querySelector('.brand').addEventListener('click', function (e) { if (app.classList.contains('collapsed') && !e.target.closest('.collapse')) toggle(); });
    document.getElementById('userMore').addEventListener('click', function (e) { e.stopPropagation(); var p = document.getElementById('userPop'); p.hidden = !p.hidden; });
    document.getElementById('signOut').addEventListener('click', A.signOut);
    document.addEventListener('click', function () { var p = document.getElementById('userPop'); if (p) p.hidden = true; });
    document.getElementById('gsearch').addEventListener('click', function () { A.toast('Global search is coming soon. Use the search box on each list.'); });
    document.getElementById('bell').addEventListener('click', function () { A.toast('No new notifications.'); });
    document.getElementById('navs').addEventListener('click', function (e) {
      var a = e.target.closest('[data-nav]'); if (!a) return;
      if (!BUILT[a.getAttribute('data-nav')]) { e.preventDefault(); A.toast(a.title + ' is the next page being built.'); }
    });

    // sidebar badges: orders waiting to be confirmed, reviews waiting for approval
    A.sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'placed').then(function (r) { setCount('orders', r.count); });
    if (role === 'owner') A.sb.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending').then(function (r) { setCount('reviews', r.count); });
    function setCount(key, n) {
      counts[key] = n || 0;
      document.getElementById('navs').innerHTML = navHtml(opts.active, role, counts);
    }

    var ctx = { user: s.user, role: role, name: who, counts: counts };
    await opts.render(document.getElementById('page'), ctx);
  };

  A.modal = function (html, onMount) {
    var o = document.createElement('div'); o.className = 'overlay';
    o.innerHTML = '<div class="dialog" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(o);
    var close = function () { o.remove(); document.removeEventListener('keydown', esc); };
    var esc = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    o.addEventListener('mousedown', function (e) { if (e.target === o) close(); });
    o.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
    if (onMount) onMount(o, close);
    return close;
  };
  A.slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); };
  A.ago = function (iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' minute' + (s < 120 ? '' : 's') + ' ago';
    if (s < 86400) return Math.floor(s / 3600) + ' hour' + (s < 7200 ? '' : 's') + ' ago'; return A.when(iso);
  };

  /* small dropdown used by the filter buttons: A.menu(buttonEl, [{v,l}], current, onPick) */
  A.menu = function (wrap, items, current, onPick) {
    var pop = wrap.querySelector('.pop'); if (pop) pop.remove();
    pop = document.createElement('div'); pop.className = 'pop';
    pop.innerHTML = items.map(function (i) { return '<button data-v="' + A.esc(i.v) + '" class="' + (i.v === current ? 'on' : '') + '">' + A.esc(i.l) + (i.v === current ? '✓' : '') + '</button>'; }).join('');
    wrap.appendChild(pop);
    pop.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; pop.remove(); onPick(b.getAttribute('data-v')); });
    setTimeout(function () { document.addEventListener('click', function off() { pop.remove(); document.removeEventListener('click', off); }); });
  };
})();
