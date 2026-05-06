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

## Local development

Requires Docker running.

```bash
supabase start        # starts Postgres, PostgREST, Studio, Auth locally
supabase db reset     # applies migrations + seed.sql
vp dev                # starts the app on http://localhost:3000
```

Supabase Studio is at http://localhost:54323 — use it to inspect auth users and data.

After `supabase start`, copy the printed anon key into `.env.local`:

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<printed anon key>
```

## Environment variables

| Variable                 | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL (local: `http://localhost:54321`)   |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key — safe in browser; RLS enforces access |
| `VITE_SENTRY_DSN`        | Sentry error reporting                                   |
| `VITE_SENTRY_ORG`        | Sentry org slug                                          |
| `VITE_SENTRY_PROJECT`    | Sentry project slug                                      |
| `SENTRY_AUTH_TOKEN`      | Sentry auth for source map uploads                       |

> Never commit or expose the Supabase service role key.

## Running e2e tests

```bash
supabase start        # must be running
vp dev                # must be running in another terminal
npx playwright test   # or: npm run test:e2e
```
