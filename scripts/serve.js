#!/usr/bin/env node
// Serves dist/ the way Vercel will (redirects, rewrites, folder index pages, 404.html). For checking a build locally:
//   node scripts/build.js && node scripts/serve.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const compile = (src) => {
  const names = [];
  const re = new RegExp('^' + src.replace(/:(\w+)/g, (m, n) => { names.push(n); return '([^/]+)'; }) + '$');
  return (p) => { const m = re.exec(p); if (!m) return null; const o = {}; names.forEach((n, i) => { o[n] = m[i + 1]; }); return o; };
};
const fill = (dst, params) => dst.replace(/:(\w+)/g, (m, n) => (params[n] != null ? params[n] : m));

function handler(req, res) {
  const u = new URL(req.url, 'http://x');
  const p = decodeURIComponent(u.pathname);
  for (const r of cfg.redirects || []) {
    const m = compile(r.source)(p); if (!m) continue;
    let ok = true; const params = Object.assign({}, m);
    for (const h of r.has || []) {
      if (h.type !== 'query') continue;
      const v = u.searchParams.get(h.key); const mm = v == null ? null : new RegExp('^' + h.value + '$').exec(v);
      if (!mm) { ok = false; break; }
      Object.assign(params, mm.groups || {});
    }
    if (!ok) continue;
    res.writeHead(r.permanent ? 308 : 307, { Location: fill(r.destination, params) }); return res.end();
  }
  if (p.length > 1 && p.endsWith('/')) { res.writeHead(308, { Location: p.slice(0, -1) + u.search }); return res.end(); }
  const tryFile = (rel) => { const f = path.join(DIST, rel); return fs.existsSync(f) && fs.statSync(f).isFile() ? f : null; };
  let f = tryFile(p) || tryFile(path.join(p, 'index.html'));
  if (!f) for (const r of cfg.rewrites || []) { const m = compile(r.source)(p); if (m) { f = tryFile(fill(r.destination, m)); if (f) break; } }
  let status = 200;
  if (!f) { f = tryFile('404.html'); status = 404; }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(500); return res.end('error'); }
    res.writeHead(status, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); res.end(d);
  });
}
if (require.main === module) { const port = +process.argv[2] || 5830; http.createServer(handler).listen(port, () => console.log('serving dist/ at http://localhost:' + port)); }
module.exports = { handler };
