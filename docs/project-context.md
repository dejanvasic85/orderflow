# OrderFlow — Project Notes

**Client:** Boutique Wines of the World (Sam)
**Type:** Progressive Web App (PWA) — installable on mobile, web-first build
**Stack:** TanStack Start · Supabase (Postgres + Auth) · Tailwind + shadcn/ui · Cloudflare Pages · Vite

---

## Purpose

Replaces SMS/email ordering with a centralised order management system for a liquor wholesaler (~400–500 accounts). No payment processing. No stock management. Prices stored internally but never shown to account users.

---

## Roles

| Role | What they can do |
|------|-----------------|
| **Admin** | Full access — users, accounts, products, templates, orders |
| **Staff** | View all orders, update status (dispatch/cancel). Read-only otherwise |
| **User** | Place/cancel orders and view history for their assigned accounts. A user assigned to multiple accounts acts as a sales rep |

---

## Key Concepts

- **Account** = a customer business (maps to "Customer" in MYOB)
- **Template** = a pre-configured product list (global, assigned to one or more accounts)
- **Order** statuses: `Requested → Dispatched / Cancelled`
- Orders can be placed from a template, individual items, or a previous order
- Admins can place orders on behalf of accounts
- Cancellation only allowed while status is `Requested`

---

## Notifications

- Triggered on: order placed, status changed
- Channels: email (Phase 1), SMS (Phase 2)
- Configurable per user

---

## Phases

| Phase | Scope | Timeline |
|-------|-------|----------|
| 1 — Core MVP | Auth, accounts, products (manual/CSV), templates, orders, email notifications, PWA | 2–3 weeks |
| 2 — Polish | SMS notifications, notification prefs, account-specific pricing, bulk reassignment | 1–2 weeks |
| 3 — MYOB Sync | Product + account sync from MYOB AccountRight API (or CSV fallback) | 1–2 weeks |
| 4 — Reporting | TBD — quoted separately | — |

---

## Data Model (entities only)

- **users** — auth + role + notification prefs
- **accounts** — business details, delivery address
- **account_users** — many-to-many join (user ↔ account)
- **products** — name, description, image, qty per box, price (internal only)
- **account_pricing** — per-account price overrides
- **templates** — global; assigned to accounts via join table; contain product lines with suggested quantities
- **orders** — linked to account + placed-by user; has status + optional note
- **order_items** — products on an order with boxes + extra bottle quantities

---

## Open Questions (unresolved)

- MYOB access level — API credentials, DB access, or CSV export only?

---

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
