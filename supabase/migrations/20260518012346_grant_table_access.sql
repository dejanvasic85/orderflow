-- Grant table-level access to the authenticated role.
-- RLS policies (already in place) control which rows are visible;
-- these grants control whether the role can touch the table at all.

grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.account_users to authenticated;
