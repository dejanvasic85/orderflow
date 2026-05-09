# Orderflow — Project Context

Built for **Boutique Wines of the World Pty Ltd (BWW)** — a bespoke order management system.

## The Idea

_Fill in your product vision here._

## Target Users

_Who is this for?_

## Architecture

```
Cloudflare Pages    — serves TanStack Start app (SSR + static assets)
Cloudflare Workers  — MYOB sync, webhooks, background tasks (deferred)
Supabase            — Postgres, Auth, PostgREST, Storage
```

The browser calls Supabase directly via `@supabase/supabase-js`. Row Level Security (RLS) enforces per-user data access at the database layer, so the anon key is safe to ship in the browser bundle.

TanStack server functions (`createServerFn`) are used for sensitive operations that require verified identity. They use `createSupabaseServerClient()` which reads cookies from the incoming request and calls `supabase.auth.getUser()` — a network-verified check, not a cookie read.

## Tech Stack

| Layer      | Choice                                   |
| ---------- | ---------------------------------------- |
| Framework  | TanStack Start (Vite+)                   |
| Hosting    | Cloudflare Pages                         |
| Database   | Supabase (Postgres via PostgREST)        |
| Auth       | Supabase Auth (email/password)           |
| Styling    | Tailwind CSS v4                          |
| Data       | TanStack Query + `@supabase/supabase-js` |
| Forms      | TanStack Form                            |
| Monitoring | Sentry                                   |
| Testing    | Vitest, Testing Library, Playwright      |

## Roles

| Role    | Access                                                                       |
| ------- | ---------------------------------------------------------------------------- |
| `admin` | Full access — create users, manage templates, import products, manage orders |
| `staff` | Read-only across everything + can update order statuses                      |
| `user`  | Scoped to assigned accounts only; picks one account per session              |

- `auth.users` is managed by Supabase — not defined in migrations
- A `profiles` table (defined in migrations) extends auth users with `role` and display name

## Data Fetching Pattern

Browser code queries Supabase directly. TanStack Query manages caching, loading states, and background refetching.

```ts
// src/lib/queries/orders.ts
export const getOrders = async (accountId: string) => {
  const { data, error } = await supabase.from("orders").select("*").eq("account_id", accountId);
  if (error) throw error;
  return data;
};

// in a component
const { data, isLoading } = useQuery({
  queryKey: ["orders", accountId],
  queryFn: () => getOrders(accountId),
});
```

## Local Dev Workflow

```bash
supabase start       # start local Supabase (requires Docker)
supabase db reset    # apply migrations + seed data
vp dev               # start app on http://localhost:3344
```

## MYOB Sync

One-way sync: MYOB → Supabase (products only). Triggered manually by an admin button. Implemented as a Cloudflare Worker or Supabase Edge Function (deferred).

## Domain Entities

_Define your domain entities here — to be filled after the data model session._
