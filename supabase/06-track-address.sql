-- Order tracking also returns the delivery address and promo code so the storefront can show the full order.
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
    'items', items, 'events', ev);
end $$;
grant execute on function public.track_order(text, text) to anon, authenticated;
