# Security Model

> **Read this before changing anything auth-, role-, or RLS-related** — adding a
> table, a server function that reads/writes data, a new role, or a policy. Keep
> the matrix below in sync when you do.

## The one rule

**Row Level Security (RLS) in Postgres is the security boundary.** Everything in
the application layer (route guards, `assert*` helpers) is UX and defense-in-depth.
If a check exists _only_ in TypeScript, assume it can be bypassed. Every table that
holds data must have RLS enabled and a policy for every role × operation you intend
to allow. Deny-by-default does the rest.

## How identity flows from browser to database

1. **Login** — the browser Supabase client (`createBrowserClient`, `src/lib/supabase.ts`)
   stores the session in **cookies** (`sb-<ref>-auth-token`), via `@supabase/ssr`.
2. **Request** — every call to a TanStack `createServerFn` automatically carries those cookies.
3. **Server client** — `createSupabaseServerClient()` (`src/lib/supabaseServer.ts`) reads
   the cookies and constructs a Supabase client that acts **as that user**. Its queries
   go to PostgREST carrying the user's signed JWT.
4. **RLS** — Postgres evaluates each policy using `auth.uid()` and the `user_role` claim
   from the JWT. The role is **not** trusted from app code — it is baked into the signed
   token at mint time by `public.custom_access_token_hook` (see `initial_schema.sql`),
   which reads `public.users.role`. A user cannot forge it.

`fetchSession()` (`src/lib/auth/auth.server.ts`) calls `supabase.auth.getUser()` (which
validates the JWT against the auth server — do **not** replace this with the unvalidated
`getSession()`) and then decodes the `user_role` claim to attach to the returned user.

## The three layers

| Layer                               | Where                                                                                                   | Job                                                     | Is it a trust boundary? |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------- |
| Route guard                         | `_protected.tsx` `beforeLoad`, `manage.tsx` role check                                                  | Don't render a page the user can't use; redirect        | **No** — UX only        |
| Server-fn `authorize()` / `assert*` | `src/lib/<entity>/<entity>.functions.ts` deps; `assertAdmin` / `assertAdminOrStaff` in `auth.server.ts` | Clean `Forbidden` errors + early exit before doing work | **No** — convenience    |
| **RLS policies**                    | Postgres migrations                                                                                     | Enforce who can read/write which rows                   | **Yes — the wall**      |

Consequence: a _forgotten `assert`_ downgrades a `Forbidden` to a silently-empty
result — annoying, not dangerous. A _forgotten RLS policy_ is dangerous. Treat
"RLS + policies in the same migration as the table" as non-negotiable.

## Roles

Three roles in the `public.user_role` enum: `admin`, `staff`, `user`. Resolved in
policies via `public.current_user_role()` (reads the JWT claim, defaults to `user`).

- **admin** — full access on every table (`for all`).
- **staff** — reads everything; may _place orders on behalf of any account_ (insert
  on `order_requests` / `order_request_items`), but otherwise read-only.
- **user** — scoped to accounts they belong to, via `public.is_account_member(account_id)`
  (a `security definer` helper that avoids RLS recursion between `accounts` ↔ `account_users`).

## RLS coverage matrix

Legend: ✅ allowed · — no policy (deny-by-default) · `member` = `is_account_member()` scoped · `self` = own row only.

Every table below has RLS **enabled**. `authenticated` holds the grants; `anon` has been
revoked from `users`, `accounts`, `account_users`, and `users_with_email`.

| Table                   | Role  |                  SELECT                  |                INSERT                 |   UPDATE   |  DELETE   |
| ----------------------- | ----- | :--------------------------------------: | :-----------------------------------: | :--------: | :-------: |
| **users**               | admin |                    ✅                    |                  ✅                   |     ✅     |    ✅     |
|                         | staff |                  ✅ all                  |                   —                   |     —      |     —     |
|                         | user  | ✅ self + order-placers for own accounts |                   —                   |  ✅ self¹  |     —     |
| **accounts**            | admin |                    ✅                    |                  ✅                   |     ✅     |    ✅     |
|                         | staff |                  ✅ all                  |                   —                   |     —      |     —     |
|                         | user  |                ✅ member                 |                   —                   |     —      |     —     |
| **account_users**       | admin |                    ✅                    |                  ✅                   |     ✅     |    ✅     |
|                         | staff |                  ✅ all                  |                   —                   |     —      |     —     |
|                         | user  |            ✅ own memberships            |                   —                   |     —      |     —     |
| **products**            | admin |                    ✅                    |                  ✅                   |     ✅     |    ✅     |
|                         | staff |                  ✅ all                  |                   —                   |     —      |     —     |
|                         | user  |              ✅ active only              |                   —                   |     —      |     —     |
| **templates**           | admin |                    ✅                    |                  ✅                   |     ✅     |    ✅     |
|                         | staff |                  ✅ all                  |                   —                   |     —      |     —     |
|                         | user  |                ✅ member                 |                   —                   |     —      |     —     |
| **template_items**      | admin |                    ✅                    |                  ✅                   |     ✅     |    ✅     |
|                         | staff |                  ✅ all                  |                   —                   |     —      |     —     |
|                         | user  |                ✅ member                 |              ✅ member²               |     —      |     —     |
| **order_requests**      | admin |                    ✅                    |                  ✅                   |     ✅     |    ✅     |
|                         | staff |                  ✅ all                  |            ✅ any account³            |     —      |     —     |
|                         | user  |                ✅ member                 | ✅ member + `placed_by = auth.uid()`⁴ | ✅ member⁵ | ✅ member |
| **order_request_items** | admin |                    ✅                    |                  ✅                   |     ✅     |    ✅     |
|                         | staff |                  ✅ all                  |           ✅ for own order³           |     —      |     —     |
|                         | user  |                ✅ member                 |              ✅ member⁴               |     —      |     —     |

Notes:

1. `user update self` — `with check` pins `role = public.get_own_role()`, so a user
   **cannot escalate their own role**. (`get_own_role` is `security definer` to break
   RLS recursion — see `20260607000000_fix_users_rls_recursion.sql`.)
2. `user insert template_items` — `with check` validates the parent template's
   `account_id` via `is_account_member()`, blocking cross-account inserts.
3. `staff insert ...` — staff may place orders for **any** account (not just ones they
   belong to); `placed_by = auth.uid()` still pins authorship. See
   `20260605000000_staff_insert_order_requests.sql`.
4. `user insert order_requests` — `with check` requires both `is_account_member(account_id)`
   **and** `placed_by = auth.uid()`, so a user cannot forge an order as someone else or
   for an account they don't belong to.
5. `user update order_requests` — `using` and `with check` are both scoped by
   `is_account_member()`; `with check` also pins `placed_by = auth.uid()` so a user can't
   reassign authorship while editing. DELETE is scoped by `is_account_member()`. See
   `20260623085116_user_update_delete_own_order_requests.sql`.

## Known gaps (intentional, verify before "fixing")

These are **deny-by-default** outcomes, not oversights — but confirm against product
intent before adding policies, and never add a loose `for update`/`for delete` without
a tight `with check`:

- **Users cannot UPDATE or DELETE their own `order_request_items` or `template_items`.**
  The `grant` allows it but no permissive policy exists, so RLS denies. Note this means a
  user can amend/cancel an order _header_ (`order_requests`) but cannot change its line
  _items_ — "amend" is therefore only partially functional until item-level policies are
  added. If product requires editing line items, add UPDATE/DELETE policies on
  `order_request_items` scoped by `is_account_member()` through the parent order.
- **Staff are read-only outside placing orders.** No staff write policies on `users`,
  `accounts`, `products`, `templates`. Intentional.

## Checklist when touching auth / data access

- [ ] New table → `enable row level security` **and** policies in the **same migration**.
- [ ] A policy for every role × operation you intend to allow; everything else stays denied.
- [ ] Every `for insert`/`for update` write policy has a `with check` that scopes rows
      (`is_account_member(...)`, `= auth.uid()`, role pinning) — not just a role check.
- [ ] Role decisions in policies use `current_user_role()` (JWT), never a value passed from app code.
- [ ] `anon` is revoked from any table holding user/account data.
- [ ] Server functions still call `assertAdmin` / `assertAdminOrStaff` / `authorize` for
      clean errors — but never rely on them as the only check.
- [ ] Update the matrix above and the "Known gaps" section.
- [ ] Run `supabase db reset` + e2e to confirm policies behave as intended.
