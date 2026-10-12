-- Promo codes can start on a future date (the "Starts 20 Oct" state in the admin). Run once.
alter table public.promo_codes add column if not exists starts_at timestamptz;

create or replace function public.validate_promo(p_code text, p_subtotal int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c public.promo_codes; d int;
begin
  select * into c from public.promo_codes where code = upper(trim(p_code));
  if not found or not c.active then return jsonb_build_object('ok', false, 'error', 'That code is not valid.'); end if;
  if c.starts_at is not null and c.starts_at > now() then return jsonb_build_object('ok', false, 'error', 'That code is not active yet.'); end if;
  if c.expires_at is not null and c.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'That code has expired.'); end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then return jsonb_build_object('ok', false, 'error', 'That code has been fully used.'); end if;
  if p_subtotal < c.min_order then return jsonb_build_object('ok', false, 'error', 'Spend Tk. ' || c.min_order || ' or more to use this code.'); end if;
  d := case c.kind when 'percent' then round(p_subtotal * c.value / 100.0) else least(c.value, p_subtotal) end;
  return jsonb_build_object('ok', true, 'code', c.code, 'label', coalesce(c.label, c.code), 'kind', c.kind, 'value', c.value, 'discount', d);
end $$;
grant execute on function public.validate_promo(text, int) to anon, authenticated;
