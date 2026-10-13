-- ELARA: launch-readiness additions. Run once after 01..08. Safe to re-run.
--  * contact messages, newsletter / "notify me" emails, error log
--  * spam / bot protection: simple per-connection rate limits on every public action
--  * the welcome code works once per phone number (checked on the server)
--  * courier + tracking number on an order
--  * draft texts for the policy pages (hidden until the owner publishes them)

-- ============================================================ rate limiting
create table if not exists public.rate_limits (bucket text not null, at timestamptz not null default now());
create index if not exists rate_limits_idx on public.rate_limits (bucket, at);
alter table public.rate_limits enable row level security;

create or replace function public.client_ip() returns text language sql stable as $$
  select coalesce(nullif(trim(split_part(coalesce((nullif(current_setting('request.headers', true), '')::json)->>'x-forwarded-for', ''), ',', 1)), ''), 'unknown');
$$;

create or replace function public.rate_ok(p_bucket text, p_limit int, p_window interval)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.rate_limits where at < now() - interval '1 day';
  select count(*) into n from public.rate_limits where bucket = p_bucket and at > now() - p_window;
  if n >= p_limit then return false; end if;
  insert into public.rate_limits (bucket) values (p_bucket);
  return true;
end $$;
revoke all on function public.rate_ok(text, int, interval) from public;

-- ============================================================ messages, subscribers, error log
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null, phone text, email text, subject text, body text not null,
  status text not null default 'new' check (status in ('new','read','done')),
  created_at timestamptz not null default now()
);
create table if not exists public.subscribers (
  email text primary key, source text, created_at timestamptz not null default now()
);
create table if not exists public.error_log (
  id bigint generated always as identity primary key,
  message text, url text, ua text, at timestamptz not null default now()
);
alter table public.messages enable row level security;
alter table public.subscribers enable row level security;
alter table public.error_log enable row level security;

drop policy if exists "staff read messages" on public.messages;
create policy "staff read messages" on public.messages for select using (public.is_staff());
drop policy if exists "staff update messages" on public.messages;
create policy "staff update messages" on public.messages for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "owner delete messages" on public.messages;
create policy "owner delete messages" on public.messages for delete using (public.is_owner());
drop policy if exists "owner read subscribers" on public.subscribers;
create policy "owner read subscribers" on public.subscribers for select using (public.is_owner());
drop policy if exists "owner delete subscribers" on public.subscribers;
create policy "owner delete subscribers" on public.subscribers for delete using (public.is_owner());
drop policy if exists "owner read errors" on public.error_log;
create policy "owner read errors" on public.error_log for select using (public.is_owner());
drop policy if exists "owner delete errors" on public.error_log;
create policy "owner delete errors" on public.error_log for delete using (public.is_owner());

-- ============================================================ public actions (all rate limited)
create or replace function public.send_message(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare nm text := trim(coalesce(p->>'name','')); bd text := trim(coalesce(p->>'body',''));
begin
  if coalesce(p->>'website','') <> '' then return jsonb_build_object('ok', true); end if;   -- hidden field only bots fill
  if length(nm) < 2 or length(bd) < 5 then return jsonb_build_object('ok', false, 'error', 'Please add your name and a message.'); end if;
  if not public.rate_ok('msg:' || public.client_ip(), 5, interval '1 hour') then
    return jsonb_build_object('ok', false, 'error', 'Too many messages from this connection. Please try again in an hour or use WhatsApp.');
  end if;
  insert into public.messages (name, phone, email, subject, body)
  values (left(nm, 80), left(nullif(trim(coalesce(p->>'phone','')), ''), 30), left(nullif(trim(coalesce(p->>'email','')), ''), 120),
          left(nullif(trim(coalesce(p->>'subject','')), ''), 120), left(bd, 2000));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.subscribe(p_email text, p_source text default 'site') returns jsonb
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if e !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' or length(e) > 120 then return jsonb_build_object('ok', false, 'error', 'Please enter a valid e-mail address.'); end if;
  if not public.rate_ok('sub:' || public.client_ip(), 10, interval '1 hour') then return jsonb_build_object('ok', false, 'error', 'Please try again later.'); end if;
  insert into public.subscribers (email, source) values (e, left(coalesce(p_source, 'site'), 60)) on conflict (email) do nothing;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.submit_review(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r int; au text := trim(coalesce(p->>'author','')); bd text := trim(coalesce(p->>'body',''));
begin
  if coalesce(p->>'website','') <> '' then return jsonb_build_object('ok', true); end if;
  begin r := (p->>'rating')::int; exception when others then r := 0; end;
  if r < 1 or r > 5 or length(au) < 2 or length(bd) < 10 or length(bd) > 1000 then return jsonb_build_object('ok', false, 'error', 'Please add a rating, your name and a review.'); end if;
  if not exists (select 1 from public.products where id = p->>'product_id' and status = 'published') then return jsonb_build_object('ok', false, 'error', 'That bag is not available.'); end if;
  if not public.rate_ok('rev:' || public.client_ip(), 5, interval '1 hour') then return jsonb_build_object('ok', false, 'error', 'Too many reviews from this connection. Please try again later.'); end if;
  insert into public.reviews (product_id, author, rating, title, body, status)
  values (p->>'product_id', left(au, 60), r, left(nullif(trim(coalesce(p->>'title','')), ''), 120), bd, 'pending');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.log_error(p_message text, p_url text, p_ua text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.rate_ok('err:' || public.client_ip(), 20, interval '1 hour') then return; end if;
  insert into public.error_log (message, url, ua) values (left(p_message, 500), left(p_url, 300), left(p_ua, 200));
end $$;

-- direct inserts are closed; reviews now go through submit_review
drop policy if exists "public submit review" on public.reviews;

grant execute on function public.send_message(jsonb) to anon, authenticated;
grant execute on function public.subscribe(text, text) to anon, authenticated;
grant execute on function public.submit_review(jsonb) to anon, authenticated;
grant execute on function public.log_error(text, text, text) to anon, authenticated;

-- ============================================================ order columns and the welcome code rule
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists tracking_no text;
alter table public.promo_codes add column if not exists once_per_phone boolean not null default false;
update public.promo_codes set once_per_phone = true where code = 'WELCOME10';

-- place_order: same as before + bot checks (5 orders / hour / connection and / phone for the public store), welcome code once per phone
create or replace function public.place_order(p_order jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  it jsonb; prod public.products; col public.product_colours; v public.product_variants; pc public.promo_codes;
  sub int := 0; q int; dlv int; disc int := 0; tot int; oid text; ph text; free_at int; dhaka_fee int; out_fee int;
  pr jsonb; pay text; zn text; cfg jsonb;
begin
  if coalesce(p_order->>'website','') <> '' then return jsonb_build_object('ok', false, 'error', 'Something went wrong. Please try again.'); end if;   -- honeypot
  if jsonb_typeof(p_order->'items') <> 'array' or jsonb_array_length(p_order->'items') = 0 then
    return jsonb_build_object('ok', false, 'error', 'Your bag is empty.');
  end if;
  ph := regexp_replace(coalesce(p_order->>'phone',''), '[^0-9+]', '', 'g');
  if length(ph) < 10 then return jsonb_build_object('ok', false, 'error', 'Enter a valid phone number.'); end if;
  if coalesce(trim(p_order->>'name'),'') = '' then return jsonb_build_object('ok', false, 'error', 'Enter your name.'); end if;
  pay := p_order->>'payment';
  if pay not in ('cod','bkash','nagad','card') then return jsonb_build_object('ok', false, 'error', 'Choose a payment method.'); end if;
  zn := case when p_order->>'zone' = 'Dhaka' then 'Dhaka' else 'Outside Dhaka' end;

  -- the owner/staff (signed in) can enter many orders; the public store is limited
  if auth.uid() is null then
    if not public.rate_ok('ord:' || public.client_ip(), 5, interval '1 hour') or not public.rate_ok('ordph:' || right(ph, 10), 5, interval '1 hour') then
      return jsonb_build_object('ok', false, 'error', 'Too many orders from this connection in the last hour. Please try again later or order on WhatsApp.');
    end if;
  end if;

  for it in select * from jsonb_array_elements(p_order->'items') loop
    q := greatest(1, least(10, coalesce((it->>'qty')::int, 1)));
    select * into prod from public.products where id = it->>'id' and status = 'published';
    if not found then return jsonb_build_object('ok', false, 'error', 'A bag in your order is no longer available.'); end if;
    select * into v from public.product_variants where product_id = prod.id and colour_id = it->>'colour' and size = it->>'size' for update;
    if not found or v.stock < q then
      return jsonb_build_object('ok', false, 'error', prod.name || ' (' || coalesce(it->>'colour','') || ', ' || coalesce(it->>'size','') || ') is out of stock.');
    end if;
    sub := sub + public.effective_price(prod) * q;
  end loop;

  select value into cfg from public.settings where key = 'delivery';
  free_at   := coalesce((cfg->>'free_over')::int, 3000);
  dhaka_fee := coalesce((cfg->>'dhaka')::int, 60);
  out_fee   := coalesce((cfg->>'outside')::int, 120);
  dlv := case when sub >= free_at then 0 when zn = 'Dhaka' then dhaka_fee else out_fee end;

  if coalesce(p_order->>'promo','') <> '' then
    pr := public.validate_promo(p_order->>'promo', sub);
    if (pr->>'ok')::boolean then
      select * into pc from public.promo_codes where code = pr->>'code';
      if pc.once_per_phone and exists (select 1 from public.orders o where right(o.customer_phone, 10) = right(ph, 10) and o.promo_code = pc.code and o.status not in ('cancelled','returned')) then
        return jsonb_build_object('ok', false, 'error', 'The code ' || pc.code || ' has already been used with this phone number. Remove it to continue.');
      end if;
      disc := (pr->>'discount')::int;
      update public.promo_codes set used_count = used_count + 1 where code = pr->>'code';
    end if;
  end if;
  tot := sub - disc + dlv;

  insert into public.customers (phone, name, email) values (ph, p_order->>'name', p_order->>'email')
  on conflict (phone) do update set name = excluded.name, email = coalesce(excluded.email, public.customers.email);

  oid := 'ELR-' || nextval('public.order_seq');
  insert into public.orders (id, customer_phone, customer_name, email, division, district, upazila, address, zone, payment_method,
                             subtotal, discount, delivery, total, promo_code, note)
  values (oid, ph, p_order->>'name', p_order->>'email', p_order->>'division', p_order->>'district', p_order->>'upazila',
          p_order->>'address', zn, pay, sub, disc, dlv, tot, case when disc > 0 then pr->>'code' end, p_order->>'note');

  for it in select * from jsonb_array_elements(p_order->'items') loop
    q := greatest(1, least(10, coalesce((it->>'qty')::int, 1)));
    select * into prod from public.products where id = it->>'id';
    select * into col from public.product_colours where product_id = prod.id and id = it->>'colour';
    insert into public.order_items (order_id, product_id, name, colour, size, img, unit_price, qty)
    values (oid, prod.id, prod.name, col.label, it->>'size', col.card, public.effective_price(prod), q);
    update public.product_variants set stock = stock - q where product_id = prod.id and colour_id = it->>'colour' and size = it->>'size';
  end loop;

  insert into public.order_events (order_id, kind, to_value) values (oid, 'created', 'placed');
  return jsonb_build_object('ok', true, 'id', oid, 'subtotal', sub, 'discount', disc, 'delivery', dlv, 'total', tot, 'payment', pay);
end $$;

-- track_order: also returns the courier and tracking number
create or replace function public.track_order(p_id text, p_phone text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare o public.orders; items jsonb; ev jsonb; ph text;
begin
  ph := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
  select * into o from public.orders where id = upper(trim(p_id)) and right(customer_phone, 10) = right(ph, 10);
  if not found then return jsonb_build_object('ok', false); end if;
  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'colour', colour, 'size', size, 'img', img, 'price', unit_price, 'qty', qty)), '[]'::jsonb)
    into items from public.order_items where order_id = o.id;
  select coalesce(jsonb_agg(jsonb_build_object('kind', kind, 'to', to_value, 'at', at) order by at), '[]'::jsonb)
    into ev from public.order_events where order_id = o.id;
  return jsonb_build_object('ok', true, 'id', o.id, 'status', o.status, 'payment_state', o.payment_state, 'payment', o.payment_method,
    'total', o.total, 'subtotal', o.subtotal, 'discount', o.discount, 'delivery', o.delivery, 'zone', o.zone, 'promo', o.promo_code,
    'name', o.customer_name, 'phone', o.customer_phone, 'placed_at', o.placed_at,
    'division', o.division, 'district', o.district, 'upazila', o.upazila, 'address', o.address,
    'courier', o.courier, 'tracking_no', o.tracking_no, 'items', items, 'events', ev);
end $$;

-- ============================================================ policy page drafts (hidden until the owner publishes them)
insert into public.settings (key, value) values
('page_shipping', jsonb_build_object('title','Shipping and delivery','status','draft','updated',now(),'body',
'We deliver across Bangladesh.

Dhaka: 1 to 3 working days, Tk. 60. Outside Dhaka: 3 to 5 working days, Tk. 120. Delivery is free on orders over Tk. 3,000.

After you order we confirm it with you by phone or WhatsApp, pack it with care and hand it to our delivery partner. You can follow your order any time on the Track order page with your order number and phone number.

Cash on delivery is available everywhere we deliver. Please keep the exact amount ready and check the bag with the delivery person present.')),
('page_returns', jsonb_build_object('title','Returns and exchange','status','draft','updated',now(),'body',
'We want you to be happy with your bag.

You can ask for an exchange within 7 days of delivery. The bag must be unused, with its tags and in its original packaging and dust bag. Message us on WhatsApp with your order number and a photo to start.

If the bag arrives damaged or is not what you ordered, tell us within 48 hours of delivery and we will fix it at no cost to you.

Exchanges are for another size, colour or bag. Delivery charges for an exchange requested by the customer are paid by the customer.')),
('page_story', jsonb_build_object('title','Our story','status','draft','updated',now(),'body',
'ELARA makes premium leather bags for the routine you actually have: work, weekend, and everything between.

Designed in Bangladesh, each bag is made with considered detail so it holds its shape and lasts. We keep our range small on purpose, and every colour is photographed on its own so that what you choose is what arrives.')),
('page_privacy', jsonb_build_object('title','Privacy policy','status','draft','updated',now(),'body',
'This page explains what information ELARA collects and how we use it.

What we collect: your name, phone number, delivery address and, if you give it, your e-mail address, together with what you order. If you contact us or write a review we keep that message too.

How we use it: to confirm, pack and deliver your order, to let you track it, to answer your questions and to improve the shop. We do not sell your information.

Who sees it: our small team and our delivery partner, only as much as is needed to deliver your order. Payment details for card, bKash and Nagad are handled by the payment provider and are not stored by us.

Your choices: you can ask us to correct or delete your information by messaging us on WhatsApp or e-mail.')),
('page_terms', jsonb_build_object('title','Terms of service','status','draft','updated',now(),'body',
'By ordering from ELARA you agree to these terms.

Prices are in Bangladeshi taka and include no hidden charges; delivery is shown before you confirm. We may cancel an order if a bag is out of stock or the details cannot be confirmed, and we will tell you and refund anything you have paid.

Delivery times are estimates. Returns and exchanges follow our Returns and exchange page.

Product photos are taken as close to the real colour as we can, but screens differ a little. ELARA is not liable for losses beyond the price of the order. These terms are governed by the laws of Bangladesh.'))
on conflict (key) do nothing;
