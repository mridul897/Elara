// Generates 09-demo-data.sql and 10-demo-clear.sql. Run: node supabase/gen-demo.js
// Demo orders are tagged with internal_note "[DEMO]" and customer phones +88010000xxxxx so they can be removed with one script.
const fs = require('fs'), path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'assets', 'products.js'));
const P = window.ELARA_PRODUCTS;
const q = (s) => s == null ? 'null' : "'" + String(s).replace(/'/g, "''") + "'";
let seed = 20261012;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const w = (pairs) => { let t = 0; pairs.forEach((p) => (t += p[1])); let r = rnd() * t; for (const [v, n] of pairs) { if ((r -= n) <= 0) return v; } return pairs[0][0]; };

const NAMES = ['Nusrat Jahan', 'Farzana Akter', 'Tahmina Rahman', 'Israt Jahan', 'Sumaiya Akter', 'Rima Sultana', 'Nabila Karim', 'Shamima Nasrin', 'Aisha Khan', 'Tasnim Hossain', 'Mim Chowdhury', 'Sadia Islam', 'Lamia Ahmed', 'Priya Das', 'Jannat Ara', 'Fariha Tabassum', 'Ritu Barua', 'Mehzabin Noor', 'Anika Tahsin', 'Shirin Sultana', 'Nadia Rahman', 'Sharmin Akter', 'Kazi Maliha', 'Oishi Roy', 'Taslima Begum'];
const PLACES = [
  ['Dhaka', 'Dhaka', 'Dhanmondi'], ['Dhaka', 'Dhaka', 'Gulshan'], ['Dhaka', 'Dhaka', 'Mirpur'], ['Dhaka', 'Dhaka', 'Uttara'], ['Dhaka', 'Dhaka', 'Mohammadpur'], ['Dhaka', 'Dhaka', 'Badda'],
  ['Chattogram', 'Chattogram', 'Pahartali'], ['Sylhet', 'Sylhet', 'Zindabazar'], ['Rajshahi', 'Rajshahi', 'Boalia'], ['Khulna', 'Khulna', 'Sonadanga'], ['Dhaka', 'Gazipur', 'Tongi']];
const customers = NAMES.map((name, i) => ({ name, phone: '+88010000' + String(10000 + i * 137).slice(-5), email: i % 3 === 0 ? name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com' : null, place: i < 17 ? PLACES[i % 6] : pick(PLACES) }));

const N = 78, orders = [];
for (let n = 0; n < N; n++) {
  // spread over 50 days, more orders on recent days; ids descend with age
  const ageH = Math.floor(Math.pow(rnd(), 2.4) * 50 * 24);
  const c = customers[Math.floor(Math.pow(rnd(), 1.3) * customers.length)];
  const lines = [];
  const nl = w([[1, 60], [2, 30], [3, 10]]);
  for (let k = 0; k < nl; k++) {
    const p = pick(P.slice(0, 40)), col = pick(p.colours), size = pick(['Small', 'Medium', 'Medium', 'Large']);
    lines.push({ id: p.id, name: p.name, colour: col.label, size, img: col.card, price: p.price, qty: w([[1, 85], [2, 15]]) });
  }
  const sub = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const zone = c.place[1] === 'Dhaka' ? 'Dhaka' : 'Outside Dhaka';
  const del = sub >= 3000 ? 0 : zone === 'Dhaka' ? 60 : 120;
  const promo = rnd() < 0.18 ? 'WELCOME10' : null, disc = promo ? Math.round(sub * 0.1) : 0;
  const method = w([['cod', 55], ['bkash', 25], ['nagad', 10], ['card', 10]]);
  let status;
  if (ageH < 10) status = 'placed';
  else if (ageH < 30) status = w([['placed', 40], ['confirmed', 60]]);
  else if (ageH < 72) status = w([['confirmed', 45], ['packed', 55]]);
  else if (ageH < 120) status = w([['shipped', 85], ['delivered', 15]]);
  else status = w([["delivered", 93], ["cancelled", 5], ["returned", 2]]);
  let pay = method === 'cod' ? (status === 'delivered' ? 'paid' : 'pending') : 'paid';
  if (method !== 'cod' && ageH < 40 && rnd() < 0.12) { pay = 'failed'; status = 'placed'; }
  if ((status === 'cancelled' || status === 'returned') && method !== 'cod') pay = 'refunded';
  if (status === 'cancelled' && method === 'cod') pay = 'pending';
  orders.push({ id: 'ELR-' + (314900 + N - n), c, ageH, lines, sub, del, disc, promo, zone, total: sub - disc + del, method, status, pay });
}
orders.sort((a, b) => a.ageH - b.ageH);

const sql = [];
sql.push('-- DEMO DATA so the dashboard has something to show. Safe to run once; remove everything with 10-demo-clear.sql.');
sql.push('begin;');
customers.forEach((c) => sql.push(`insert into public.customers (phone, name, email) values (${q(c.phone)}, ${q(c.name)}, ${q(c.email)}) on conflict (phone) do nothing;`));
orders.forEach((o) => {
  const [div, dis, up] = o.c.place;
  sql.push(`insert into public.orders (id, customer_phone, customer_name, email, division, district, upazila, address, zone, payment_method, payment_state, status, subtotal, discount, delivery, total, promo_code, internal_note, placed_at) values (` +
    [q(o.id), q(o.c.phone), q(o.c.name), q(o.c.email), q(div), q(dis), q(up), q('House ' + (10 + (o.ageH % 40)) + ', Road ' + (1 + (o.ageH % 12))), q(o.zone), q(o.method), q(o.pay), q(o.status), o.sub, o.disc, o.del, o.total, q(o.promo), q('[DEMO] sample order'), `now() - interval '${o.ageH} hours'`].join(',') + ') on conflict (id) do nothing;');
  o.lines.forEach((l) => sql.push(`insert into public.order_items (order_id, product_id, name, colour, size, img, unit_price, qty) values (${q(o.id)}, ${q(l.id)}, ${q(l.name)}, ${q(l.colour)}, ${q(l.size)}, ${q(l.img)}, ${l.price}, ${l.qty});`));
  const ev = [['created', null, 'placed', 0]];
  const chain = ['confirmed', 'packed', 'shipped', 'delivered'], idx = chain.indexOf(o.status);
  if (o.status === 'cancelled') ev.push(['status', 'placed', 'cancelled', 90]);
  else if (o.status === 'returned') { ['confirmed', 'packed', 'shipped', 'delivered'].forEach((s, i) => ev.push(['status', null, s, [25, 240, 1500, 2900][i]])); ev.push(['status', 'delivered', 'returned', 4500]); }
  else if (idx >= 0) for (let i = 0; i <= idx; i++) ev.push(['status', i ? chain[i - 1] : 'placed', chain[i], [25, 240, 1500, 2900][i]]);
  if (o.pay === 'paid' && o.method !== 'cod') ev.push(['payment', 'pending', 'paid', 3]);
  ev.forEach((e) => {
    const t = Math.max(0, o.ageH * 60 - e[3]); // minutes ago, never in the future
    sql.push(`insert into public.order_events (order_id, kind, from_value, to_value, actor_name, at) values (${q(o.id)}, ${q(e[0])}, ${q(e[1])}, ${q(e[2])}, ${q(e[0] === 'created' ? null : 'Mridul')}, now() - interval '${t} minutes');`);
  });
});
// pending reviews: visible in Admin > Reviews, never on the store
[['nafisa-tote', 'Aisha K. (demo)', 5, 'Exactly as pictured', 'No surprises, it looks just like the photos. The zip runs smoothly and the lining is clean.'],
 ['kors-gilly-shoulder', 'Rima S. (demo)', 3, 'Handle felt stiff', 'Nice leather but the strap is stiff and shorter than I expected. Delivery was fast though.'],
 ['coach-crossbody', 'Tasnim H. (demo)', 5, 'Perfect gift', 'Bought it for my sister and she loved it. Neatly packed.']
].forEach((r) => sql.push(`insert into public.reviews (product_id, author, rating, title, body, status) values (${q(r[0])}, ${q(r[1])}, ${r[2]}, ${q(r[3])}, ${q(r[4])}, 'pending');`));
sql.push('commit;');
fs.writeFileSync(path.join(__dirname, '09-demo-data.sql'), sql.join('\n') + '\n');

fs.writeFileSync(path.join(__dirname, '10-demo-clear.sql'), `-- Removes ONLY the demo data created by 09-demo-data.sql (orders tagged [DEMO], their customers, demo reviews).
begin;
delete from public.orders where internal_note like '[DEMO]%';
delete from public.customers where phone like '+88010000%';
delete from public.reviews where author like '%(demo)';
commit;
`);
const rev = orders.filter((o) => !['cancelled', 'returned'].includes(o.status) && o.pay !== 'failed' && o.pay !== 'refunded').reduce((s, o) => s + o.total, 0);
console.log('orders', orders.length, 'customers', customers.length, 'revenue', rev, 'statements', sql.length);
