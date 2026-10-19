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
  // n filled stars out of 5 (design: gold #E0A400 filled, light grey outline for empty)
  A.stars = function (n) {
    var out = '';
    for (var i = 1; i <= 5; i++) out += '<span style="color:' + (i <= n ? '#E0A400' : '#D5D8DE') + ';display:flex">' + A.ic('star14', 14).replace('fill="none"', 'fill="' + (i <= n ? '#E0A400' : 'none') + '"') + '</span>';
    return '<span style="display:inline-flex;gap:2px">' + out + '</span>';
  };
  A.initials = function (n) { var p = String(n || '').trim().split(/\s+/); return ((p.length > 1 ? p[0][0] + p[1][0] : String(n || '').slice(0, 2)) || '?').toUpperCase(); };
  A.waLink = function (phone, text) {
    var d = String(phone || '').replace(/\D/g, ''); if (d.indexOf('880') !== 0) d = '880' + d.replace(/^0/, '');
    return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
  };
  A.money = function (n) { return 'Tk. ' + Number(n || 0).toLocaleString('en-US'); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  A.when = function (iso) {
    var d = new Date(iso), h = d.getHours(), m = d.getMinutes();
    return d.getDate() + ' ' + MON[d.getMonth()] + ', ' + (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'am' : 'pm');
  };
  // The store keeps a short-lived copy of the catalogue in this browser. Clear it after any successful save.
  A.bust = function () { try { localStorage.removeItem('elara.catalog.v2'); } catch (e) {} };
  A.toast = function (msg, err) {
    if (!err) A.bust();
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
    ['Store', [['content', 'Content', 'file-text'], ['messages', 'Messages', 'mail'], ['settings', 'Settings', 'settings-gear1']]]
  ];
  var BUILT = { orders: 1, products: 1, dashboard: 1, promotions: 1, customers: 1, reviews: 1, content: 1, settings: 1, more: 1, messages: 1, activity: 1 };   // pages that exist so far

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

  // Phone layout: bottom tab bar (Home, Orders, Products, Customers, More)
  function mobileTabs(active, role, counts) {
    var tabs = [['dashboard', 'Home', 'home'], ['orders', 'Orders', 'shopping-bag1'], ['products', 'Products', 'package'], ['customers', 'Customers', 'user-group'], ['more', 'More', 'dot-grid1x3-horizontal']];
    if (role !== 'owner') tabs = [['orders', 'Orders', 'shopping-bag1'], ['more', 'More', 'dot-grid1x3-horizontal']];
    var main = { dashboard: 1, orders: 1, products: 1, customers: 1 };
    var cur = main[active] ? active : 'more';
    return tabs.map(function (t) {
      var n = t[0] === 'orders' ? counts.orders : 0;
      return '<a class="mtab' + (t[0] === cur ? ' on' : '') + '" href="' + t[0] + '.html"><span class="mic">' + A.ic(t[2], 20) + '</span><span class="mlb">' + t[1] + (n ? '<i class="mbd">' + n + '</i>' : '') + '</span></a>';
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
      '<div id="navs" class="nav-wrap">' + navHtml(opts.active, role, counts) + '</div>' +
      '<div class="spacer"></div>' +
      '<a class="nav-item" href="../my-contact-screen.html" title="Get help">' + A.ic('questionmark-circle', 18) + '<span class="lbl">Get help</span></a>' +
      '<div class="user pop-wrap"><div class="avatar">' + A.esc(initials) + '</div><div class="t"><p class="n">' + A.esc(who) + '</p><p class="e">' + A.esc(s.user.email) + '</p></div>' +
      '<button class="more" id="userMore" aria-label="Account menu">' + A.ic('dot-grid1x3-horizontal', 18) + '</button>' +
      '<div class="pop" id="userPop" hidden style="top:auto;bottom:calc(100% + 6px);left:0;min-width:200px"><button id="signOut">Sign out</button></div></div>' +
      '</aside>' +
      '<header class="mtop"><span class="mlogo">E</span><p class="mttl">' + A.esc(opts.mtitle || (opts.crumbs && opts.crumbs[0] && opts.crumbs[0].t) || 'ELARA') + '</p><button class="mbell" id="mbell" aria-label="Notifications">' + A.ic('bell', 20) + '</button></header>' +
      '<div class="main"><header class="topbar"><div class="crumbs">' +
      (opts.crumbs || []).map(function (c, i, a) { return (c.href ? '<a href="' + c.href + '">' + A.esc(c.t) + '</a>' : '<span>' + A.esc(c.t) + '</span>') + (i < a.length - 1 ? '<span class="sep">' + A.ic('chevron-right-small', 16) + '</span>' : ''); }).join('') +
      '</div><button class="search topsearch" type="button" id="gsearch" aria-label="Search orders, customers and products">' + A.ic('magnifying-glass', 16) + '<span class="ph">Search orders, customers, products…</span><span class="kbd">Ctrl K</span></button><div class="tb-gap"></div><button class="btn icon" aria-label="Notifications" id="bell">' + A.ic('bell', 18) + '</button>' +
      '<a class="btn" href="../index.html" target="_blank" rel="noopener">View store</a></header>' +
      '<main class="page" id="page"></main></div>' +
      '<nav class="mtabs" aria-label="Main">' + mobileTabs(opts.active, role, counts) + '</nav></div>';

    var app = document.getElementById('app');
    function toggle() { app.classList.toggle('collapsed'); try { localStorage.setItem('elara.admin.collapsed', app.classList.contains('collapsed') ? '1' : '0'); } catch (e) {} }
    document.getElementById('collapseBtn').addEventListener('click', toggle);
    app.querySelector('.brand').addEventListener('click', function (e) { if (app.classList.contains('collapsed') && !e.target.closest('.collapse')) toggle(); });
    document.getElementById('userMore').addEventListener('click', function (e) { e.stopPropagation(); var p = document.getElementById('userPop'); p.hidden = !p.hidden; });
    document.getElementById('signOut').addEventListener('click', A.signOut);
    document.addEventListener('click', function () { var p = document.getElementById('userPop'); if (p) p.hidden = true; });
    document.getElementById('gsearch').addEventListener('click', function () { A.search(role); });
    document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); A.search(role); } });
    document.getElementById('bell').addEventListener('click', function (e) { e.stopPropagation(); A.bellPanel(role); });
    document.getElementById('navs').addEventListener('click', function (e) {
      var a = e.target.closest('[data-nav]'); if (!a) return;
      if (!BUILT[a.getAttribute('data-nav')]) { e.preventDefault(); A.toast(a.title + ' is the next page being built.'); }
    });

    // sidebar badges: orders waiting to be confirmed, reviews waiting for approval
    A.sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'placed').then(function (r) { setCount('orders', r.count); });
    if (role === 'owner') A.sb.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending').then(function (r) { setCount('reviews', r.count); });
    if (role === 'owner') A.sb.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'new').then(function (r) { setCount('messages', r.count); });
    function setCount(key, n) {
      counts[key] = n || 0;
      document.getElementById('navs').innerHTML = navHtml(opts.active, role, counts);
      var mt = document.querySelector('.mtabs'); if (mt) mt.innerHTML = mobileTabs(opts.active, role, counts);
    }
    document.getElementById('mbell').addEventListener('click', function (e) { e.stopPropagation(); A.bellPanel(role); });

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
    pop.innerHTML = items.map(function (i) {
      return (i.divider ? '<div class="pdiv"></div>' : '') + '<button data-v="' + A.esc(i.v) + '" class="' + (i.v === current ? 'on ' : '') + (i.danger ? 'danger' : '') + '">' +
        (i.icon ? '<span class="pic">' + A.ic(i.icon, 16) + '</span>' : '') + '<span class="plb">' + A.esc(i.l) + '</span>' + (i.v === current ? '<span class="pck">✓</span>' : '') + '</button>';
    }).join('');
    wrap.appendChild(pop);
    pop.addEventListener('click', function (e) { var bt = e.target.closest('button'); if (!bt) return; pop.remove(); onPick(bt.getAttribute('data-v')); });
    setTimeout(function () { document.addEventListener('click', function off() { pop.remove(); document.removeEventListener('click', off); }); });
  };

  /* Packing slip in a print window (used by the order page and the orders list menu) */
  A.printSlips = function (orders) {
    var w = window.open('', '_blank'); if (!w) { A.toast('Allow pop-ups to print the slips.', true); return; }
    var html = '<!doctype html><title>Packing slips</title><style>body{font:14px Inter,Arial,sans-serif;color:#1f2328;margin:0}.s{padding:32px;page-break-after:always}h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{padding:7px 0;border-bottom:1px solid #ddd;text-align:left}td:last-child,th:last-child{text-align:right}.m{color:#656a73}</style>';
    orders.forEach(function (o) {
      var addr = [o.address, o.upazila, o.district, o.division].filter(Boolean).join(', ');
      html += '<div class="s"><h1>ELARA · Packing slip</h1><p class="m">' + A.esc(o.id) + ' · ' + A.when(o.placed_at) + '</p><p><b>' + A.esc(o.customer_name) + '</b><br>' + A.esc(o.customer_phone) + '<br>' + A.esc(addr) + '</p>' +
        '<table><tr><th>Item</th><th>Qty</th><th>Price</th></tr>' + (o.order_items || []).map(function (i) { return '<tr><td>' + A.esc(i.name) + '<br><span class="m">' + A.esc([i.colour, i.size].filter(Boolean).join(' · ')) + '</span></td><td>' + i.qty + '</td><td>' + A.money(i.unit_price * i.qty) + '</td></tr>'; }).join('') + '</table>' +
        '<p style="text-align:right">Delivery ' + (o.delivery ? A.money(o.delivery) : 'Free') + ' · Discount ' + A.money(o.discount) + '<br><b>Total ' + A.money(o.total) + '</b></p>' +
        '<p class="m">' + (o.payment_method === 'cod' ? 'Collect cash on delivery: ' + A.money(o.total) : 'Paid by ' + A.esc(A.payName(o.payment_method)) + ' (' + o.payment_state + ')') + '</p></div>';
    });
    w.document.write(html); w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 300);
  };
  A.printSlip = function (o, items) {
    var w = window.open('', '_blank'); if (!w) { A.toast('Allow pop-ups to print the slip.', true); return; }
    var addr = [o.address, o.upazila, o.district, o.division].filter(Boolean).join(', ');
    w.document.write('<!doctype html><title>' + A.esc(o.id) + '</title><style>body{font:14px Inter,Arial,sans-serif;color:#1f2328;margin:32px}h1{font-size:22px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:8px 0;border-bottom:1px solid #ddd;text-align:left}td:last-child,th:last-child{text-align:right}.m{color:#656a73}</style>' +
      '<h1>ELARA · Packing slip</h1><p class="m">' + A.esc(o.id) + ' · ' + A.when(o.placed_at) + '</p>' +
      '<p><b>' + A.esc(o.customer_name) + '</b><br>' + A.esc(o.customer_phone) + '<br>' + A.esc(addr) + '</p>' +
      '<table><tr><th>Item</th><th>Qty</th><th>Price</th></tr>' + items.map(function (i) { return '<tr><td>' + A.esc(i.name) + '<br><span class="m">' + A.esc([i.colour, i.size].filter(Boolean).join(' · ')) + '</span></td><td>' + i.qty + '</td><td>' + A.money(i.unit_price * i.qty) + '</td></tr>'; }).join('') + '</table>' +
      '<p style="text-align:right">Subtotal ' + A.money(o.subtotal) + '<br>Delivery ' + (o.delivery ? A.money(o.delivery) : 'Free') + '<br>Discount ' + A.money(o.discount) + '<br><b>Total ' + A.money(o.total) + '</b></p>' +
      '<p class="m">' + (o.payment_method === 'cod' ? 'Collect cash on delivery: ' + A.money(o.total) : 'Paid by ' + A.esc(A.payName(o.payment_method)) + ' (' + o.payment_state + ')') + '</p>');
    w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 250);
  };

  /* ---------- global search (Ctrl/Cmd + K) ---------- */
  A.search = function (role) {
    if (document.querySelector('.gsearch')) return;
    var data = null;
    var close = A.modal('<div class="gsearch"><div class="gs-in">' + A.ic('magnifying-glass', 18) + '<input id="gsq" placeholder="Search orders, customers, products…" autocomplete="off"></div><div id="gsr" class="gs-res"><p class="gs-hint">Type an order number, a name, a phone number or a product.</p></div></div>', function (o) {
      o.querySelector('.dialog').classList.add('gs-dialog');
      var inp = o.querySelector('#gsq'); setTimeout(function () { inp.focus(); }, 30);
      var out = o.querySelector('#gsr');
      async function load() {
        var r = await Promise.all([
          A.sb.from('orders').select('id,customer_name,customer_phone,total,status').order('placed_at', { ascending: false }).limit(2000),
          role === 'owner' ? A.sb.from('products').select('id,name,status,price').limit(1000) : Promise.resolve({ data: [] })
        ]);
        data = { orders: r[0].data || [], products: r[1].data || [] };
      }
      var tm;
      inp.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(run, 120); });
      async function run() {
        var q = inp.value.trim().toLowerCase();
        if (!q) { out.innerHTML = '<p class="gs-hint">Type an order number, a name, a phone number or a product.</p>'; return; }
        if (!data) { out.innerHTML = '<p class="gs-hint">Searching…</p>'; await load(); }
        var digits = q.replace(/\D/g, '');
        var ords = data.orders.filter(function (x) { return (x.id + ' ' + x.customer_name).toLowerCase().indexOf(q) >= 0 || (digits.length >= 4 && x.customer_phone.replace(/\D/g, '').indexOf(digits) >= 0); }).slice(0, 6);
        var seen = {}, cust = [];
        data.orders.forEach(function (x) { if (!seen[x.customer_phone] && ((x.customer_name || '').toLowerCase().indexOf(q) >= 0 || (digits.length >= 4 && x.customer_phone.replace(/\D/g, '').indexOf(digits) >= 0))) { seen[x.customer_phone] = 1; cust.push(x); } });
        var prods = data.products.filter(function (p) { return (p.name + ' ' + p.id).toLowerCase().indexOf(q) >= 0; }).slice(0, 6);
        var html = '';
        if (ords.length) html += '<p class="gs-h">Orders</p>' + ords.map(function (x) { return '<a class="gs-r" href="order.html?id=' + encodeURIComponent(x.id) + '"><b>' + A.esc(x.id) + '</b><span>' + A.esc(x.customer_name) + '</span><em>' + A.money(x.total) + '</em></a>'; }).join('');
        if (role === 'owner' && cust.length) html += '<p class="gs-h">Customers</p>' + cust.slice(0, 5).map(function (x) { return '<a class="gs-r" href="customers.html?q=' + encodeURIComponent(x.customer_phone) + '"><b>' + A.esc(x.customer_name) + '</b><span>' + A.esc(x.customer_phone) + '</span></a>'; }).join('');
        if (prods.length) html += '<p class="gs-h">Products</p>' + prods.map(function (p) { return '<a class="gs-r" href="product.html?id=' + encodeURIComponent(p.id) + '"><b>' + A.esc(p.name) + '</b><span>' + (p.status === 'published' ? 'Live' : p.status) + '</span><em>' + A.money(p.price) + '</em></a>'; }).join('');
        out.innerHTML = html || '<p class="gs-hint">Nothing found for “' + A.esc(inp.value.trim()) + '”.</p>';
      }
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var a = out.querySelector('a.gs-r'); if (a) location.href = a.getAttribute('href'); } });
    });
    return close;
  };

  /* ---------- notifications panel (the bell) ---------- */
  A.bellPanel = async function (role) {
    var old = document.querySelector('.bellpanel'); if (old) { old.remove(); return; }
    var panel = document.createElement('div'); panel.className = 'bellpanel';
    panel.innerHTML = '<p class="bp-h">Needs your attention</p><div id="bpb"><p class="bp-e">Checking…</p></div>';
    document.body.appendChild(panel);
    setTimeout(function () { document.addEventListener('click', function off(ev) { if (!panel.contains(ev.target)) { panel.remove(); document.removeEventListener('click', off); } }); });
    var q = function (t, f) { var x = A.sb.from(t).select('id', { count: 'exact', head: true }); return f(x).then(function (r) { return r.count || 0; }); };
    var res = await Promise.all([
      q('orders', function (x) { return x.eq('status', 'placed'); }),
      q('orders', function (x) { return x.eq('payment_state', 'failed').in('status', ['placed', 'confirmed']); }),
      role === 'owner' ? q('reviews', function (x) { return x.eq('status', 'pending'); }) : Promise.resolve(0),
      role === 'owner' ? q('messages', function (x) { return x.eq('status', 'new'); }) : Promise.resolve(0),
      role === 'owner' ? A.sb.from('product_variants').select('stock,product_id').lte('stock', 5).then(function (r) { var s = {}; (r.data || []).forEach(function (v) { s[v.product_id] = 1; }); return Object.keys(s).length; }) : Promise.resolve(0)
    ]);
    var items = [[res[0], 'orders waiting to be confirmed', 'orders.html', 'b-bad'], [res[1], 'orders with a failed payment', 'orders.html', 'b-bad'], [res[2], 'reviews to approve', 'reviews.html', 'b-info'], [res[3], 'new messages', 'messages.html', 'b-info'], [res[4], 'products running low', 'products.html', 'b-warn']].filter(function (i) { return i[0] > 0; });
    panel.querySelector('#bpb').innerHTML = items.length ? items.map(function (i) { return '<a class="bp-r" href="' + i[2] + '"><span class="badge ' + i[3] + '">' + i[0] + '</span><span>' + i[1] + '</span>' + A.ic('chevron-right-small', 16) + '</a>'; }).join('') : '<p class="bp-e">You are all caught up.</p>';
  };
})();
