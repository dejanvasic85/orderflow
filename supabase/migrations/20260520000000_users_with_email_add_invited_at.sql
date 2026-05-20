-- Expose invited_at (auth.users.invited_at) so the app can display
-- when an invite was last sent and allow admins to resend it.
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
  au.email_confirmed_at as invite_accepted_at,
  au.invited_at
from public.users u
join auth.users au on au.id = u.id
where
  public.current_user_role() in ('admin', 'staff')
  or u.id = auth.uid();

grant select on public.users_with_email to authenticated;
