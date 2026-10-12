-- Team list shows emails, reviews get a title, owners can remove a team member. Run once.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'staff', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

drop policy if exists "owner delete profiles" on public.profiles;
create policy "owner delete profiles" on public.profiles for delete using (public.is_owner() and id <> auth.uid());

alter table public.reviews add column if not exists title text;
