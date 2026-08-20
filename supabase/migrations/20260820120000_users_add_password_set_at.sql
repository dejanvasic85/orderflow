-- Track actual password-set completion separately from invite_accepted_at.
--
-- invite_accepted_at mirrors auth.users.email_confirmed_at, which GoTrue sets
-- the moment an invite token is verified (clicking "Continue" on /auth/confirm),
-- not when the user finishes the set-password form. The Users list status badge
-- was reading invite_accepted_at as "has a usable password", so a user who
-- verified the invite click but never completed set-password showed as
-- "Active". See issue #294.

alter table public.users
  add column password_set_at timestamptz;

-- Backfill: for every user who has already accepted an invite up to now, we
-- have no way to know exactly when they finished set-password, so assume it
-- happened at invite acceptance. This only affects historical rows; going
-- forward password_set_at is set explicitly by the app when a password is
-- actually set (see setPassword.server.ts and users.repository.ts).
update public.users
set password_set_at = invite_accepted_at
where invite_accepted_at is not null;

create or replace view public.users_with_email
with (security_invoker = true) as
select
  id,
  name,
  phone,
  active,
  role,
  notification_preferences,
  created_at,
  updated_at,
  email,
  invite_accepted_at,
  invited_at,
  password_set_at
from public.users;

grant select on public.users_with_email to authenticated;
