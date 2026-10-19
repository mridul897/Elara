-- ELARA: lets every signed-in admin (owner or staff) change their own display name from Admin > Profile.
-- Only the name can change this way; role and email stay owner-controlled. Safe to run again.
create or replace function public.update_my_profile(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n text := btrim(coalesce(p_name, ''));
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'Please sign in again.'); end if;
  if length(n) < 2 or length(n) > 60 then return jsonb_build_object('ok', false, 'error', 'Use a name between 2 and 60 characters.'); end if;
  update public.profiles set full_name = n where id = auth.uid();
  if not found then return jsonb_build_object('ok', false, 'error', 'No profile found for this account.'); end if;
  return jsonb_build_object('ok', true, 'name', n);
end $$;
revoke all on function public.update_my_profile(text) from public, anon;
grant execute on function public.update_my_profile(text) to authenticated;

select 'ok' as update_my_profile_ready;
