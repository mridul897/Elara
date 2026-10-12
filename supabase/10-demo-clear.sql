-- Removes ONLY the demo data created by 09-demo-data.sql (orders tagged [DEMO], their customers, demo reviews).
begin;
delete from public.orders where internal_note like '[DEMO]%';
delete from public.customers where phone like '+88010000%';
delete from public.reviews where author like '%(demo)';
commit;
