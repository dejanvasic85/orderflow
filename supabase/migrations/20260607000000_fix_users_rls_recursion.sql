-- Fix infinite recursion in "user update self" policy.
-- The with check clause used a plain subselect on public.users which caused
-- Postgres to re-evaluate all UPDATE policies (including itself) when checking
-- the constraint. Wrapping it in a SECURITY DEFINER function bypasses RLS for
-- that single lookup, breaking the cycle.

create or replace function public.get_own_role()
returns public.users.role%type
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

drop policy if exists "user update self" on public.users;

create policy "user update self"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.get_own_role());
