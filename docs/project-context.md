# OrderFlow — Project Notes

**Client:** Boutique Wines of the World (BWOW — Sam)
**Type:** Progressive Web App (PWA) — installable on mobile, web-first build
**Stack:** TanStack Start · Supabase (Postgres + Auth) · Tailwind + shadcn/ui · Cloudflare Pages · Vite

---

## Purpose

Replaces SMS/email ordering with a centralised order request management system for a liquor wholesaler (~400–500 accounts). No payment processing. No stock management. Pricing is deferred — no prices stored or displayed for now.

---

## Roles

| Role      | What they can do                                                                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin** | Full access — users, accounts, products, templates, order requests. Only admins can modify (remove items from) templates                                                                |
| **Staff** | View all order requests, update status (dispatch/cancel). Read-only otherwise                                                                                                           |
| **User**  | Submit order requests and view history for their assigned accounts. Can browse catalog and add items to a request or template. A user assigned to multiple accounts acts as a sales rep |

---

## Key Concepts

- **Account** = a customer business (maps to "Customer" in MYOB)
- **Template** = a per-account pre-configured product list; managed under Account settings. Users can add items; only admins can remove items or change the template.
- **Order request** statuses: `Requested → Dispatched / Cancelled`
- Order requests can be placed from a template plus optional custom entries, or individual catalog items
- Admins can place order requests on behalf of accounts
- Accounts have a delivery address and instructions (overridable per request)

---

## Notifications

- Triggered on: order request placed, status changed
- All users assigned to an account are notified when an order request is placed for that account
- Channels: email (Phase 1), SMS (Phase 2)
- Configurable per user

---

## Phases

| Phase         | Scope                                                                                      | Timeline  |
| ------------- | ------------------------------------------------------------------------------------------ | --------- |
| 1 — Core MVP  | Auth, accounts, products (manual/CSV), templates, order requests, email notifications, PWA | 2–3 weeks |
| 2 — Polish    | SMS notifications, notification prefs, account-specific pricing, bulk reassignment         | 1–2 weeks |
| 3 — MYOB Sync | CSV export/import (API sync deferred — Sam is comfortable double-handling for now)         | 1–2 weeks |
| 4 — Reporting | TBD — quoted separately                                                                    | —         |

---

## Data Model (entities only)

- **users** — auth + role + notification prefs
- **accounts** — business + contact details, delivery address + instructions
- **account_users** — many-to-many join (user ↔ account)
- **products** — name, description, image, qty per box (no prices for now)
- **templates** — one per account; contain product lines with suggested quantities
- **order_requests** — linked to account + placed-by user; has status + optional note + delivery override
- **order_request_items** — products on a request with boxes + extra bottle quantities

---

## Architecture

```text
Cloudflare Pages    — serves TanStack Start app (SSR + static assets)
Cloudflare Workers  — MYOB sync, webhooks, background tasks (deferred)
Supabase            — Postgres, Auth, PostgREST, Storage
```

The browser calls Supabase directly via `@supabase/supabase-js`. Row Level Security (RLS) enforces per-user data access at the database layer, so the anon key is safe to ship in the browser bundle.

TanStack server functions (`createServerFn`) are used for sensitive operations that require verified identity. They use `createSupabaseServerClient()` which reads cookies from the incoming request and calls `supabase.auth.getUser()` — a network-verified check, not a cookie read.
