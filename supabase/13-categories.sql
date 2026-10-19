-- ELARA: categories become their own table, managed from Admin > Categories.
-- Run in Supabase > SQL Editor. Safe to run again.
begin;

create table if not exists public.categories (
  id text primary key,                       -- the address word, e.g. tote  (set once, then fixed)
  name text not null,                        -- what customers see, e.g. Tote
  eyebrow text,                              -- small line above a bag's name, e.g. Tote Bags · Premium Leather
  position int not null default 0,           -- order in the store menu and the admin lists
  visible boolean not null default true,     -- hidden categories stay in the admin but leave the store menu
  created_at timestamptz not null default now(),
  constraint categories_id_format check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

insert into public.categories (id, name, eyebrow, position) values
  ('tote', 'Tote', 'Tote Bags · Premium Leather', 0),
  ('shoulder', 'Shoulder', 'Shoulder Bags · Premium Leather', 1),
  ('crossbody', 'Crossbody', 'Crossbody Bags · Premium Leather', 2),
  ('mini', 'Mini', 'Mini Bags · Premium Leather', 3),
  ('travel-work', 'Travel & Work', 'Travel & Work Bags · Premium Leather', 4)
on conflict (id) do nothing;

-- every product must belong to a real category; a category that still has bags cannot be deleted
insert into public.categories (id, name, eyebrow, position)
  select distinct p.cat, initcap(replace(p.cat, '-', ' ')), initcap(replace(p.cat, '-', ' ')) || ' Bags · Premium Leather', 100
  from public.products p where p.cat is not null and not exists (select 1 from public.categories c where c.id = p.cat)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_cat_fkey') then
    alter table public.products add constraint products_cat_fkey foreign key (cat) references public.categories(id) on update cascade on delete restrict;
  end if;
end $$;

alter table public.categories enable row level security;
drop policy if exists "public read categories" on public.categories;
drop policy if exists "owner manages categories" on public.categories;
create policy "public read categories" on public.categories for select using (visible or public.is_staff());
create policy "owner manages categories" on public.categories for all using (public.is_owner()) with check (public.is_owner());

commit;

-- check: lists the categories and how many bags each one holds
select c.position, c.id, c.name, c.visible, (select count(*) from public.products p where p.cat = c.id) as bags
from public.categories c order by c.position, c.name;
