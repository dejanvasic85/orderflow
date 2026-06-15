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
| **Staff** | View all order requests. Read-only otherwise                                                                                                                                            |
| **User**  | Submit order requests and view history for their assigned accounts. Can browse catalog and add items to a request or template. A user assigned to multiple accounts acts as a sales rep |

---

## Key Concepts

- **Account** = a customer business (maps to "Customer" in MYOB)
- **Template** = a per-account pre-configured product list; managed under Account settings. Users can add items; only admins can remove items or change the template.
- Order requests can be placed from a template plus optional custom entries, or individual catalog items
- Admins can place order requests on behalf of accounts
- Accounts have a delivery address and instructions (overridable per request)

---

## Notifications

- Triggered on: order request placed
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
- **order_requests** — linked to account + placed-by user; has optional note + delivery override
- **order_request_items** — products on a request with boxes + extra bottle quantities

---

## Architecture

```text
Cloudflare Workers  — serves TanStack Start app (SSR + API server functions)
Cloudflare R2       — product image storage (bucket: orderflow-assets)
Supabase            — Postgres, Auth, PostgREST
```

The browser calls Supabase directly via `@supabase/supabase-js`. Row Level Security (RLS) enforces per-user data access at the database layer, so the anon key is safe to ship in the browser bundle.

TanStack server functions (`createServerFn`) are used for sensitive operations that require verified identity. They use `createSupabaseServerClient()` which reads cookies from the incoming request and calls `supabase.auth.getUser()` — a network-verified check, not a cookie read.

### Product image upload

Admins upload product images directly from the browser to Cloudflare R2 — file bytes never pass through the Worker. Flow:

1. Admin selects and optionally crops a file in `ProductEditPanel`
2. Browser resizes to max 1200 px and converts to WebP (quality 0.82) via canvas
3. Browser calls the `getProductImageUploadUrl` server fn with `{ key, contentType }`
4. Server fn uses `aws4fetch` to generate a presigned S3-compatible PUT URL (5-minute expiry) against the R2 S3 API (`https://<accountId>.r2.cloudflarestorage.com`)
5. Browser PUTs the WebP blob directly to the presigned URL
6. The public R2 URL is saved to `products.image_url`

R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) are Worker secrets. `R2_BUCKET_NAME` and `R2_PUBLIC_BASE_URL` are `wrangler.jsonc` vars. See `.env.example` for local setup.

Cloudflare Image Transformations (`/cdn-cgi/image/`) can be layered on later for additional CDN-side resizing; client-side WebP conversion handles the bandwidth requirement for now.
