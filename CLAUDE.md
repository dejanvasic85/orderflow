# Orderflow

## Overview

Read `docs/project-context.md` for the product vision, domain model, and tech stack decisions.

Read `AGENTS.md` for engineering conventions — code style, tooling commands, quality gates, and design system rules that apply to all changes in this repo.

## Key conventions

- Use `vp` (Vite Plus) for all dev/build/test/lint workflows — not raw `pnpm` or `vite`
- Path alias `#/*` maps to `./src/*` — prefer it over relative imports
- All server-side data access goes through `createServerFn` in `src/lib/`
- Auth is handled by Better Auth; use `getSession` / `ensureSession` from `src/lib/authFunctions.ts`
- Frontend styles use CSS custom property tokens — see `src/styles.css` and `.agents/skills/frontend-design-system/SKILL.md`
