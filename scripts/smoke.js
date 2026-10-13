// Quick health check of the live site: node scripts/smoke.js [https://elarabags.vercel.app]
const SITE = process.argv[2] || 'https://elarabags.vercel.app';
const URL_ = 'https://sxwniigfrjzxryhuavev.supabase.co', KEY = 'sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs';
const H = { apikey: KEY };
let fail = 0;
const ok = (name, pass, extra) => { console.log((pass ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!pass) fail++; };
(async () => {
  for (const p of ['', 'my-plp-screen.html', 'my-product-detail-screen.html?p=nafisa-tote', 'my-cart-screen.html', 'my-checkout-review.html', 'my-order-tracking.html', 'my-contact-screen.html', 'page.html?p=shipping', 'admin/index.html', 'admin/dashboard.html', 'assets/store-data.js', 'sitemap.xml']) {
    const r = await fetch(SITE + '/' + p); ok('page ' + (p || '/'), r.status === 200, String(r.status));
  }
  const prods = await (await fetch(URL_ + '/rest/v1/products?select=id,product_colours(id,card,photos)&status=eq.published&limit=1000', { headers: H })).json();
  ok('published products readable', Array.isArray(prods) && prods.length > 0, (prods.length || 0) + ' products');
  const noPhoto = prods.filter((p) => !(p.product_colours || []).some((c) => c.card || (c.photos || []).length));
  ok('every published product has a photo', noPhoto.length === 0, noPhoto.map((p) => p.id).join(', '));
  for (const t of ['orders', 'customers', 'promo_codes', 'messages', 'subscribers', 'error_log', 'rate_limits']) {
    const r = await fetch(URL_ + '/rest/v1/' + t + '?select=*&limit=1', { headers: H }); const j = await r.json();
    ok('private table closed to the public: ' + t, Array.isArray(j) && j.length === 0 || r.status === 401 || r.status === 404, r.status + '');
  }
  const bad = await fetch(URL_ + '/rest/v1/reviews', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: 'nafisa-tote', author: 'x', rating: 5, body: 'x', status: 'approved' }) });
  ok('public cannot write reviews directly', bad.status === 401 || bad.status === 403, String(bad.status));
  const promo = await (await fetch(URL_ + '/rest/v1/rpc/validate_promo', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: 'nope', p_subtotal: 1000 }) })).json();
  ok('promo check works', promo && promo.ok === false);
  console.log(fail ? '\n' + fail + ' check(s) failed' : '\nAll checks passed');
  process.exit(fail ? 1 : 0);
})();
