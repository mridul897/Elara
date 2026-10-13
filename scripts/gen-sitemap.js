// Rebuilds sitemap.xml with every published product. Run: node scripts/gen-sitemap.js   (then commit + push)
const fs = require('fs'), path = require('path');
const URL_ = 'https://sxwniigfrjzxryhuavev.supabase.co', KEY = 'sb_publishable_rAfRs-tHq_DNYBBqiNIOwA_AW1EauJs';
const SITE = 'https://elarabags.vercel.app';
(async () => {
  const r = await fetch(URL_ + '/rest/v1/products?select=id,updated_at&status=eq.published&order=position.asc&limit=1000', { headers: { apikey: KEY } });
  const rows = await r.json();
  if (!Array.isArray(rows)) throw new Error('Could not read products: ' + JSON.stringify(rows));
  const fixed = ['', 'my-plp-screen.html', 'my-plp-screen.html?category=tote', 'my-plp-screen.html?category=shoulder', 'my-plp-screen.html?category=crossbody', 'my-plp-screen.html?category=mini', 'my-plp-screen.html?category=travel-work', 'my-plp-screen.html?collection=new', 'my-plp-screen.html?collection=best', 'my-contact-screen.html', 'my-order-tracking.html'];
  const esc = (s) => s.replace(/&/g, '&amp;');
  const urls = fixed.map((p) => ({ loc: SITE + '/' + p, mod: null })).concat(rows.map((p) => ({ loc: SITE + '/my-product-detail-screen.html?p=' + encodeURIComponent(p.id), mod: (p.updated_at || '').slice(0, 10) })));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + esc(u.loc) + '</loc>' + (u.mod ? '<lastmod>' + u.mod + '</lastmod>' : '') + '</url>').join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), xml);
  console.log('sitemap.xml written with ' + urls.length + ' URLs');
})();
