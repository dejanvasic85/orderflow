create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('admin', 'staff', 'user');

-- Shared updated_at trigger function reused across all tables
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  notification_preferences jsonb not null default jsonb_build_object('email', true, 'sms', false),
  active boolean not null default true,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create table public.account_users (
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);

-- Secondary index for the common "list my accounts" query and RLS helper lookups
create index account_users_user_id_idx on public.account_users(user_id);

-- Auto-create public.users row when a new auth user is created
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Custom access token hook — injects user_role into JWT claims
-- Registered in config.toml [auth.hook.custom_access_token]
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  claims jsonb;
  v_role public.user_role;
begin
  select role into v_role from public.users where id = (event ->> 'user_id')::uuid;
  claims := event -> 'claims';
  if v_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role::text));
  else
    claims := jsonb_set(claims, '{user_role}', '"user"'::jsonb);
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on table public.users to supabase_auth_admin;

-- Helper used by RLS policies — reads role from JWT so no per-row subquery is needed
create or replace function public.current_user_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'user_role', 'user');
$$;

-- SECURITY DEFINER helper to avoid infinite RLS recursion between accounts ↔ account_users
create or replace function public.is_account_member(p_account_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.account_users
    where account_id = p_account_id and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_account_member(uuid) from public;
grant execute on function public.is_account_member(uuid) to authenticated;

-- Enable RLS
alter table public.users enable row level security;
alter table public.accounts enable row level security;
alter table public.account_users enable row level security;

-- Dedicated policy so the token hook (running as supabase_auth_admin) can read public.users
create policy "auth admin can read users for token hook"
  on public.users for select to supabase_auth_admin using (true);

-- users policies
create policy "admin full access on users"
  on public.users for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff read all users"
  on public.users for select to authenticated
  using (public.current_user_role() = 'staff');

create policy "user read self"
  on public.users for select to authenticated
  using (id = auth.uid());

-- Prevents a regular user from escalating their own role via self-update
create policy "user update self"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()));

-- accounts policies
create policy "admin full access on accounts"
  on public.accounts for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff read all accounts"
  on public.accounts for select to authenticated
  using (public.current_user_role() = 'staff');

create policy "user read assigned accounts"
  on public.accounts for select to authenticated
  using (public.is_account_member(id));

-- account_users policies
create policy "admin full access on account_users"
  on public.account_users for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff read all account_users"
  on public.account_users for select to authenticated
  using (public.current_user_role() = 'staff');

create policy "user read own memberships"
  on public.account_users for select to authenticated
  using (user_id = auth.uid());
