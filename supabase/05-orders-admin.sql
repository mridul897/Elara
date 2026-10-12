-- Orders admin additions. Run once after 01..04. Safe to re-run.

-- 1. A reference for the payment (gateway transaction id, or a note the owner types after checking bKash/Nagad).
alter table public.orders add column if not exists payment_ref text;

-- 2. Staff may only move an order along (status, payment state, internal note, payment reference).
--    Totals, items and customer details are locked for everyone except the owner.
create or replace function public.orders_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_owner() then
    if new.id is distinct from old.id or new.subtotal is distinct from old.subtotal or new.discount is distinct from old.discount
       or new.delivery is distinct from old.delivery or new.total is distinct from old.total or new.customer_phone is distinct from old.customer_phone
       or new.customer_name is distinct from old.customer_name or new.payment_method is distinct from old.payment_method
       or new.address is distinct from old.address or new.placed_at is distinct from old.placed_at then
      raise exception 'Only the owner can change order amounts or customer details';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_guard_trg on public.orders;
create trigger orders_guard_trg before update on public.orders for each row execute function public.orders_guard();

-- 3. Cancelling or returning an order puts its items back in stock (once).
create or replace function public.orders_restock() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('cancelled','returned') and old.status not in ('cancelled','returned') then
    update public.product_variants v set stock = v.stock + i.qty
    from public.order_items i
    join public.product_colours c on c.product_id = i.product_id and c.label = i.colour
    where i.order_id = new.id and v.product_id = i.product_id and v.colour_id = c.id and v.size = i.size;
  end if;
  return new;
end $$;
drop trigger if exists orders_restock_trg on public.orders;
create trigger orders_restock_trg after update on public.orders for each row execute function public.orders_restock();
