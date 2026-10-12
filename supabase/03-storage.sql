-- Product photo storage. Run after 01-schema.sql.
-- Public bucket: anyone can VIEW photos (the storefront needs that); only the owner can upload, replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "product images owner write" on storage.objects;
create policy "product images owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_owner());

drop policy if exists "product images owner update" on storage.objects;
create policy "product images owner update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_owner());

drop policy if exists "product images owner delete" on storage.objects;
create policy "product images owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_owner());
