-- Grant DML access to service_role on all public tables.
-- The service_role key (used by the admin client) bypasses RLS but still
-- requires table-level grants. Previously only 'authenticated' was granted.
grant select, insert, update, delete on public.account_users to service_role;
grant select, insert, update, delete on public.accounts to service_role;
grant select, insert, update, delete on public.order_request_items to service_role;
grant select, insert, update, delete on public.order_requests to service_role;
grant select, insert, update, delete on public.products to service_role;
grant select, insert, update, delete on public.template_items to service_role;
grant select, insert, update, delete on public.templates to service_role;
grant select, insert, update, delete on public.users to service_role;
