# AGENTS Guide

This file defines the baseline engineering conventions for agents working in this repository.

## Project Context

Read `docs/project-context.md` before making any changes.
It contains the product vision, tech stack, and data model decisions.

## Key conventions

- Use `vp` (Vite Plus) for all dev/build/test/lint workflows — not raw `pnpm` or `vite`
- Path alias `#/*` maps to `./src/*` — prefer it over relative imports
- Auth is handled by Supabase Auth; use `getSession` / `ensureSession` from `src/lib/authFunctions.ts`
- Server-side Supabase access: `createSupabaseServerClient()` from `src/lib/supabaseServer.ts` (used inside `createServerFn` handlers)
- Browser-side Supabase access: `supabase` singleton from `src/lib/supabase.ts`
- Domain queries go in `src/lib/queries/` grouped by entity (e.g. `orders.ts`, `products.ts`)
- Environment variables are documented in `.env.example` — never put env var lists in docs or README files

## Local development

Requires Docker running.

```bash
supabase start        # starts Postgres, PostgREST, Studio, Auth locally
supabase db reset     # applies migrations + seed.sql
vp dev                # starts the app on http://localhost:3344
```

Copy `.env.example` to `.env.local` and fill in the values. After `supabase start`, paste the printed anon key into `.env.local`.

Supabase Studio is at http://localhost:54323 — use it to inspect auth users and data.

## Running e2e tests

```bash
supabase start        # must be running
vp dev                # must be running in another terminal
vp exec playwright test
```

## Vite+ Workflow (Required)

Use `vp` as the default interface for local tooling.

- `vp dev`- local development unless a script-specific setup is required
- `vp check`- lint + format + type checks
- `vp test`- test execution
- `vp fmt`- formatting code
- `vp lint`- formatting code
- `vp build`- production builds
- `vp run <script>`- when you need a custom `package.json` script

Avoid bypassing Vite+ wrappers for core workflows.

### Execute

- `vp exec` - Execute a command from local `node_modules/.bin`
- `vp dlx` - Execute a package binary without installing it as a dependency
- `vp cache` - Manage the task cache

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager through `packageManager` in `package.json` and lockfiles.

- `vp add` - Add packages to dependencies
- `vp remove` (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- `vp update` (`up`) - Update packages to latest versions
- `vp dedupe` - Deduplicate dependencies
- `vp outdated` - Check for outdated packages
- `vp list` (`ls`) - List installed packages
- `vp why` (`explain`) - Show why a package is installed
- `vp info` (`view`, `show`) - View package information from the registry
- `vp link` (`ln`) / unlink - Manage local package links
- `vp pm` - Forward a command to the package manager

## Code Style

- Keep code DRY; extract repeated logic into named functions/constants
- Prefer small, composable functions over large inline blocks
- Prefer `switch` over long `if/else` chains when branching on a single discriminator
- Avoid magic numbers/strings; introduce well-named constants
- Use camelCase naming for constants (no SCREAMING_CASE)
- Object constants should end with `Value` suffix (for example: `defaultConfigValue`)
- Avoid unnecessary comments; add short comments only for non-obvious intent
- Keep modules/components reasonably small; split when complexity grows

### File/Module Naming

- Non-component TypeScript module file names should be camelCase (for example: `authService.ts`)
- Co-locate types with components/modules when practical

## React and UI

- When you make UI changes be sure to use the agent-browser skill to test it out
- Use React + TypeScript with explicit prop types in the same file
- React component file names should be PascalCase (for example: `HeaderUser.tsx`)
- Do not use inline object types in component parameters; declare a `type`/`interface` first
- Keep constants outside component bodies unless they must capture runtime state
- Prefer Tailwind utility classes over inline `style` props
- Name event handlers with `handle` prefix (for example: `handleSubmit`)
- Use accessible, semantic HTML and keyboard-friendly interactions by default

## Data, Config, and Validation

- Centralize environment variable parsing/validation through Zod-based config modules
- Keep data access logic grouped by domain; avoid scattering query logic through UI layers
- Use explicit mapping/transform steps where boundaries between external/internal shapes exist
- **Environment variables are documented in `.env.example` only** — never list env vars in docs, README, or CLAUDE.md files

## Testing and Quality Gates

At minimum before opening or updating a PR:

1. `vp check`
2. `vp build` for larger or riskier changes

Pre-commit hooks are configured through Vite+ staged checks; ensure any auto-fixes are included in commits.

## Dependency Management

- Check for current stable package versions before adding dependencies
- Avoid deprecated packages/APIs when alternatives exist

## Common Pitfalls

- **Using package managers directly for routine workflows:** prefer `vp`
- **Assuming built-in command behavior follows scripts:** `vp dev` runs Vite+, not script aliases
- **For custom script behavior:** use `vp run <script>`
- **Bypassing checks before handoff:** always run quality gates from this file

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before starting work.
- [ ] Run `vp check` and `vp test` before final handoff.
- [ ] Run `vp build` when changes affect build/runtime boundaries.
- [ ] Prefer alias imports (`#/*`, `@/*`) over long relative paths.
- [ ] Keep environment variables validated through Zod config.
