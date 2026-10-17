-- ELARA: removes long dashes (em dash, en dash) from the text stored in the shop database.
-- Em dash becomes a comma; "1-3" written with an en dash becomes "1 to 3". Safe to run again.
-- Run in Supabase > SQL Editor. The store already hides these dashes while it shows the text,
-- this just cleans the stored copy so the admin panel shows the same words.
begin;

create or replace function pg_temp.cd(t text) returns text language sql immutable as $$
  select regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(t, '\s*' || chr(8212) || '\s*', ', ', 'g'),
               '(\d)\s*' || chr(8211) || '\s*(\d)', '\1 to \2', 'g'),
             '\s' || chr(8211) || '\s', ' to ', 'g'),
           chr(8211), '-', 'g')
$$;

update public.products set
  name = pg_temp.cd(name),
  eyebrow = pg_temp.cd(eyebrow),
  crumb = pg_temp.cd(crumb),
  description = pg_temp.cd(description),
  fits = pg_temp.cd(fits),
  care = pg_temp.cd(care),
  ship = pg_temp.cd(ship)
where name ~ '[–—]' or eyebrow ~ '[–—]' or crumb ~ '[–—]' or description ~ '[–—]'
   or fits ~ '[–—]' or care ~ '[–—]' or ship ~ '[–—]';

update public.product_colours set label = pg_temp.cd(label) where label ~ '[–—]';

update public.settings set value = pg_temp.cd(value::text)::jsonb where value::text ~ '[–—]';

commit;

-- check: both numbers should be 0
select
  (select count(*) from public.products where concat_ws(' ', name, eyebrow, crumb, description, fits, care, ship) ~ '[–—]') as products_left,
  (select count(*) from public.settings where value::text ~ '[–—]') as settings_left;
