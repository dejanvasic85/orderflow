-- Soft delete for users, mirroring products.deleted_at (see #321).
--
-- A hard delete is not an option: order_requests.placed_by is
-- `references public.users(id) on delete restrict`, so Postgres blocks removing
-- anyone who has ever placed an order. Keeping the row also keeps order history
-- attributable.
--
-- Losing access is handled by the existing `active` flag, which bans the account
-- in GoTrue via syncAuthBanStatus. `active` keeps its own meaning here (suspend
-- a user, reversible from the UI); deleted is the stronger, hidden-from-the-list
-- state. Deleting sets both.
--
-- RLS is deliberately not changed. Staff and admins must still resolve a deleted
-- user's name to attribute past orders, exactly as with deleted products. Hiding
-- deleted users from the list is a query filter in users.repository.ts.

alter table public.users add column deleted_at timestamptz;

-- The view is the read path for the users list, so it has to carry the column.
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
  password_set_at,
  deleted_at
from public.users;

grant select on public.users_with_email to authenticated;
