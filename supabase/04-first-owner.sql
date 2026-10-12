-- Make YOUR login the owner. Do this AFTER you create your user:
--   Supabase > Authentication > Users > Add user > Create new user
--   (use your real email + a strong password, tick "Auto Confirm User")
-- Then replace the email below with the same one and Run.
update public.profiles
set role = 'owner', full_name = 'Mridul'
where id = (select id from auth.users where email = 'YOUR-EMAIL@example.com');

-- Check: should show one row with role = owner
select p.full_name, p.role, u.email from public.profiles p join auth.users u on u.id = p.id;
