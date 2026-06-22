-- Stop public.users_with_email from joining auth.users.
--
-- The previous view ran with security_invoker = false (owner = postgres) so it
-- could read auth.users.email, and relied solely on a hand-written WHERE clause
-- for row scoping. Supabase flags this as `auth_users_exposed`: email is
-- reachable through the API with no RLS backstop.
--
-- Fix: denormalize the three auth.users-derived columns (email,
-- email_confirmed_at, invited_at) onto public.users, keep them synced via
-- triggers, then recreate the view as security_invoker = true so the caller's
-- RLS on public.users is the single source of truth. The view no longer
-- references auth.users at all.

-- 1. Denormalized columns on public.users
alter table public.users
  add column email text,
  add column invite_accepted_at timestamptz,
  add column invited_at timestamptz;

-- 2. Backfill from auth.users (one-time)
update public.users u
set
  email = au.email,
  invite_accepted_at = au.email_confirmed_at,
  invited_at = au.invited_at
from auth.users au
where au.id = u.id;

-- 3. Populate the columns when a new auth user is created.
--    Extends the existing insert trigger (initial_schema.sql) which already
--    runs as security definer and mirrors auth.users -> public.users.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, invite_accepted_at, invited_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.email_confirmed_at,
    new.invited_at
  )
  on conflict (id) do update set
    email = excluded.email,
    invite_accepted_at = excluded.invite_accepted_at,
    invited_at = excluded.invited_at;
  return new;
end;
$$;

-- 4. Keep the denormalized columns current. email_confirmed_at changes when an
--    invite is accepted; invited_at changes when an invite is re-sent; email
--    changes on email update. Sync only when one of those actually changed.
create or replace function public.sync_auth_user_to_public()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.users
  set
    email = new.email,
    invite_accepted_at = new.email_confirmed_at,
    invited_at = new.invited_at
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email, email_confirmed_at, invited_at on auth.users
  for each row execute function public.sync_auth_user_to_public();

-- 5. Recreate the view without the auth.users join and as security_invoker.
--    RLS on public.users (admin all / staff read all / user read self) now
--    enforces row visibility; the view inherits it. No internal WHERE needed.
drop view public.users_with_email;

create view public.users_with_email
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
  invited_at
from public.users;

-- Reachable only by authenticated callers; never anon.
revoke all on public.users_with_email from anon;
grant select on public.users_with_email to authenticated;

-- 6. Tighten anon privileges. anon had inherited broad INSERT/SELECT/UPDATE on
--    these tables (RLS still gated rows, but the grants themselves were wider
--    than intended). anon should never touch user/account data directly.
revoke all on public.users from anon;
revoke all on public.accounts from anon;
revoke all on public.account_users from anon;
