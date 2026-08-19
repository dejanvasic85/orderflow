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

## Troubleshooting: `"Unregistered API key"` on invite / auth email

**Symptom.** Inviting a user fails. The worker logs `event: "invite"`,
`msg: "failed to send invitation email"`, `error: "Unregistered API key"`.

**Cause.** The worker's `SUPABASE_SECRET_KEY` is stale or revoked. Supabase's API
gateway rejects the request before it reaches GoTrue, and supabase-js surfaces the
gateway's message through the same `error.message` field an SMTP failure would use. It
therefore reads as an email-provider problem when it is an auth problem.

**Do not** start by debugging SES, IAM, SMTP credentials, verified identities, or sender
domains. In July 2026 that misread cost most of a day, and swapping SES for Resend
reproduced the identical error, which is what finally ruled the email provider out.

**Diagnose in this order:**

1. Check the GoTrue logs (Supabase dashboard, or `get_logs` with `service: "auth"`) for a
   `POST /admin/users` around the failure. **No entry means the request never reached
   GoTrue**, so no email provider was ever involved. That single check settles it.
2. Call the endpoint directly with the key you believe is live:
   ```bash
   curl -sS -w '\nHTTP %{http_code}\n' -X POST "$SUPABASE_URL/auth/v1/invite" \
     -H "apikey: $SUPABASE_SECRET_KEY" \
     -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"you@example.com"}'
   ```
   `200` means the key and the email path are both fine and the stale value is on the
   worker. `401` means the key itself is dead.
3. Confirm the key in Cloudflare matches a live key under Project Settings → API Keys →
   Secret keys. It must be a `sb_secret_...` value; a legacy JWT (`eyJ...`) is also
   rejected this way.

**Fix.** Set the `SUPABASE_SECRET_KEY` GitHub secret, then **redeploy**. `wrangler secret
bulk` alone does not always roll a new worker version, so confirm `scriptVersion.id` in
the logs actually changed. Use the `workflow_dispatch` trigger on `deploy-prod.yml`
rather than editing worker secrets by hand, hand edits drift from the manifest and are
not reproducible.

## Auth email links must never auto-verify on GET

**Symptom.** A user reports an invite/reset link as "invalid or expired" seconds
after receiving it, well inside the token's expiry window. GoTrue logs
(`get_logs`, `service: "auth"`) show the same one-time token consumed twice in
quick succession from the same or a nearby IP, with the second attempt failing
`error: "One-time token not found"`.

**Cause.** Corporate email security (Microsoft Defender Safe Links and similar)
issues an automated `GET` against every link in an inbound email, often within
seconds of delivery. If that link points straight at Supabase's own `/verify`
endpoint (the default `{{ .ConfirmationURL }}` email template), or at one of our
own routes that calls `verifyOtp`/`exchangeCodeForSession` unconditionally in a
route `loader`, the scanner's `GET` silently burns the single-use token before
the real user ever clicks. The user's own click then correctly gets rejected.

**Fix — the pattern this repo uses.** Point auth emails at our own domain with a
custom template (`supabase/templates/*.html`, `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...&next=...`,
see `recovery.html` / `invite.html`), **and** gate the actual token-consuming
call behind a real user action (a "Continue" button in `ConfirmView`/`confirm.tsx`)
rather than firing it from a `loader` or a mount effect. A scanner loading the
page harmlessly renders a static button; only a human click consumes the token.
Any new auth email flow (magic link, email change, reauthentication) must follow
this same pattern before going live — the templates for those still use the
unsafe `{{ .ConfirmationURL }}` form today because nothing in the app sends them yet.

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
