// Checks a finished build (dist/). Used by scripts/build.js; also:  node scripts/check.js
const fs = require('fs'), path = require('path');

async function run({ DIST, SITE, products, warn }) {
  warn = warn || (() => {});
  const problems = [];
  const walk = (dir, out = []) => { fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => { const p = path.join(dir, e.name); e.isDirectory() ? walk(p, out) : out.push(p); }); return out; };
  const all = walk(DIST);
  const rel = (f) => path.relative(DIST, f).replace(/\\/g, '/');
  const isPublic = (r) => !r.startsWith('admin/');
  const htmlFiles = all.filter((f) => f.endsWith('.html'));
  const exists = (u) => {          // does this site address lead to a file?
    const p = decodeURIComponent(u.split('#')[0].split('?')[0]);
    if (/^\/bags\/[^/]+$/.test(p)) return true;               // served by the bag pages or the fallback shell
    const f = path.join(DIST, p);
    return fs.existsSync(f) && (fs.statSync(f).isFile() || fs.existsSync(path.join(f, 'index.html')));
  };

  // no source maps, no dashes, no placeholder text, no leftover old addresses
  all.forEach((f) => {
    const r = rel(f);
    if (/\.map$/.test(r)) problems.push('source map file: ' + r);
    if (!/\.(html|js|css|xml|txt|json|webmanifest)$/.test(r)) return;
    const t = fs.readFileSync(f, 'utf8');
    if (/sourceMappingURL/.test(t)) problems.push('sourceMappingURL in ' + r);
    if (/[–—]/.test(t)) problems.push('em or en dash in ' + r + ' near: ' + (t.match(/.{0,30}[–—].{0,20}/) || [''])[0].replace(/\s+/g, ' '));
    if (/lorem ipsum|dolor sit amet/i.test(t)) problems.push('placeholder text in ' + r);
    if (isPublic(r) && /\.(html|js)$/.test(r) && r !== '404.html') {
      const m = t.match(/(?<![\w/.:-])(my-(plp-screen|product-detail-screen|contact-screen|cart-screen|checkout-review|payment|card-payment|order-success|order-tracking|account)|index-mobile|page|index)\.html/);
      if (m) problems.push('old address "' + m[0] + '" still in ' + r);
      const m2 = t.match(/elarabags\.vercel\.app\/(my-[a-z-]+|index-mobile|index|page)\.html/);
      if (m2) problems.push('old full address "' + m2[0] + '" still in ' + r);
    }
  });

  // each page
  const titles = new Map(), descs = new Map(), canon = new Map();
  htmlFiles.filter((f) => isPublic(rel(f))).forEach((f) => {
    const r = rel(f), html = fs.readFileSync(f, 'utf8');
    const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
    const get = (re) => { const m = re.exec(html); return m ? m[1] : null; };
    const title = get(/<title>([^<]*)<\/title>/), desc = get(/<meta name="description" content="([^"]*)"/), can = get(/<link rel="canonical" href="([^"]*)"/);
    if (!title) problems.push('no <title> in ' + r);
    if (!desc) problems.push('no meta description in ' + r);
    if ((html.match(/<title>/g) || []).length > 1) problems.push('more than one <title> in ' + r);
    if (!/rel="icon"/.test(html)) problems.push('no favicon link in ' + r);
    if (!/property="og:image"/.test(html)) problems.push('no share image (og:image) in ' + r);
    if (!/name="twitter:card"/.test(html)) problems.push('no twitter:card in ' + r);
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    if (!noindex && h1 !== 1) problems.push(h1 + ' <h1> in indexable page ' + r);
    if (noindex && h1 > 1) problems.push(h1 + ' <h1> in ' + r);
    // every <img> needs an alt attribute
    (html.match(/<img\b[^>]*>/g) || []).forEach((i) => { if (!/\balt=/.test(i)) problems.push('image without alt in ' + r + ': ' + i.slice(0, 90)); });
    // structured data must be valid JSON
    (html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []).forEach((s) => { try { JSON.parse(s.replace(/^<script[^>]*>|<\/script>$/g, '')); } catch (e) { problems.push('invalid JSON-LD in ' + r); } });
    // a page that names another page as its canonical (the phone version of the home page) is an alias
    const own = SITE + (r === 'index.html' ? '/' : '/' + r.replace(/\/index\.html$/, ''));
    const alias = !!can && can !== own;
    if (!noindex) {
      if (!can) problems.push('no canonical in indexable page ' + r);
      if (title && !alias) { if (titles.has(title)) problems.push('duplicate title "' + title + '" in ' + r + ' and ' + titles.get(title)); titles.set(title, r); if (title.length > 75) warn('long title (' + title.length + ') in ' + r); }
      if (desc && !alias) { if (descs.has(desc)) problems.push('duplicate description in ' + r + ' and ' + descs.get(desc)); descs.set(desc, r); if (desc.length > 165) warn('long description (' + desc.length + ') in ' + r); if (desc.length < 50) warn('short description in ' + r); }
      if (can && !alias) { if (canon.has(can)) problems.push('duplicate canonical ' + can + ' in ' + r + ' and ' + canon.get(can)); canon.set(can, r); }
    }
    // links and files the page points at (relative ones resolve from the site root: bag pages set <base href="/">)
    (html.match(/\b(?:href|src)="([^"]+)"/g) || []).forEach((a) => {
      let u = a.replace(/^[a-z]+="|"$/g, '');
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(u) || /[{}$'+\\]/.test(u)) return;
      if (!u.startsWith('/')) u = '/' + u;
      if (!exists(u)) problems.push('broken link or file ' + u + ' in ' + r);
    });
  });

  // sitemap + robots
  const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  locs.forEach((l) => { if (!l.startsWith(SITE)) problems.push('sitemap url off-site: ' + l); else if (!exists(l.slice(SITE.length) || '/')) problems.push('sitemap url has no page: ' + l); });
  if (!/Sitemap: /.test(fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8'))) problems.push('robots.txt has no Sitemap line');
  if (products) products.forEach((p) => { if (!fs.existsSync(path.join(DIST, 'bags', p.id, 'index.html'))) problems.push('no page for bag ' + p.id); });
  if (!fs.existsSync(path.join(DIST, '404.html'))) problems.push('no 404.html');
  return problems;
}
module.exports = { run };
if (require.main === module) {
  const DIST = path.join(__dirname, '..', 'dist');
  run({ DIST, SITE: 'https://elarabags.vercel.app', warn: (m) => console.warn('warning: ' + m) }).then((p) => { p.forEach((x) => console.error('- ' + x)); console.log(p.length ? p.length + ' problem(s)' : 'all checks passed'); process.exit(p.length ? 1 : 0); });
}
