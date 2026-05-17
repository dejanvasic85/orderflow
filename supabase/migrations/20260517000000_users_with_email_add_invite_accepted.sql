-- Expose invite_accepted_at (auth.users.email_confirmed_at) so the app can
-- distinguish pending-invite users from active ones without conflating it
-- with the admin-controlled `active` flag.
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
  au.email,
  au.email_confirmed_at as invite_accepted_at
from public.users u
join auth.users au on au.id = u.id
where
  public.current_user_role() in ('admin', 'staff')
  or u.id = auth.uid();

grant select on public.users_with_email to authenticated;
