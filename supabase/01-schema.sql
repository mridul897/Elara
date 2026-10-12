-- ELARA: database schema, security rules and server functions.
-- Run once in Supabase > SQL Editor > New query > paste > Run. Safe to re-run (uses IF NOT EXISTS / OR REPLACE).


-- ============================================================ people & roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','staff'));
$$;

-- New sign-ups get a staff profile with NO power until the owner promotes them (see 04-first-owner.sql).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'staff')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============================================================ catalogue
create table if not exists public.products (
  id text primary key,                       -- slug, e.g. nafisa-tote
  name text not null,
  cat text not null,                         -- tote | shoulder | crossbody | mini | travel-work
  eyebrow text,
  crumb text,
  price int not null check (price >= 0),     -- regular price in Tk.
  sale_price int check (sale_price is null or sale_price >= 0),
  sale_starts timestamptz,
  sale_ends timestamptz,
  badge text check (badge in ('new','best','off')),
  rating numeric(2,1) default 0,
  reviews_count int default 0,
  description text,
  dims int[],                                -- width, height, depth in cm
  fits text,
  care text,
  ship text,
  legacy text[] default '{}',
  extra jsonb default '{}'::jsonb,           -- anything the storefront keeps per product (nafisa / single flags)
  status text not null default 'published' check (status in ('published','draft','archived')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_colours (
  product_id text not null references public.products(id) on delete cascade,
  id text not null,                          -- camel, black ...
  label text not null,
  hex text,
  card text,                                 -- listing photo
  tile text,                                 -- swatch
  guide_bg text,
  photos jsonb not null default '[]'::jsonb, -- [{src, alt, contain}]
  slides jsonb not null default '[]'::jsonb, -- ["path", ...]
  position int not null default 0,
  primary key (product_id, id)
);

create table if not exists public.product_variants (
  product_id text not null,
  colour_id text not null,
  size text not null check (size in ('Small','Medium','Large')),
  stock int not null default 0 check (stock >= 0),
  primary key (product_id, colour_id, size),
  foreign key (product_id, colour_id) references public.product_colours(product_id, id) on delete cascade
);

-- ============================================================ promotions & settings
create table if not exists public.promo_codes (
  code text primary key,                     -- stored upper case
  label text,
  kind text not null check (kind in ('percent','fixed')),
  value int not null check (value > 0),
  min_order int not null default 0,
  usage_limit int,                           -- null = unlimited
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================ customers, orders
create table if not exists public.customers (
  phone text primary key,                    -- normalised +8801XXXXXXXXX
  name text,
  email text,
  created_at timestamptz not null default now()
);

create sequence if not exists public.order_seq start 315200;

create table if not exists public.orders (
  id text primary key,                       -- ELR-315200
  customer_phone text not null references public.customers(phone),
  customer_name text not null,
  email text,
  division text, district text, upazila text, address text,
  zone text not null check (zone in ('Dhaka','Outside Dhaka')),
  payment_method text not null check (payment_method in ('cod','bkash','nagad','card')),
  payment_state text not null default 'pending' check (payment_state in ('pending','paid','failed','refunded')),
  status text not null default 'placed' check (status in ('placed','confirmed','packed','shipped','delivered','cancelled','returned')),
  subtotal int not null,
  discount int not null default 0,
  delivery int not null default 0,
  total int not null,
  promo_code text,
  note text,                                 -- customer note
  internal_note text,                        -- staff note, never exposed to the storefront
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders(status, placed_at desc);
create index if not exists orders_phone_idx on public.orders(customer_phone);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  colour text, size text,
  img text,
  unit_price int not null,
  qty int not null check (qty > 0)
);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  kind text not null,                        -- status | payment | note | created
  from_value text, to_value text,
  actor uuid, actor_name text,
  at timestamptz not null default now()
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  product_id text not null references public.products(id) on delete cascade,
  author text not null,
  rating int not null check (rating between 1 and 5),
  body text,
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  actor uuid, actor_name text,
  action text not null,                      -- insert | update | delete
  entity text not null,
  entity_id text,
  detail jsonb,
  at timestamptz not null default now()
);

-- ============================================================ housekeeping triggers
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- Who changed what: product / promo / settings / order edits by signed-in staff land in activity_log.
create or replace function public.audit() returns trigger language plpgsql security definer set search_path = public as $$
declare who text; rid text;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  select full_name into who from public.profiles where id = auth.uid();
  rid := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'code', to_jsonb(new)->>'key', to_jsonb(old)->>'id', to_jsonb(old)->>'code', to_jsonb(old)->>'key');
  insert into public.activity_log (actor, actor_name, action, entity, entity_id, detail)
  values (auth.uid(), who, lower(tg_op), tg_table_name, rid,
          case when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)) else null end);
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['products','promo_codes','settings','orders','reviews'] loop
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit()', t, t);
  end loop;
end $$;

-- Order timeline: record status / payment changes made by staff.
create or replace function public.order_timeline() returns trigger language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select full_name into who from public.profiles where id = auth.uid();
  if new.status is distinct from old.status then
    insert into public.order_events (order_id, kind, from_value, to_value, actor, actor_name) values (new.id, 'status', old.status, new.status, auth.uid(), who);
  end if;
  if new.payment_state is distinct from old.payment_state then
    insert into public.order_events (order_id, kind, from_value, to_value, actor, actor_name) values (new.id, 'payment', old.payment_state, new.payment_state, auth.uid(), who);
  end if;
  return new;
end $$;
drop trigger if exists orders_timeline on public.orders;
create trigger orders_timeline after update on public.orders for each row execute function public.order_timeline();

-- ============================================================ row level security
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_colours enable row level security;
alter table public.product_variants enable row level security;
alter table public.promo_codes enable row level security;
alter table public.settings enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.reviews enable row level security;
alter table public.activity_log enable row level security;

-- Storefront (anonymous visitors): read published catalogue, settings and approved reviews. Nothing else.
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (status = 'published' or public.is_staff());
drop policy if exists "public read colours" on public.product_colours;
create policy "public read colours" on public.product_colours for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or public.is_staff())));
drop policy if exists "public read variants" on public.product_variants;
create policy "public read variants" on public.product_variants for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or public.is_staff())));
drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);
drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews" on public.reviews for select using (status = 'approved' or public.is_staff());
drop policy if exists "public submit review" on public.reviews;
create policy "public submit review" on public.reviews for insert with check (status = 'pending' and length(coalesce(body,'')) <= 1000);

-- Owner: full control of catalogue, promotions, settings, reviews.
do $$ declare t text; begin
  foreach t in array array['products','product_colours','product_variants','promo_codes','settings','reviews'] loop
    execute format('drop policy if exists "owner all %1$s" on public.%1$I', t);
    execute format('create policy "owner all %1$s" on public.%1$I for all using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
end $$;

-- Staff (and owner): orders queue. Staff can read orders and move status; they cannot touch prices or catalogue.
drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders for select using (public.is_staff());
drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders" on public.orders for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff read items" on public.order_items;
create policy "staff read items" on public.order_items for select using (public.is_staff());
drop policy if exists "staff read events" on public.order_events;
create policy "staff read events" on public.order_events for select using (public.is_staff());
drop policy if exists "owner read customers" on public.customers;
create policy "owner read customers" on public.customers for select using (public.is_staff());
drop policy if exists "owner read log" on public.activity_log;
create policy "owner read log" on public.activity_log for select using (public.is_owner());
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_owner());
drop policy if exists "owner manage profiles" on public.profiles;
create policy "owner manage profiles" on public.profiles for update using (public.is_owner()) with check (public.is_owner());

-- ============================================================ server functions the storefront calls
-- Effective price: sale price while the sale window is open.
create or replace function public.effective_price(p public.products) returns int
language sql stable as $$
  select case when p.sale_price is not null
               and (p.sale_starts is null or p.sale_starts <= now())
               and (p.sale_ends   is null or p.sale_ends   >= now())
              then p.sale_price else p.price end;
$$;

-- Check a promo code against a subtotal. Returns discount in Tk., or an error text.
create or replace function public.validate_promo(p_code text, p_subtotal int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c public.promo_codes; d int;
begin
  select * into c from public.promo_codes where code = upper(trim(p_code));
  if not found or not c.active then return jsonb_build_object('ok', false, 'error', 'That code is not valid.'); end if;
  if c.expires_at is not null and c.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'That code has expired.'); end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then return jsonb_build_object('ok', false, 'error', 'That code has been fully used.'); end if;
  if p_subtotal < c.min_order then return jsonb_build_object('ok', false, 'error', 'Spend Tk. ' || c.min_order || ' or more to use this code.'); end if;
  d := case c.kind when 'percent' then round(p_subtotal * c.value / 100.0) else least(c.value, p_subtotal) end;
  return jsonb_build_object('ok', true, 'code', c.code, 'label', coalesce(c.label, c.code), 'kind', c.kind, 'value', c.value, 'discount', d);
end $$;

-- Place an order. Prices, delivery and discount are recomputed here from the database; the browser's numbers are ignored.
-- p_order = { name, phone, email, division, district, upazila, address, zone, payment, note, promo,
--             items:[{ id, colour, size, qty }] }
create or replace function public.place_order(p_order jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  it jsonb; prod public.products; col public.product_colours; v public.product_variants;
  sub int := 0; unit int; q int; dlv int; disc int := 0; tot int; oid text; ph text; free_at int; dhaka_fee int; out_fee int;
  pr jsonb; pay text; zn text; cfg jsonb;
begin
  if jsonb_typeof(p_order->'items') <> 'array' or jsonb_array_length(p_order->'items') = 0 then
    return jsonb_build_object('ok', false, 'error', 'Your bag is empty.');
  end if;
  ph := regexp_replace(coalesce(p_order->>'phone',''), '[^0-9+]', '', 'g');
  if length(ph) < 10 then return jsonb_build_object('ok', false, 'error', 'Enter a valid phone number.'); end if;
  if coalesce(trim(p_order->>'name'),'') = '' then return jsonb_build_object('ok', false, 'error', 'Enter your name.'); end if;
  pay := p_order->>'payment';
  if pay not in ('cod','bkash','nagad','card') then return jsonb_build_object('ok', false, 'error', 'Choose a payment method.'); end if;
  zn := case when p_order->>'zone' = 'Dhaka' then 'Dhaka' else 'Outside Dhaka' end;

  -- first pass: price + stock check
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
          p_order->>'address', zn, pay, sub, disc, dlv, tot, nullif(pr->>'code',''), p_order->>'note');

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

-- Order tracking: needs BOTH the order number and the phone it was placed with.
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
    'total', o.total, 'subtotal', o.subtotal, 'discount', o.discount, 'delivery', o.delivery, 'zone', o.zone,
    'name', o.customer_name, 'placed_at', o.placed_at, 'items', items, 'events', ev);
end $$;

-- The storefront may call ONLY these three.
revoke all on function public.place_order(jsonb) from public;
revoke all on function public.track_order(text, text) from public;
revoke all on function public.validate_promo(text, int) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.validate_promo(text, int) to anon, authenticated;

-- ============================================================ starting settings & promo codes (the ones the storefront has today)
insert into public.settings (key, value) values
  ('delivery', '{"dhaka":60,"outside":120,"free_over":3000,"dhaka_days":"1–3","outside_days":"3–5"}'),
  ('announcement', '{"text":"Free delivery on orders over Tk. 3,000","active":true}'),
  ('contact', '{"whatsapp":"+880 1320575476","email":"hello@elara.com.bd"}')
on conflict (key) do nothing;

insert into public.promo_codes (code, label, kind, value) values
  ('MRIDUL13', 'Mridul13', 'percent', 5),
  ('WELCOME10', 'WELCOME10', 'percent', 10)
on conflict (code) do nothing;
