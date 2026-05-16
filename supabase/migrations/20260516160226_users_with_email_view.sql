-- View runs as the view owner (postgres) so it can join auth.users.
-- Row-level scoping is baked into the WHERE clause to mirror the RLS
-- policies on public.users (admin/staff see all, user sees self only).
create or replace view public.users_with_email
with (security_invoker = false) as
select
  u.id,
  u.name,
  u.phone,
  u.active,
  u.role,
  u.notification_preferences,
  u.created_at,
  u.updated_at,
  au.email
from public.users u
join auth.users au on au.id = u.id
where
  public.current_user_role() in ('admin', 'staff')
  or u.id = auth.uid();

grant select on public.users_with_email to authenticated;
