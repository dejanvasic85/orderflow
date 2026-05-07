# Orderflow

## Overview

Read `docs/project-context.md` for the product vision, domain model, and tech stack decisions.

Read `AGENTS.md` for engineering conventions — code style, tooling commands, quality gates, and design system rules that apply to all changes in this repo.

## Key conventions

- Use `vp` (Vite Plus) for all dev/build/test/lint workflows — not raw `pnpm` or `vite`
- Path alias `#/*` maps to `./src/*` — prefer it over relative imports
- Auth is handled by Supabase Auth; use `getSession` / `ensureSession` from `src/lib/authFunctions.ts`
- Server-side Supabase access: `createSupabaseServerClient()` from `src/lib/supabaseServer.ts` (used inside `createServerFn` handlers)
- Browser-side Supabase access: `supabase` singleton from `src/lib/supabase.ts`
- Domain queries go in `src/lib/queries/` grouped by entity (e.g. `orders.ts`, `products.ts`)
- Frontend styles use CSS custom property tokens — see `src/styles.css` and `.agents/skills/frontend-design-system/SKILL.md`
- Environment variables are documented in `.env.example` — never put env var lists in docs or README files

## Local development

Requires Docker running.

```bash
supabase start        # starts Postgres, PostgREST, Studio, Auth locally
supabase db reset     # applies migrations + seed.sql
vp dev                # starts the app on http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in the values. After `supabase start`, paste the printed anon key into `.env.local`.

Supabase Studio is at http://localhost:54323 — use it to inspect auth users and data.

## Running e2e tests

```bash
supabase start        # must be running
vp dev                # must be running in another terminal
vp exec playwright test
```
