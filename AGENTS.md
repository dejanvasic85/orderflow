# AGENTS Guide

This file defines the baseline engineering conventions for agents working in this repository.

## Project Context

Read `docs/project-context.md` before making any changes.
It contains the product vision, tech stack, and data model decisions.

## Security

**Read `docs/security.md` before any change that touches authentication, roles,
RLS policies, or data access** — including adding a table, a server function that
reads/writes data, or a new role. It explains how identity flows from browser to
database, the three security layers, and a per-table RLS coverage matrix. RLS is
the security boundary; app-layer `assert*` checks are convenience only. Keep the
matrix and "Known gaps" section in `docs/security.md` in sync with any policy change.

## Key conventions

- PREFER functional approach over object oriented and imperative
- Functions shouldn't be doing too much - try and ensure they do one thing
- Use `vp` (Vite Plus) for all dev/build/test/lint workflows — not raw `pnpm` or `vite`
- Path alias `@/*` maps to `./src/*` — prefer it over relative imports
- Auth is handled by Supabase Auth; use `getSession` / `ensureSession` from `src/lib/auth/auth.functions.ts` (see `docs/security.md` for the full model)
- Server-side Supabase access: `createSupabaseServerClient()` from `src/lib/supabaseServer.ts` (used inside `.server.ts` helpers)
- Browser-side Supabase access: `supabase` singleton from `src/lib/supabase.ts`
- **Server-side code layout** (TanStack Start file-naming convention):
  - `src/lib/<entity>/<entity>.functions.ts` — `createServerFn` wrappers, safe to import from routes and components
  - `src/lib/<entity>/<entity>.server.ts` — server-only helpers (Supabase queries, admin checks, mappers); never import these from client code
  - `src/lib/<entity>/schema.ts` — Zod schemas and types; client-safe
  - Do **not** define `createServerFn` calls inside route files; always extract to `<entity>.functions.ts`
  - Test files for `.server.ts` helpers must use plain `.test.ts` suffix (not `.server.test.ts`) to avoid the TanStack import-protection plugin stubbing them out in jsdom
- Environment variables are documented in `.env.example` — never put env var lists in docs or README files

### Server-side layering (repository / service / functions)

We are migrating server modules away from a monolithic `.server.ts` toward a three-layer split.
`orderRequests` is the reference implementation; apply this pattern to a module when you touch it
(one module per PR). The split exists so business logic is unit-testable in isolation and portable
to a future standalone API that mobile + web both call.

- `src/lib/<entity>/<entity>.repository.ts` — **the only place that talks to Supabase.** Exports a
  `<Entity>Repository` type plus a `create<Entity>Repository()` factory. Each method builds a
  query, executes it, and returns a `Result` of raw rows. **No business rules here.** Not unit-tested
  (covered by e2e).
- `src/lib/<entity>/<entity>.service.ts` — **all business logic:** mappers, role-based decisions,
  fan-out, authorization orchestration. **Pure / Supabase-free.** It receives its collaborators via a
  `deps` argument: `{ repo, session, authorize, notify }`. **This is the layer we unit-test** — pass a
  hand-built fake `repo` (a `vi.fn()` per method) and assert on outcomes. May import server-only
  modules **as types only** (`import type`) — never at runtime.
- `src/lib/<entity>/<entity>.functions.ts` — **transport adapter.** Constructs the real `deps`
  (real repository, `fetchSessionOrThrow`, an `authorize` closure, real `notify`) and passes them to
  the service. Keep `createServerFn` names/signatures stable so routes/components/e2e are unaffected.

Rules:

- DI is by **argument**, not module mocking: services take `deps`; tests build fakes. Do not
  `vi.mock` the Supabase client.
- Repositories return the existing `Result<T>` (`ok`/`err` from `@/lib/result`). Services map repo
  errors to domain outcomes, also returning `Result`.
- **Transactions:** supabase-js cannot run a multi-statement transaction across two `.from()` calls.
  Atomicity requires a Postgres function called via `.rpc()`. Model any multi-write as a **single**
  repository method (e.g. `createOrderWithItems`) so converting it to an atomic RPC later is a
  one-method change. See the `TODO(atomicity)` marker in `orderRequests.repository.ts`.
- **Future API extraction:** services are transport-agnostic by design. When we stand up a dedicated
  API (for mobile), it calls the same `<entity>.service.ts` modules — no logic is rewritten.

## Local development

Requires Docker running.

```bash
supabase start        # starts Postgres, PostgREST, Studio, Auth locally
supabase db reset     # applies migrations + seed.sql
vp dev                # starts the app on http://localhost:3344
```

Copy `.env.example` to `.env.local` and fill in the values. After `supabase start`, paste the printed anon key into `.env.local`.

Supabase Studio is at http://localhost:54323 — use it to inspect auth users and data.

> **After every `supabase db reset`:** Kong loses its upstream connection to the auth container because the DB container restarts and gets a new IP. Always run:
>
> ```bash
> docker restart supabase_kong_orderflow
> ```
>
> Wait ~4 seconds before using the app or making auth requests.

> **Email/password login requires `enable_signup = true`** in `[auth.email]` of `config.toml`. In CLI v2.98+, this also controls `GOTRUE_EXTERNAL_EMAIL_ENABLED` — if it's `false`, all email logins fail with `email_provider_disabled`. Changes to `config.toml` require `supabase stop && supabase start` to take effect.

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
- Prefer to use Result over throwing errors
- Prefer small, composable functions over large inline blocks
- Prefer `switch` over long `if/else` chains when branching on a single discriminator
- Avoid magic numbers/strings; introduce well-named constants
- Use camelCase naming for constants — never SCREAMING_CASE
- Group related constants into a single `as const` object rather than many individual `const` declarations
- Avoid casting with TypeScript `as` — never use `as unknown as` or escape hatches; they hide runtime errors and defeat the type system. Fix the root type instead (e.g. use `from:` on `useRouteContext`, add a proper type guard with `Object.hasOwn`, or export the correct type from the source). The only acceptable `as` usages are narrowing a known-safe union (e.g. `value as ConcreteType` after an `if` check) or satisfying an external library whose types are wrong.
- Object constants should end with `Value` suffix (for example: `defaultConfigValue`, `sidebarConfigValue`)
- Place shared constants in a `constants.ts` file co-located with the module that owns them; only extract to `src/lib/constants.ts` if used across multiple domains
- Avoid unnecessary comments; add short comments only for non-obvious intent
- Keep modules/components reasonably small; split when complexity grows

### File/Module Naming

- Non-component TypeScript module file names should be camelCase (for example: `authService.ts`)
- React component file names should be PascalCase (for example: `OrderList.tsx`)
- **Exception:** files generated by shadcn (typically under `src/components/ui/` and any shadcn-scaffolded hooks) retain their original kebab-case names — do not rename them
- Co-locate types with components/modules when practical

## React and UI

- When you make UI changes be sure to use the agent-browser skill to test it out
- Use React + TypeScript with explicit prop types in the same file
- Do not use inline object types in component parameters; declare a `type`/`interface` first
- Keep constants outside component bodies unless they must capture runtime state
- Prefer Tailwind utility classes over inline `style` props
- Name event handlers with `handle` prefix (for example: `handleSubmit`)
- Use accessible, semantic HTML and keyboard-friendly interactions by default

### Component vs Route responsibilities

Routes are glue — they own navigation and server function calls only. Everything else belongs in the component:

| Belongs in **component**                     | Belongs in **route**                    |
| -------------------------------------------- | --------------------------------------- |
| UI state (`submitting`, `error`)             | `useNavigate()` calls                   |
| Input mapping (form fields → server payload) | `createServerFn` calls                  |
| Conditional rendering, form logic            | Loader data fetching                    |
| `onSubmit` prop receives the mapped payload  | Passes loader data + callbacks as props |

The `onSubmit` callback a route passes to a component should accept an already-mapped, submission-ready payload — not raw form state. This keeps the component self-contained and independently testable: render it with props, interact with it, assert on what `onSubmit` was called with.

## Data, Config, and Validation

- Centralize environment variable parsing/validation through Zod-based config modules
- Keep data access logic grouped by domain; avoid scattering query logic through UI layers
- Use explicit mapping/transform steps where boundaries between external/internal shapes exist
- **Environment variables are documented in `.env.example` only** — never list env vars in docs, README, or CLAUDE.md files

## Unit Tests

Vitest runs through Vite+ (`vp test`). The runner is wired up with `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom` matchers. `describe`/`it`/`test`/`expect` are globals — do not import them.

### What to test

- **Server functions** in `src/lib/<entity>/<entity>.server.ts` — test these directly by mocking `createSupabaseServerClient`. Every exported helper should have coverage. Name test files `<entity>.test.ts` (not `<entity>.server.test.ts` — see layout note above).
- **Business logic** in `src/lib/` (validators, mappers, utilities)
- **Composed React components** that wire shadcn primitives together, handle forms, conditional rendering, or display derived data
- **Custom hooks** with non-trivial behavior

Do not unit-test shadcn primitives directly, trivial pass-through components, or framework code (TanStack Router/Query/Form internals).

### File layout

- Co-locate tests next to source: `OrderList.tsx` → `OrderList.test.tsx`
- Use `*.test.ts` for logic, `*.test.tsx` for components
- File naming follows the source file: PascalCase for component tests, camelCase for module tests

### Style — keep tests simple and DAMP, not DRY

Per _Software Engineering at Google_: **test code should contain no logic**. A test that needs reasoning to verify is a test that itself needs tests. Prefer obvious, repetitive, linear tests over clever ones.

- **No conditionals, loops, or `try/catch` in tests.** If a branch matters, write two tests.
- **No computed expected values.** Hard-code expected output as a literal — don't recompute it from the input in the test.
- **Inline test data.** Avoid shared fixtures or factory helpers unless the duplication is genuinely painful; descriptiveness beats deduplication ("Descriptive And Meaningful Phrases" over Don't Repeat Yourself).
- **One behavior per test.** A failing test name should pinpoint the broken behavior without reading the body.
- **Arrange / Act / Assert** structure, with a blank line between phases when it aids readability.
- **No abstraction over the system under test.** Call the real function or render the real component directly; avoid wrapper helpers that hide what's being tested.

A good test reads top-to-bottom like a story; a reader should not have to scroll to a helper to know what's going on.

### Testing-library conventions

- Query by accessible role, label, or text — not by `data-testid` or CSS classes. Use `getByRole`, `getByLabelText`, `getByText`.
- Use `userEvent` (not `fireEvent`) for interactions when we add it.
- Use `findBy*` for async appearance; do not chain `waitFor` around `getBy*`.
- Assert on rendered output the user sees, not on internal component state.

### Coverage

Coverage runs via `vp test --coverage` (v8 provider). The following are excluded from coverage and should not be unit-tested directly:

- `src/components/ui/**` — shadcn primitives
- `src/routeTree.gen.ts` — generated
- `src/router.tsx` — app-wiring entrypoint
- `src/integrations/**` — third-party integration glue
- `src/lib/database.types.ts` — generated Supabase types

If a folder is fundamentally not worth testing, exclude it in `vite.config.ts` rather than writing throwaway tests to lift a number.

### Component design for testability

Keep components free of plumbing. Components should accept callbacks (props) for side effects and not import `useRouter`, the Supabase client, or other infrastructure directly. The route or parent owns navigation, data fetching, and auth; the component renders UI and invokes the callbacks it was given. This makes tests trivial — pass a `vi.fn()` and assert on what the component called.

### Mocking

- Prefer real implementations over mocks. Mock only at integration boundaries (Supabase client, network, time, the router).
- Mocks reset automatically between tests — `clearMocks: true` is set globally in `vite.config.ts`. Do not call `vi.clearAllMocks()` in `beforeEach`.
- For module mocks, declare `vi.mock(...)` at the top of the file, then use `vi.mocked(importedFn)` inside each test to configure return values. This gives you full type safety on `mockResolvedValue` / `mockReturnValue` without casts.
- Hoist shared setup (`userEvent.setup()`, common renders) into `beforeEach` rather than repeating it in each test.
- For Supabase access, mock the function in `src/lib/queries/*` that the component calls — don't mock the Supabase client directly.

## Testing and Quality Gates

At minimum before opening or updating a PR:

1. `vp check`
2. `vp test` if any source or test files changed
3. `vp build` for larger or riskier changes

Pre-commit hooks are configured through Vite+ staged checks; ensure any auto-fixes are included in commits.

## Dependency Management

- Check for current stable package versions before adding dependencies
- Avoid deprecated packages/APIs when alternatives exist
- Always pin dependencies to **exact versions** — no `^` or `~` prefixes in `package.json`

## Common Pitfalls

- **Using package managers directly for routine workflows:** prefer `vp`
- **Assuming built-in command behavior follows scripts:** `vp dev` runs Vite+, not script aliases
- **For custom script behavior:** use `vp run <script>`
- **Bypassing checks before handoff:** always run quality gates from this file

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before starting work.
- [ ] Run `vp check` and `vp test` before final handoff.
- [ ] Run `vp build` when changes affect build/runtime boundaries.
- [ ] Prefer alias imports (`@/*`) over long relative paths.
- [ ] Keep environment variables validated through Zod config.
